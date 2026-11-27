// Fonction serverless Vercel : POST /api/extraire
// Interrupteur : IA_ACTIVE doit valoir exactement "true", sinon la fonction répond 503 (désactivée).
// Clé : OVH_AI_ENDPOINTS_ACCESS_TOKEN, variable d'environnement, jamais dans le dépôt.
// Journaux : issue, durée, modèle, version du prompt, tokens. Jamais le texte du client ni la clé.
// ATTENTION : sans comptes ni base, cette fonction n'a ni authentification ni quota serveur.
// Ne pas l'activer en production publique (voir EXPLOITATION.md).
import { extraireTravaux, MODELE, PROMPT_VERSION } from '../src/devis/appelModele.js'
import { masquer } from '../src/devis/masquage.js'
import { TEXTE_MAX, metiersPropres } from '../src/devis/extraction.js'

const catalogueValide = (c) => Array.isArray(c) && c.length > 0 && c.length <= 100 &&
  c.every((p) => p && typeof p.id === 'string' && typeof p.nom === 'string' && p.id.length < 40 && p.nom.length < 120)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ erreur: 'méthode non autorisée' })
  if (process.env.IA_ACTIVE !== 'true') return res.status(503).json({ desactive: true, erreur: 'IA désactivée' })
  const cle = process.env.OVH_AI_ENDPOINTS_ACCESS_TOKEN
  if (!cle) return res.status(503).json({ desactive: true, erreur: 'IA non configurée' })

  const { texte, catalogue, metiers } = req.body || {}
  if (typeof texte !== 'string' || texte.length > TEXTE_MAX * 2 || !catalogueValide(catalogue)) return res.status(400).json({ erreur: 'requête invalide' })
  const cat = catalogue.map((p) => ({ id: p.id, nom: p.nom, detail: typeof p.detail === 'string' ? p.detail.slice(0, 80) : '' }))

  const debut = Date.now()
  // Deuxième passe de masquage côté serveur (e-mails, téléphones, adresses) ; les noms sont masqués par le navigateur.
  const r = await extraireTravaux(masquer(texte), cat, { cle, metiers: metiersPropres(metiers) })
  const tokens = (r.usages || []).reduce((s, u) => ({ entree: s.entree + (u.prompt_tokens || 0), sortie: s.sortie + (u.completion_tokens || 0) }), { entree: 0, sortie: 0 })
  console.log(JSON.stringify({ evt: 'extraire', modele: MODELE, prompt: PROMPT_VERSION, ok: r.ok, erreur: r.ok ? null : r.erreur, tentatives: r.tentatives, ms: Date.now() - debut, tokens }))
  if (!r.ok) {
    if (r.erreur === 'texte vide') return res.status(400).json({ erreur: r.erreur })
    if (r.erreur === 'HTTP 429') return res.status(429).json({ erreur: 'trop de demandes', retryAfter: r.retryAfter })
    if (r.erreur === 'délai dépassé') return res.status(504).json({ erreur: r.erreur })
    return res.status(502).json({ erreur: r.erreur })
  }
  return res.status(200).json({ travaux: r.travaux, informations_manquantes: r.informations_manquantes })
}
