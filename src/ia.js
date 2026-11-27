// IA SIMULÉE pour la démo.
// Elle lit la description des travaux, repère des mots-clés et propose
// des lignes à partir du catalogue de prestations de l'artisan.
// Dans le vrai produit, cette fonction serait remplacée par un appel au
// modèle hébergé sur OVH AI Endpoints, qui utiliserait l'outil « Créer un devis ».

const find = (prestations, mot) =>
  prestations.find((p) => p.nom.toLowerCase().includes(mot))

export function preparerLignes(texte, prestations, entreprise) {
  const t = (texte || '').toLowerCase()
  const lignes = []
  let forfait = false

  if (t.includes('chauffe')) {
    const p = find(prestations, 'chauffe-eau')
    lignes.push({ label: 'Pose chauffe-eau (forfait)', qte: 1, prix: p ? p.prix : 280 })
    const litres = t.match(/(\d+)\s*l\b/)
    lignes.push({ label: `Chauffe-eau ${litres ? litres[1] + ' L' : ''} (fourniture)`.replace('  ', ' '), qte: 1, prix: 390 })
    forfait = true
  }
  if (t.includes('mitigeur')) {
    const p = find(prestations, 'mitigeur')
    const n = t.match(/(\d+)\s*mitigeur/)
    lignes.push({ label: 'Pose d’un mitigeur', qte: n ? parseInt(n[1], 10) : 1, prix: p ? p.prix : 80 })
    forfait = true
  }
  if (t.includes('fuite')) {
    const p = find(prestations, 'fuite')
    lignes.push({ label: 'Recherche de fuite (forfait)', qte: 1, prix: p ? p.prix : 120 })
    forfait = true
  }

  // Heures de main-d'œuvre, seulement si aucun forfait ne les couvre déjà
  const heures = t.match(/(\d+)\s*h\b/)
  if (!forfait || (heures && !t.includes('chauffe'))) {
    lignes.push({ label: 'Main-d’œuvre', qte: heures ? parseInt(heures[1], 10) : 1, prix: Number(entreprise.tauxHoraire) || 45 })
  }

  const dep = Number(entreprise.deplacement) || 0
  if (dep > 0) lignes.push({ label: 'Déplacement', qte: 1, prix: dep })

  return lignes
}

// ---- IA réelle (devis) : appel à /api/extraire (fonction serveur) ----
// Le navigateur envoie la description MASQUÉE (noms de clients, e-mails, téléphones, adresses)
// et la liste des prestations SANS PRIX. Le client choisi n'est pas envoyé.
// Les prix sont repris ici depuis le catalogue. En cas d'échec : saisie manuelle, texte conservé.
import { versLignes } from './devis/extraction.js'
import { masquer } from './devis/masquage.js'

export const QUOTA_JOUR = 20
const CLE_QUOTA = 'easyfact-quota-ia'

// Quota de 20 préparations par jour, compté dans CE navigateur seulement (pas de serveur : non sûr).
function lireQuota() {
  const jour = new Date().toLocaleDateString('fr-CA', { timeZone: 'Europe/Paris' })
  try {
    const q = JSON.parse(localStorage.getItem(CLE_QUOTA) || 'null')
    return q && q.jour === jour ? q : { jour, n: 0 }
  } catch { return { jour, n: 0 } }
}
const compter = (q) => { try { localStorage.setItem(CLE_QUOTA, JSON.stringify({ ...q, n: q.n + 1 })) } catch { /* ignore */ } }
export const quotaRestant = () => Math.max(0, QUOTA_JOUR - lireQuota().n)

export async function extraireLignes(texte, prestations, nomsClients = []) {
  if (!String(texte || '').trim()) return { mode: 'manuel', raison: 'Aucune description saisie.' }
  const q = lireQuota()
  if (q.n >= QUOTA_JOUR) return { mode: 'manuel', raison: `Limite de ${QUOTA_JOUR} préparations par l’IA atteinte aujourd’hui.` }
  try {
    compter(q)
    const rep = await fetch('/api/extraire', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texte: masquer(texte, nomsClients), catalogue: prestations.map(({ id, nom, detail }) => ({ id, nom, detail })) }),
    })
    if (rep.status === 503 || rep.status === 404) return { mode: 'manuel', raison: 'L’assistant IA est désactivé.' }
    if (rep.status === 429) {
      const { retryAfter } = await rep.json().catch(() => ({}))
      return { mode: 'manuel', raison: `L’IA reçoit trop de demandes${retryAfter ? ` (réessayez dans ${Math.ceil(retryAfter)} s)` : ''}.` }
    }
    if (rep.status === 504) return { mode: 'manuel', raison: 'L’IA a mis trop de temps à répondre.' }
    if (!rep.ok) return { mode: 'manuel', raison: 'L’IA n’a pas pu lire la demande.' }
    const { travaux, informations_manquantes } = await rep.json()
    if (!Array.isArray(travaux) || travaux.length === 0) return { mode: 'manuel', raison: 'L’IA n’a reconnu aucune prestation.', remarques: informations_manquantes || [] }
    return { mode: 'ia', lignes: versLignes(travaux, prestations), remarques: informations_manquantes || [] }
  } catch {
    return { mode: 'manuel', raison: 'Assistant IA injoignable (connexion ?).' }
  }
}
