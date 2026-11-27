// Fonction serverless : prix du marché (INSEE).
//   GET  /api/marche?indices=BT18a,CHENE  -> { series: { CODE: { code, libelle, source, serie: [{mois, valeur}] } } }
//   POST /api/marche { metier }                       -> { indice }     (l'IA rattache un métier « Autre » à un index)
//   POST /api/marche { metier, action: 'catalogue' }  -> { elements }   (l'IA propose les NOMS d'un catalogue de départ)
// Interrupteur : MARCHE_ACTIF=true (désactivé par défaut). Les POST exigent aussi IA_ACTIVE=true et la clé OVH.
// Rien de personnel n'est envoyé à l'INSEE (seulement les identifiants des séries). Journaux sans le métier saisi.
// L'IA ne donne jamais de prix : ses réponses sont validées contre des listes fermées.
import { SERIES, URL_SDMX, lireSdmx, serieConnue, sourceDe, consigneIndice, validerIndice, consigneCatalogue, validerCatalogue } from '../src/marche/indices.js'
import { MODELE, URL_OVH } from '../src/devis/appelModele.js'

const CACHE_MS = 12 * 3600 * 1000
const MAX_CODES = 20
const cache = new Map() // code -> { t, serie }

async function seriesInsee(codes) {
  const manquants = codes.filter((c) => { const e = cache.get(c); return !e || Date.now() - e.t >= CACHE_MS })
  if (manquants.length) {
    const ids = manquants.map((c) => SERIES[c].idbank).join('+')
    const rep = await fetch(`${URL_SDMX}${ids}?lastNObservations=36`, { signal: AbortSignal.timeout(20000) })
    if (!rep.ok) throw new Error(`INSEE HTTP ${rep.status}`)
    const lu = lireSdmx(await rep.text())
    for (const c of manquants) {
      const serie = lu[SERIES[c].idbank] || []
      if (serie.length >= 2) cache.set(c, { t: Date.now(), serie })
    }
  }
  const out = {}
  for (const c of codes) {
    const e = cache.get(c)
    if (e) out[c] = { code: c, libelle: SERIES[c].libelle, source: sourceDe(c), serie: e.serie }
  }
  return out
}

async function demanderIA(systeme, metier, maxTokens, cle) {
  const rep = await fetch(URL_OVH, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cle}` },
    body: JSON.stringify({
      model: MODELE, temperature: 0, max_tokens: maxTokens, response_format: { type: 'json_object' },
      messages: [{ role: 'system', content: systeme }, { role: 'user', content: `Métier : """${metier}"""` }],
    }),
    signal: AbortSignal.timeout(20000),
  })
  if (!rep.ok) return { erreur: `HTTP ${rep.status}` }
  const j = await rep.json()
  return { contenu: j.choices?.[0]?.message?.content, tokens: j.usage }
}

export default async function handler(req, res) {
  if (process.env.MARCHE_ACTIF !== 'true') return res.status(503).json({ desactive: true, erreur: 'prix du marché désactivés' })
  const debut = Date.now()

  if (req.method === 'GET') {
    const p = new URL(req.url, 'http://x').searchParams
    const brut = p.get('indices') || p.get('indice') || req.query?.indices || ''
    const codes = [...new Set(String(brut).split(',').map((c) => c.trim()).filter(Boolean))]
    if (!codes.length || codes.length > MAX_CODES || !codes.every(serieConnue)) return res.status(400).json({ erreur: 'indices inconnus' })
    try {
      const series = await seriesInsee(codes)
      console.log(JSON.stringify({ evt: 'marche', codes: codes.length, trouves: Object.keys(series).length, ok: true, ms: Date.now() - debut }))
      return res.status(200).json({ series })
    } catch (e) {
      console.log(JSON.stringify({ evt: 'marche', ok: false, erreur: e?.name === 'TimeoutError' ? 'délai dépassé' : String(e?.message || 'erreur'), ms: Date.now() - debut }))
      return res.status(502).json({ erreur: 'INSEE injoignable' })
    }
  }

  if (req.method === 'POST') {
    const cle = process.env.OVH_AI_ENDPOINTS_ACCESS_TOKEN
    if (process.env.IA_ACTIVE !== 'true' || !cle) return res.status(503).json({ desactive: true, erreur: 'IA désactivée' })
    const metier = typeof req.body?.metier === 'string' ? req.body.metier.replace(/["`\r\n]/g, ' ').trim().slice(0, 60) : ''
    if (!metier) return res.status(400).json({ erreur: 'métier manquant' })
    const catalogue = req.body?.action === 'catalogue'
    try {
      const r = catalogue ? await demanderIA(consigneCatalogue(), metier, 1200, cle) : await demanderIA(consigneIndice(), metier, 20, cle)
      const valeur = r.erreur ? null : catalogue ? validerCatalogue(r.contenu) : validerIndice(r.contenu)
      console.log(JSON.stringify({ evt: catalogue ? 'marche-catalogue' : 'marche-metier', modele: MODELE, ok: !!valeur, erreur: r.erreur ?? (valeur ? null : 'réponse invalide'), ms: Date.now() - debut, tokens: r.tokens ?? null }))
      if (!valeur) return res.status(502).json({ erreur: r.erreur || 'réponse invalide' })
      return res.status(200).json(catalogue ? { elements: valeur } : { indice: valeur })
    } catch (e) {
      return res.status(e?.name === 'TimeoutError' ? 504 : 502).json({ erreur: 'IA injoignable' })
    }
  }

  return res.status(405).json({ erreur: 'méthode non autorisée' })
}
