// Fonction serverless : POST /api/transcrire  { audio: base64, type: 'audio/webm' } -> { texte }
// Même interrupteur que l'IA du devis (IA_ACTIVE) et même clé OVH.
// Journaux : issue, durée, secondes d'audio facturées. Jamais l'audio ni le texte.
// ATTENTION : pas d'authentification ni de quota serveur (pas de comptes) : ne pas activer en production publique.
import { transcrire, MODELE_TRANSCRIPTION, AUDIO_MAX_OCTETS } from '../src/devis/transcription.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ erreur: 'méthode non autorisée' })
  if (process.env.IA_ACTIVE !== 'true') return res.status(503).json({ desactive: true, erreur: 'IA désactivée' })
  const cle = process.env.OVH_AI_ENDPOINTS_ACCESS_TOKEN
  if (!cle) return res.status(503).json({ desactive: true, erreur: 'IA non configurée' })

  const { audio, type } = req.body || {}
  if (typeof audio !== 'string' || typeof type !== 'string' || audio.length > AUDIO_MAX_OCTETS * 1.4) return res.status(400).json({ erreur: 'requête invalide' })
  const octets = Buffer.from(audio, 'base64')

  const debut = Date.now()
  const r = await transcrire(octets, type, { cle })
  console.log(JSON.stringify({ evt: 'transcrire', modele: MODELE_TRANSCRIPTION, ok: r.ok, erreur: r.ok ? null : r.erreur, tentatives: r.tentatives, ms: Date.now() - debut, secondes: r.secondes ?? null }))
  if (!r.ok) {
    if (['audio vide', 'audio trop long', 'format audio refusé'].includes(r.erreur)) return res.status(400).json({ erreur: r.erreur })
    if (r.erreur === 'HTTP 429') return res.status(429).json({ erreur: 'trop de demandes' })
    if (r.erreur === 'délai dépassé') return res.status(504).json({ erreur: r.erreur })
    return res.status(502).json({ erreur: r.erreur })
  }
  return res.status(200).json({ texte: r.texte })
}
