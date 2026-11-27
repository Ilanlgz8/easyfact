import { useEffect, useRef, useState } from 'react'

// Dictée vocale qui marche dans Edge, Brave et Chrome : le navigateur ENREGISTRE la voix
// (MediaRecorder), puis le serveur la fait transcrire par Whisper sur OVH AI Endpoints (/api/transcrire).
// On ne dépend plus du service vocal du navigateur (absent dans Brave, instable dans Edge).
// Interrupteurs : VITE_DICTEE_ACTIVE=true pour afficher le bouton ; IA_ACTIVE=true côté serveur.
// Le texte dicté est ajouté à la suite de `valeur`. Durée maximale : 60 s.
const DUREE_MAX = 60
const enregistrementPossible = typeof window !== 'undefined' && !!window.MediaRecorder && !!navigator.mediaDevices?.getUserMedia
const TYPE = typeof window !== 'undefined' && window.MediaRecorder
  ? ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4'].find((t) => MediaRecorder.isTypeSupported?.(t)) || ''
  : ''

const enBase64 = (blob) => new Promise((ok, ko) => {
  const r = new FileReader()
  r.onload = () => ok(String(r.result).split(',')[1] || '')
  r.onerror = ko
  r.readAsDataURL(blob)
})

export default function BoutonDictee({ valeur, onChange }) {
  const [etat, setEtat] = useState('repos') // repos | ecoute | transcription
  const [secondes, setSecondes] = useState(0)
  const [erreur, setErreur] = useState('')
  const rec = useRef(null)
  const flux = useRef(null)
  const minuteur = useRef(null)
  const valeurRef = useRef(valeur)
  valeurRef.current = valeur

  const couperMicro = () => {
    clearInterval(minuteur.current)
    flux.current?.getTracks().forEach((t) => t.stop())
    flux.current = null
  }
  useEffect(() => () => { try { rec.current?.state === 'recording' && rec.current.stop() } catch { /* ignore */ } couperMicro() }, [])

  if (!enregistrementPossible || import.meta.env.VITE_DICTEE_ACTIVE !== 'true') return null

  const envoyer = async (blob) => {
    setEtat('transcription')
    try {
      if (blob.size < 1000) { setErreur('Enregistrement trop court : parlez au moins une seconde.'); return }
      const rep = await fetch('/api/transcrire', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audio: await enBase64(blob), type: blob.type || TYPE || 'audio/webm' }),
      })
      if (rep.status === 503 || rep.status === 404) { setErreur('La dictée est désactivée (assistant IA coupé). Tapez le texte, ou utilisez Windows + H.'); return }
      if (rep.status === 429) { setErreur('Trop de demandes pour le moment : réessayez dans un instant.'); return }
      if (!rep.ok) { setErreur('La transcription a échoué. Réessayez, ou tapez le texte.'); return }
      const { texte } = await rep.json()
      if (!texte) { setErreur('Je n’ai rien compris. Parlez plus près du micro et réessayez.'); return }
      const base = valeurRef.current.trim()
      onChange(base ? base + ' ' + texte : texte)
    } catch {
      setErreur('Connexion impossible pour la transcription. Réessayez, ou tapez le texte.')
    } finally {
      setEtat('repos')
    }
  }

  const demarrer = async () => {
    setErreur('')
    let f
    try {
      f = await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch (e) {
      setErreur(e?.name === 'NotAllowedError' ? 'Micro refusé : autorisez-le (icône dans la barre d’adresse), puis réessayez.' : 'Aucun micro disponible.')
      return
    }
    flux.current = f
    const morceaux = []
    const r = new MediaRecorder(f, TYPE ? { mimeType: TYPE } : undefined)
    r.ondataavailable = (e) => { if (e.data?.size) morceaux.push(e.data) }
    r.onstop = () => { couperMicro(); envoyer(new Blob(morceaux, { type: r.mimeType || TYPE || 'audio/webm' })) }
    rec.current = r
    r.start()
    setSecondes(0)
    setEtat('ecoute')
    const debut = Date.now()
    minuteur.current = setInterval(() => {
      const s = Math.floor((Date.now() - debut) / 1000)
      setSecondes(s)
      if (s >= DUREE_MAX && r.state === 'recording') r.stop()
    }, 250)
  }

  const arreter = () => { if (rec.current?.state === 'recording') rec.current.stop() }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <button type="button" className={'btn ' + (etat === 'ecoute' ? 'btn-dark' : 'btn-outline')} onClick={etat === 'ecoute' ? arreter : demarrer}
        disabled={etat === 'transcription'} aria-pressed={etat === 'ecoute'} style={{ alignSelf: 'flex-start' }}>
        {etat === 'ecoute' ? `⏹ Arrêter (${secondes} s)` : etat === 'transcription' ? 'Transcription…' : '🎤 Dicter'}
      </button>
      {etat === 'ecoute' && <p className="small muted" role="status">Parlez, puis cliquez sur « Arrêter ». Le texte apparaît une ou deux secondes après (60 s au plus).</p>}
      {etat === 'transcription' && <p className="small muted" role="status">Transcription en cours…</p>}
      {erreur && <p className="small" role="alert" style={{ color: '#B45309' }}>{erreur}</p>}
      <p className="small muted">L’enregistrement est envoyé au service de transcription OVHcloud (Europe), puis effacé : ni l’audio ni le texte ne sont conservés par EasyFact.</p>
    </div>
  )
}
