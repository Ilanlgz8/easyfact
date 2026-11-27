import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../store.jsx'
import { repondre, EXEMPLES } from '../assistant/simule.js'
import { SECTIONS_AIDE } from '../aide.js'

// Assistant SIMULÉ (sans IA). Interrupteur VITE_CHATBOT_SIMULE=true, et jamais en production (build).
export const assistantActif = import.meta.env.VITE_CHATBOT_SIMULE === 'true' && !import.meta.env.PROD

const CLE = 'easyfact-assistant'
const QUOTA = 50
const LONGUEUR_MAX = 500
const jourParis = () => new Date().toLocaleDateString('fr-CA', { timeZone: 'Europe/Paris' })
const nouvelleConv = () => ({ id: 'k' + Date.now(), titre: 'Nouvelle conversation', cree: new Date().toISOString(), messages: [] })

// Mémoire : dans ce navigateur (pas de base). Conservée jusqu'à suppression (démo fictive).
function charger() {
  try {
    const m = JSON.parse(localStorage.getItem(CLE) || 'null')
    if (m && Array.isArray(m.conversations)) return m
  } catch { /* ignore */ }
  return { conversations: [], quota: { jour: jourParis(), n: 0 } }
}

export default function Assistant() {
  const { devis, clients, prestations } = useStore()
  const [ouvert, setOuvert] = useState(false)
  const [mem, setMem] = useState(charger)
  const [courante, setCourante] = useState(null)
  const [saisie, setSaisie] = useState('')
  const [recherche, setRecherche] = useState('')
  const [erreur, setErreur] = useState('')
  const fin = useRef(null)
  const champ = useRef(null)

  useEffect(() => { try { localStorage.setItem(CLE, JSON.stringify(mem)) } catch { /* ignore */ } }, [mem])
  useEffect(() => { fin.current?.scrollIntoView({ block: 'end' }) }, [mem, courante, ouvert])
  useEffect(() => { if (ouvert) champ.current?.focus() }, [ouvert, courante])

  const conv = mem.conversations.find((c) => c.id === courante) || null
  const quota = mem.quota?.jour === jourParis() ? mem.quota : { jour: jourParis(), n: 0 }

  const envoyer = (texte) => {
    const msg = texte.trim()
    if (!msg) return
    if (msg.length > LONGUEUR_MAX) return setErreur(`Message trop long (${LONGUEUR_MAX} caractères au plus).`)
    if (quota.n >= QUOTA) return setErreur(`Limite de ${QUOTA} messages par jour atteinte. Réessayez demain.`)
    setErreur('')
    const maintenant = new Date().toISOString()
    const base = conv || nouvelleConv()
    const rep = repondre(msg, { devis, clients, prestations, aide: SECTIONS_AIDE, conversations: mem.conversations })
    const maj = {
      ...base,
      titre: base.messages.length ? base.titre : msg.slice(0, 40),
      messages: [...base.messages, { role: 'artisan', texte: msg, date: maintenant }, { role: 'assistant', texte: rep.texte, sources: rep.sources || [], date: maintenant }],
    }
    setMem((m) => ({ conversations: [maj, ...m.conversations.filter((c) => c.id !== maj.id)], quota: { ...quota, n: quota.n + 1 } }))
    setCourante(maj.id)
    setSaisie('')
  }

  const supprimer = (id) => {
    if (!window.confirm('Supprimer définitivement cette conversation ? Les devis ne sont pas touchés.')) return
    setMem((m) => ({ ...m, conversations: m.conversations.filter((c) => c.id !== id) }))
    if (courante === id) setCourante(null)
  }

  const exporter = () => {
    const blob = new Blob([JSON.stringify(mem.conversations, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'easyfact-conversations.json'
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const filtre = recherche.trim().toLowerCase()
  const liste = mem.conversations.filter((c) => !filtre || c.titre.toLowerCase().includes(filtre) || c.messages.some((m) => m.texte.toLowerCase().includes(filtre)))

  if (!ouvert) return <button type="button" className="assistant-bouton" onClick={() => setOuvert(true)}>Assistant (simulé)</button>

  return (
    <section className="assistant" role="dialog" aria-label="Assistant simulé">
      <header className="assistant-tete">
        <div>
          <strong>Assistant</strong>
          <p className="small">Démonstration : réponses simulées, sans IA. Il ne modifie aucun devis.</p>
        </div>
        <button type="button" className="btn btn-outline btn-sm" onClick={() => setOuvert(false)} aria-label="Fermer l’assistant">Fermer</button>
      </header>

      <div className="assistant-outils">
        <button type="button" className="btn btn-outline btn-sm" onClick={() => setCourante(null)}>Nouvelle conversation</button>
        <button type="button" className="btn btn-outline btn-sm" onClick={exporter} disabled={!mem.conversations.length}>Exporter</button>
        {conv && <button type="button" className="btn btn-outline btn-sm" onClick={() => supprimer(conv.id)}>Supprimer</button>}
      </div>

      {!conv && (
        <div className="assistant-liste">
          <label className="small" style={{ fontWeight: 600 }}>
            Rechercher dans mes conversations
            <input className="input" value={recherche} onChange={(e) => setRecherche(e.target.value)} placeholder="ex. chauffe-eau" />
          </label>
          {liste.length > 0 && (
            <ul>
              {liste.slice(0, 20).map((c) => (
                <li key={c.id}><button type="button" className="linklike" onClick={() => setCourante(c.id)}>{c.titre}</button> <span className="small muted">{new Date(c.cree).toLocaleDateString('fr-FR')}</span></li>
              ))}
            </ul>
          )}
          {filtre && !liste.length && <p className="small muted">Aucune conversation trouvée.</p>}
          <p className="small" style={{ fontWeight: 600, marginTop: 8 }}>Exemples de demandes :</p>
          <div className="assistant-exemples">
            {EXEMPLES.map((e) => <button key={e} type="button" className="btn btn-outline btn-sm" onClick={() => envoyer(e)}>{e}</button>)}
          </div>
        </div>
      )}

      {conv && (
        <div className="assistant-fil" aria-live="polite">
          {conv.messages.map((m, i) => (
            <div key={i} className={'assistant-msg ' + m.role}>
              <span className="sr-only">{m.role === 'artisan' ? 'Vous : ' : 'Assistant : '}</span>
              {/* Texte brut : React échappe tout, aucun HTML ni lien externe. */}
              <p style={{ whiteSpace: 'pre-line' }}>{m.texte}</p>
              {m.sources?.length > 0 && (
                <p className="small">Sources : {m.sources.map((s, j) => (
                  <span key={j}>{j > 0 && ' · '}{s.type === 'devis' ? <Link to={'/app/devis/' + s.id} onClick={() => setOuvert(false)}>{s.libelle}</Link> : s.type === 'aide' ? <Link to={'/aide' + (s.id ? '#' + s.id : '')}>{s.libelle}</Link> : s.libelle}</span>
                ))}</p>
              )}
            </div>
          ))}
          <div ref={fin} />
        </div>
      )}

      <form className="assistant-saisie" onSubmit={(e) => { e.preventDefault(); envoyer(saisie) }}>
        {erreur && <p className="error" role="alert">{erreur}</p>}
        <label htmlFor="assistant-champ" className="sr-only">Votre question</label>
        <input id="assistant-champ" ref={champ} className="input" value={saisie} maxLength={LONGUEUR_MAX} onChange={(e) => setSaisie(e.target.value)} placeholder="Posez votre question…" />
        <button type="submit" className="btn btn-dark btn-sm" disabled={!saisie.trim()}>Envoyer</button>
        <p className="small muted">{QUOTA - quota.n} messages restants aujourd’hui.</p>
      </form>
    </section>
  )
}
