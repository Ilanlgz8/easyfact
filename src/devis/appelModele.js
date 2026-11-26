// Appel à Mistral Small 3.2 sur OVH AI Endpoints. CÔTÉ SERVEUR UNIQUEMENT :
// la clé est lue dans process.env et ne doit jamais être importée par le navigateur.
import { consigne, validerReponse, TEXTE_MAX } from './extraction.js'

export const MODELE = 'Mistral-Small-3.2-24B-Instruct-2506'
export const URL_OVH = 'https://oai.endpoints.kepler.ai.cloud.ovh.net/v1/chat/completions'

async function unAppel(texte, catalogue, cle, fetchFn) {
  const rep = await fetchFn(URL_OVH, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cle}` },
    body: JSON.stringify({
      model: MODELE,
      temperature: 0,
      max_tokens: 800,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: consigne(catalogue) },
        { role: 'user', content: `Demande du client :\n"""${texte}"""` },
      ],
    }),
    signal: AbortSignal.timeout(20000),
  })
  if (!rep.ok) return { ok: false, erreur: `HTTP ${rep.status}`, usage: null }
  const json = await rep.json()
  const usage = json.usage || null
  const v = validerReponse(json.choices?.[0]?.message?.content, catalogue)
  return { ...v, usage }
}

// Un appel, un seul réessai si la réponse est invalide, puis échec (=> saisie manuelle).
export async function extraireTravaux(texte, catalogue, { cle, fetchFn = fetch } = {}) {
  const t = String(texte || '').trim().slice(0, TEXTE_MAX)
  if (!t) return { ok: false, erreur: 'texte vide', tentatives: 0, usages: [] }
  const usages = []
  let dernier
  for (let i = 1; i <= 2; i++) {
    try {
      dernier = await unAppel(t, catalogue, cle, fetchFn)
    } catch (e) {
      dernier = { ok: false, erreur: e?.name === 'TimeoutError' ? 'délai dépassé' : 'erreur réseau' }
    }
    if (dernier.usage) usages.push(dernier.usage)
    if (dernier.ok) return { ...dernier, tentatives: i, usages }
  }
  return { ok: false, erreur: dernier.erreur, tentatives: 2, usages }
}
