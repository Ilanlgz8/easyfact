// Fonction serverless : prix du marché (index INSEE du bâtiment).
//   GET  /api/marche?indice=BT18a  -> { code, libelle, serie: [{mois, valeur}], source }
//   POST /api/marche { metier }    -> { indice }   (l'IA rattache un métier « Autre » à un index de la liste)
// Interrupteur : MARCHE_ACTIF=true (désactivé par défaut). Le POST exige aussi IA_ACTIVE=true et la clé OVH.
// Rien de personnel n'est envoyé à l'INSEE (seulement l'identifiant de la série). Journaux sans le métier saisi.
import { INDICES, URL_SDMX, lireSdmx, indiceConnu, consigneIndice, validerIndice } from '../src/marche/indices.js'
import { MODELE, URL_OVH } from '../src/devis/appelModele.js'

const CACHE_MS = 12 * 3600 * 1000
const cache = new Map() // code -> { t, serie }

async function serieInsee(code) {
  const c = cache.get(code)
  if (c && Date.now() - c.t < CACHE_MS) return c.serie
  const { idbank } = INDICES[code]
  const rep = await fetch(`${URL_SDMX}${idbank}?lastNObservations=36`, { signal: AbortSignal.timeout(15000) })
  if (!rep.ok) throw new Error(`INSEE HTTP ${rep.status}`)
  const serie = lireSdmx(await rep.text())[idbank] || []
  if (serie.length < 2) throw new Error('INSEE série vide')
  cache.set(code, { t: Date.now(), serie })
  return serie
}

async function classerMetier(metier, cle) {
  const rep = await fetch(URL_OVH, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cle}` },
    body: JSON.stringify({
      model: MODELE, temperature: 0, max_tokens: 20, response_format: { type: 'json_object' },
      messages: [{ role: 'system', content: consigneIndice() }, { role: 'user', content: `Métier : """${metier}"""` }],
    }),
    signal: AbortSignal.timeout(15000),
  })
  if (!rep.ok) return { erreur: `HTTP ${rep.status}` }
  const j = await rep.json()
  const indice = validerIndice(j.choices?.[0]?.message?.content)
  return indice ? { indice, tokens: j.usage } : { erreur: 'réponse invalide' }
}

export default async function handler(req, res) {
  if (process.env.MARCHE_ACTIF !== 'true') return res.status(503).json({ desactive: true, erreur: 'prix du marché désactivés' })
  const debut = Date.now()

  if (req.method === 'GET') {
    const code = new URL(req.url, 'http://x').searchParams.get('indice') || req.query?.indice
    if (!indiceConnu(code)) return res.status(400).json({ erreur: 'indice inconnu' })
    try {
      const serie = await serieInsee(code)
      console.log(JSON.stringify({ evt: 'marche', code, ok: true, ms: Date.now() - debut }))
      return res.status(200).json({ code, libelle: INDICES[code].libelle, serie, source: 'INSEE, Index du bâtiment BT (base 2010)' })
    } catch (e) {
      console.log(JSON.stringify({ evt: 'marche', code, ok: false, erreur: e?.name === 'TimeoutError' ? 'délai dépassé' : String(e?.message || 'erreur'), ms: Date.now() - debut }))
      return res.status(502).json({ erreur: 'INSEE injoignable' })
    }
  }

  if (req.method === 'POST') {
    if (process.env.IA_ACTIVE !== 'true' || !process.env.OVH_AI_ENDPOINTS_ACCESS_TOKEN) return res.status(503).json({ desactive: true, erreur: 'IA désactivée' })
    const metier = typeof req.body?.metier === 'string' ? req.body.metier.trim().slice(0, 60) : ''
    if (!metier) return res.status(400).json({ erreur: 'métier manquant' })
    try {
      const r = await classerMetier(metier, process.env.OVH_AI_ENDPOINTS_ACCESS_TOKEN)
      console.log(JSON.stringify({ evt: 'marche-metier', modele: MODELE, ok: !!r.indice, erreur: r.erreur ?? null, ms: Date.now() - debut, tokens: r.tokens ?? null }))
      if (!r.indice) return res.status(502).json({ erreur: r.erreur })
      return res.status(200).json({ indice: r.indice })
    } catch (e) {
      return res.status(e?.name === 'TimeoutError' ? 504 : 502).json({ erreur: 'IA injoignable' })
    }
  }

  return res.status(405).json({ erreur: 'méthode non autorisée' })
}
