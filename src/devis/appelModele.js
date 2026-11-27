// Appel à Mistral Small 3.2 sur OVH AI Endpoints. CÔTÉ SERVEUR UNIQUEMENT :
// la clé est lue dans process.env et ne doit jamais être importée par le navigateur.
//
// Règles : 20 s par essai ; UN réessai au plus, tous types d'échec confondus ;
// pas de réessai si la clé est refusée (401/403) ; sur 429, on attend le délai demandé
// s'il est court (≤ ATTENTE_429_MAX), sinon on abandonne -> saisie manuelle.
// Aucun modèle de repli.
import { consigne, validerReponse, TEXTE_MAX, PROMPT_VERSION } from './extraction.js'

export const MODELE = 'Mistral-Small-3.2-24B-Instruct-2506'
export const URL_OVH = 'https://oai.endpoints.kepler.ai.cloud.ovh.net/v1/chat/completions'
export const DELAI_MS = 20000
export const MAX_TOKENS = 600
export const ATTENTE_429_MAX = 5
export { PROMPT_VERSION }

const pause = (ms) => new Promise((r) => setTimeout(r, ms))

async function unAppel(texte, catalogue, cle, fetchFn) {
  const rep = await fetchFn(URL_OVH, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cle}` },
    body: JSON.stringify({
      model: MODELE,
      temperature: 0,
      max_tokens: MAX_TOKENS,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: consigne(catalogue) },
        { role: 'user', content: `Demande du client :\n"""${texte}"""` },
      ],
    }),
    signal: AbortSignal.timeout(DELAI_MS),
  })
  if (!rep.ok) {
    // Message d'OVH (sans la clé), utile au diagnostic ; la fonction serveur ne le journalise pas.
    const detail = await rep.text?.().then((t) => t.slice(0, 300)).catch(() => '')
    const ra = Number(rep.headers?.get?.('retry-after'))
    return { ok: false, erreur: `HTTP ${rep.status}`, detail, usage: null, retryAfter: Number.isFinite(ra) ? ra : null }
  }
  const json = await rep.json()
  const usage = json.usage || null
  const v = validerReponse(json.choices?.[0]?.message?.content, catalogue)
  return { ...v, usage }
}

export async function extraireTravaux(texte, catalogue, { cle, fetchFn = fetch, attendre = pause } = {}) {
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
    const fin = { ok: false, erreur: dernier.erreur, detail: dernier.detail, retryAfter: dernier.retryAfter ?? null, tentatives: i, usages }
    // Clé refusée : réessayer ne servirait à rien.
    if (dernier.erreur === 'HTTP 401' || dernier.erreur === 'HTTP 403') return fin
    if (dernier.erreur === 'HTTP 429') {
      const ra = dernier.retryAfter
      if (i === 2 || ra === null || ra > ATTENTE_429_MAX) return fin
      await attendre(ra * 1000)
    }
  }
  return { ok: false, erreur: dernier.erreur, retryAfter: dernier.retryAfter ?? null, tentatives: 2, usages }
}
