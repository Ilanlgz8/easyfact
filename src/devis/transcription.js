// Transcription de la dictée par Whisper sur OVH AI Endpoints. CÔTÉ SERVEUR UNIQUEMENT.
// Modèle ajouté le 27/11/2026 avec accord (whisper-large-v3-turbo, API compatible OpenAI).
// Règles : 20 s par essai, un réessai au plus (réseau / 5xx), pas de réessai sur 401/403/429.
// Rien n'est conservé : ni l'audio, ni le texte ne sont journalisés.

export const MODELE_TRANSCRIPTION = 'whisper-large-v3-turbo'
export const URL_TRANSCRIPTION = 'https://oai.endpoints.kepler.ai.cloud.ovh.net/v1/audio/transcriptions'
export const AUDIO_MAX_OCTETS = 2_000_000 // ≈ 60 s de voix compressée
export const TYPES_AUDIO = ['audio/webm', 'audio/ogg', 'audio/mp4', 'audio/mpeg', 'audio/wav']

// Whisper « invente » parfois une phrase sur du silence (génériques de sous-titres) : on l'ignore.
const HALLUCINATIONS = [/sous[- ]titr/i, /merci d'avoir regard/i, /abonnez[- ]vous/i, /amara\.org/i, /^\W*$/]
export function nettoyerTexte(t) {
  const s = String(t || '').trim()
  if (!s || HALLUCINATIONS.some((re) => re.test(s))) return ''
  return s.slice(0, 2000)
}

const extension = (type) => ({ 'audio/webm': 'webm', 'audio/ogg': 'ogg', 'audio/mp4': 'm4a', 'audio/mpeg': 'mp3', 'audio/wav': 'wav' })[type] || 'webm'

export async function transcrire(audio, type, { cle, fetchFn = fetch } = {}) {
  if (!audio?.length) return { ok: false, erreur: 'audio vide' }
  if (audio.length > AUDIO_MAX_OCTETS) return { ok: false, erreur: 'audio trop long' }
  const base = TYPES_AUDIO.find((t) => String(type || '').startsWith(t))
  if (!base) return { ok: false, erreur: 'format audio refusé' }
  let dernier
  for (let i = 1; i <= 2; i++) {
    try {
      const fd = new FormData()
      fd.append('file', new Blob([audio], { type: base }), 'dictee.' + extension(base))
      fd.append('model', MODELE_TRANSCRIPTION)
      fd.append('language', 'fr')
      fd.append('response_format', 'json')
      const rep = await fetchFn(URL_TRANSCRIPTION, { method: 'POST', headers: { Authorization: `Bearer ${cle}` }, body: fd, signal: AbortSignal.timeout(20000) })
      if (rep.ok) {
        const j = await rep.json()
        return { ok: true, texte: nettoyerTexte(j.text), secondes: j.usage?.seconds ?? null, tentatives: i }
      }
      dernier = { ok: false, erreur: `HTTP ${rep.status}` }
      if (rep.status < 500) return { ...dernier, tentatives: i }
    } catch (e) {
      dernier = { ok: false, erreur: e?.name === 'TimeoutError' ? 'délai dépassé' : 'erreur réseau' }
    }
  }
  return { ...dernier, tentatives: 2 }
}
