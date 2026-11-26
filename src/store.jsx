import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { seed } from './data.js'
import { round2, calculerTotaux } from './devis/calcul.js'
export { round2 }

const KEY = 'easyfact-demo-v2' // v2 : devis et factures avec leurs lignes
const Ctx = createContext(null)

function load() {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw)
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
  const [state, setState] = useState(load)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(state)) } catch (e) { /* ignore */ }
  }, [state])

  const notify = useCallback((msg) => {
    setToast(msg)
    window.clearTimeout(notify.t)
    notify.t = window.setTimeout(() => setToast(null), 3200)
  }, [])

  const update = (fn) => setState((s) => ({ ...s, ...fn(s) }))

  const api = {
    ...state,
    toast,
    notify,
    client: (id) => state.clients.find((c) => c.id === id) || { nom: 'Client inconnu', type: '' },

    login: (email) => update((s) => ({ user: { prenom: s.user?.prenom || 'Lucas', email } })),
    register: ({ prenom, email }) => update(() => ({ user: { prenom, email }, onboarded: false })),
    logout: () => update(() => ({ user: null })),
    saveEntreprise: (data) => update((s) => ({ entreprise: { ...s.entreprise, ...data }, onboarded: true })),

    addClient: (nom, type) => {
      const id = 'c' + Date.now()
      update((s) => ({ clients: [...s.clients, { id, nom, type }] }))
      return id
    },
    addPrestation: (p) => update((s) => ({ prestations: [...s.prestations, { ...p, id: 'p' + Date.now() }] })),
    updatePrestation: (id, p) => update((s) => ({ prestations: s.prestations.map((x) => (x.id === id ? { ...x, ...p } : x)) })),

    updateDevis: (id, patch) => update((s) => ({ devis: s.devis.map((d) => (d.id === id ? { ...d, ...patch } : d)) })),
    signDevis: (id) => update((s) => ({ devis: s.devis.map((d) => (d.id === id ? { ...d, statut: 'signe' } : d)) })),
    sendDevis: (id) => update((s) => ({ devis: s.devis.map((d) => (d.id === id ? { ...d, statut: 'attente' } : d)) })),
    addDevis: (doc) => {
      const numero = nextNumero(state.devis)
      update((s) => ({ devis: [{ ...doc, id: 'd' + Date.now(), numero, date: today(), statut: 'attente' }, ...s.devis] }))
      return numero
    },
    addFacture: (doc, fromDevisId) => update((s) => ({
      factures: [{ ...doc, id: 'f' + Date.now(), numero: nextNumero(s.factures), date: today(), statut: 'attente' }, ...s.factures],
      devis: fromDevisId ? s.devis.map((d) => (d.id === fromDevisId ? { ...d, statut: 'facture' } : d)) : s.devis,
    })),
    markPaid: (id) => update((s) => ({ factures: s.factures.map((f) => (f.id === id ? { ...f, statut: 'payee' } : f)) })),

    resetDemo: () => setState({ ...structuredClone(seed), user: state.user, onboarded: true }),
  }

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>
}

export const useStore = () => useContext(Ctx)
