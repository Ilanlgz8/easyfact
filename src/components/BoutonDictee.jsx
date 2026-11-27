import { useEffect, useRef, useState } from 'react'

// Dictée vocale (Web Speech API, fr-FR). Ajoute le texte dicté à la suite de `valeur`.
// Masqué si le navigateur ne gère pas la reconnaissance vocale (ex. Firefox).
const Reconnaissance = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition)

export default function BoutonDictee({ valeur, onChange }) {
  const [actif, setActif] = useState(false)
  const [erreur, setErreur] = useState('')
  const [phase, setPhase] = useState('')
  const rec = useRef(null)

  useEffect(() => () => rec.current?.abort(), [])

  if (!Reconnaissance) return null

  const demarrer = () => {
    setErreur('')
    const r = new Reconnaissance()
    r.lang = 'fr-FR'
    // Une phrase à la fois : plus fiable que le mode continu (qui reste parfois muet).
    r.continuous = false
    r.interimResults = true
    const base = valeur.trim()
    let recu = false
    let enErreur = false
    let delai = null
    setPhase('Connexion au micro…')
    r.onaudiostart = () => setPhase('Micro actif : parlez.')
    r.onspeechstart = () => {
      setPhase('Voix détectée…')
      // Voix entendue mais aucun texte du service Google au bout de 10 s : on abandonne avec un message clair.
      delai = setTimeout(() => {
        if (recu) return
        enErreur = true
        setErreur('Le service de dictée de Google ne répond pas (VPN, antivirus ou pare-feu ?). Utilisez Windows + H dans le champ.')
        r.abort()
      }, 10000)
    }
    r.onresult = (e) => {
      recu = true
      clearTimeout(delai)
      setPhase('')
      const dit = [...e.results].map((res) => res[0].transcript).join(' ').trim()
      onChange(base && dit ? base + ' ' + dit : base || dit)
    }
    r.onerror = (e) => {
      enErreur = true
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') setErreur('Micro refusé : autorisez-le dans le navigateur.')
      else if (e.error === 'no-speech') setErreur('Aucune parole détectée.')
      else if (e.error === 'network') setErreur('Ce navigateur ne fournit pas le service de dictée. Utilisez Chrome ou Edge, ou la dictée de Windows (touches Windows + H) dans le champ.')
      else if (e.error === 'audio-capture') setErreur('Aucun micro détecté.')
      else if (e.error !== 'aborted') setErreur(`La dictée a échoué (${e.error}). Réessayez ou tapez le texte.`)
    }
    r.onend = () => {
      clearTimeout(delai)
      setActif(false)
      setPhase('')
      if (!recu && !enErreur) setErreur('Aucun texte reconnu. Vérifiez le micro choisi par le navigateur (icône 🎤 dans la barre d’adresse), ou utilisez Windows + H.')
    }
    rec.current = r
    r.start()
    setActif(true)
  }

  const arreter = () => rec.current?.stop()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <button type="button" className={'btn ' + (actif ? 'btn-dark' : 'btn-outline')} onClick={actif ? arreter : demarrer} aria-pressed={actif} style={{ alignSelf: 'flex-start' }}>
        {actif ? '⏹ Arrêter la dictée' : '🎤 Dicter'}
      </button>
      {actif && <p className="small muted" role="status">{phase || 'Parlez, le texte s’écrit au fur et à mesure…'}</p>}
      {erreur && <p className="small" role="alert" style={{ color: '#B45309' }}>{erreur}</p>}
      <p className="small muted">La dictée utilise la reconnaissance vocale de votre navigateur (sur Chrome, l’audio est traité par Google).</p>
    </div>
  )
}
