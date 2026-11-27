import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { seed } from './data.js'
import { round2, calculerTotaux } from './devis/calcul.js'
import { creerDevis, nouvelleVersion } from './devis/cycle.js'
import { moisParis } from './marche/indices.js'
export { round2 }

const KEY = 'easyfact-demo-v3' // v3 : données 100 % fictives (adresses, e-mails .example, téléphone de la plage fiction ARCEP)
const Ctx = createContext(null)

// Ajouts rétro-compatibles aux données déjà enregistrées : date des prix d'exemple (prix du marché).
function completer(etat) {
  const ref = new Map(seed.prestations.map((p) => [p.id, p]))
  const prestations = (etat.prestations || []).map((p) => {
    const s = ref.get(p.id)
    return !p.prixDepuis && s && Number(s.prix) === Number(p.prix) ? { ...p, prixDepuis: s.prixDepuis } : p
  })
  return { ...etat, prestations }
}

function load() {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return completer(JSON.parse(raw))
  } catch (e) { /* stockage indisponible : on repart des données d'exemple */ }
  return structuredClone(seed)
}

// ---- Calculs ----
// Les calculs sont dans src/devis/calcul.js (testés sans navigateur).
export function totaux(doc) {
  if (!doc.lignes) return { ht: null, tva: null, ttc: doc.total }
  return calculerTotaux(doc.lignes, doc.tva)
}

export const montant = (doc) => totaux(doc).ttc

// Ce que le client doit encore payer (acompte déduit)
export const reste = (doc) => round2(montant(doc) * (1 - (doc.acompte || 0) / 100))

export const today = () => new Date().toISOString().slice(0, 10)

// '2026-11-24' -> '24 novembre 2026' (calculé sans fuseau horaire pour éviter le décalage d'un jour)
export function dateFr(iso, plusJours = 0) {
  if (!iso) return ''
  const [y, m, d] = iso.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d + plusJours))
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(dt)
}

export const euros = (n) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n || 0)

const nextNumero = (list) => {
  const max = list.reduce((m, d) => Math.max(m, parseInt(d.numero, 10) || 0), 0)
  return String(max + 1).padStart(3, '0')
}

export function StoreProvider({ children }) {
  const [state, setStateBrut] = useState(load)
  const [toast, setToast] = useState(null)
  // Copie synchrone de l'état : deux actions rapprochées (double clic) voient le même état à jour.
  const ref = useRef(state)
  const setState = useCallback((next) => {
    const v = typeof next === 'function' ? next(ref.current) : next
    ref.current = v
    setStateBrut(v)
    try { localStorage.setItem(KEY, JSON.stringify(v)) } catch (e) { /* stockage indisponible */ }
  }, [])

  // Autre onglet : on reprend son état pour ne pas l'écraser (le verrou de version s'appuie dessus).
  useEffect(() => {
    const surStockage = (e) => {
      if (e.key !== KEY || !e.newValue) return
      try { const v = JSON.parse(e.newValue); ref.current = v; setStateBrut(v) } catch (err) { /* ignore */ }
    }
    window.addEventListener('storage', surStockage)
    return () => window.removeEventListener('storage', surStockage)
  }, [])

  const notify = useCallback((msg) => {
    setToast(msg)
    window.clearTimeout(notify.t)
    notify.t = window.setTimeout(() => setToast(null), 3200)
  }, [])

  const update = (fn) => setState((s) => ({ ...s, ...fn(s) }))
  const fiche = (s, clientId) => s.clients.find((c) => c.id === clientId) || null

  const api = {
    ...state,
    toast,
    notify,
    client: (id) => state.clients.find((c) => c.id === id) || { nom: 'Client inconnu', type: '' },

    login: (email) => update((s) => ({ user: { prenom: s.user?.prenom || 'Lucas', email } })),
    register: ({ prenom, email }) => update(() => ({ user: { prenom, email }, onboarded: false })),
    enterDemo: () => update(() => ({ user: { prenom: 'Compte test', email: 'test@demo.example' }, onboarded: true })),
    logout: () => update(() => ({ user: null })),
    saveEntreprise: (data) => update((s) => ({ entreprise: { ...s.entreprise, ...data }, onboarded: true })),

    addClient: (nom, type) => {
      const id = 'c' + Date.now()
      update((s) => ({ clients: [...s.clients, { id, nom, type }] }))
      return id
    },
    addPrestation: (p) => update((s) => ({ prestations: [...s.prestations, { ...p, id: 'p' + Date.now(), prixDepuis: moisParis() }] })),
    // Le mois du prix est retenu pour le comparer au marché (index INSEE) ; il change quand le prix change.
    updatePrestation: (id, p) => update((s) => ({ prestations: s.prestations.map((x) => (x.id !== id ? x
      : { ...x, ...p, prixDepuis: Number(p.prix) === Number(x.prix) && x.prixDepuis ? x.prixDepuis : moisParis() })) })),

    signDevis: (id) => update((s) => ({ devis: s.devis.map((d) => (d.id === id ? { ...d, statut: 'signe' } : d)) })),
    sendDevis: (id) => update((s) => ({ devis: s.devis.map((d) => (d.id === id ? { ...d, statut: 'attente' } : d)) })),
    // Validation d'un devis (idempotente grâce à la clé) : renvoie { devis, dejaFait } ou { erreur }.
    validerDevis: (doc, cle) => {
      const s = ref.current
      const r = creerDevis(s, doc, { id: 'd' + Date.now(), date: today(), cle, entreprise: s.entreprise, client: fiche(s, doc.clientId) })
      if (!r.erreur && !r.dejaFait) setState(r.etat)
      return r
    },
    // Nouvelle version d'un devis validé : l'ancien reste consultable (statut « remplacé »).
    nouvelleVersionDevis: (ancienId, doc, cle) => {
      const s = ref.current
      const r = nouvelleVersion(s, ancienId, doc, { id: 'd' + Date.now(), date: today(), cle, entreprise: s.entreprise, client: fiche(s, doc.clientId) })
      if (!r.erreur && !r.dejaFait) setState(r.etat)
      return r
    },
    addFacture: (doc, fromDevisId) => update((s) => ({
      factures: [{ ...doc, id: 'f' + Date.now(), numero: nextNumero(s.factures), date: today(), statut: 'attente' }, ...s.factures],
      devis: fromDevisId ? s.devis.map((d) => (d.id === fromDevisId ? { ...d, statut: 'facture' } : d)) : s.devis,
    })),
    markPaid: (id) => update((s) => ({ factures: s.factures.map((f) => (f.id === id ? { ...f, statut: 'payee' } : f)) })),

    resetDemo: () => setState({ ...structuredClone(seed), user: ref.current.user, onboarded: true }),
  }

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>
}

export const useStore = () => useContext(Ctx)
