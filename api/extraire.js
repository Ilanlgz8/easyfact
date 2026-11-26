// Fonction serverless Vercel : POST /api/extraire
// Interrupteur : IA_ACTIVE doit valoir exactement "true", sinon la fonction répond 503 (désactivée).
// Clé : OVH_AI_ENDPOINTS_ACCESS_TOKEN, variable d'environnement Vercel, jamais dans le dépôt.
// Journaux : uniquement l'issue et la durée, jamais le texte du client ni la clé.
import { extraireTravaux } from '../src/devis/appelModele.js'

const catalogueValide = (c) => Array.isArray(c) && c.length > 0 && c.length <= 100 &&
  c.every((p) => p && typeof p.id === 'string' && typeof p.nom === 'string' && p.id.length < 40 && p.nom.length < 120)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ erreur: 'méthode non autorisée' })
  if (process.env.IA_ACTIVE !== 'true') return res.status(503).json({ desactive: true, erreur: 'IA désactivée' })
  const cle = process.env.OVH_AI_ENDPOINTS_ACCESS_TOKEN
  if (!cle) return res.status(503).json({ desactive: true, erreur: 'IA non configurée' })

  const { texte, catalogue } = req.body || {}
  if (typeof texte !== 'string' || !catalogueValide(catalogue)) return res.status(400).json({ erreur: 'requête invalide' })
  const cat = catalogue.map((p) => ({ id: p.id, nom: p.nom, detail: typeof p.detail === 'string' ? p.detail.slice(0, 80) : '' }))

  const debut = Date.now()
  const r = await extraireTravaux(texte, cat, { cle })
  console.log(JSON.stringify({ evt: 'extraire', ok: r.ok, erreur: r.ok ? null : r.erreur, tentatives: r.tentatives, ms: Date.now() - debut }))
  if (!r.ok) return res.status(r.erreur === 'texte vide' ? 400 : 502).json({ erreur: r.erreur })
  return res.status(200).json({ travaux: r.travaux, remarques: r.remarques })
}
