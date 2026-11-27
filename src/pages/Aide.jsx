import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Logo } from '../components/ui.jsx'
import { useStore } from '../store.jsx'

import { SECTIONS_AIDE } from '../aide.js'

// Aide courte, lisible sans connexion.
export default function Aide() {
  const { hash } = useLocation()
  const { user } = useStore()
  useEffect(() => {
    const id = hash.replace('#', '')
    if (id) document.getElementById(id)?.scrollIntoView({ block: 'start' })
  }, [hash])

  return (
    <>
      <header className="topbar">
        <Logo to={user ? '/app' : '/'} />
        <Link to={user ? '/app' : '/'} className="cancel">Retour</Link>
      </header>
      <main className="flow" style={{ maxWidth: 760 }}>
        <h1>Aide</h1>
        <p className="muted">Les réponses aux questions les plus courantes, en une page.</p>
        <nav aria-label="Sommaire de l’aide" className="card" style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          {SECTIONS_AIDE.map((s) => <a key={s.id} href={`#/aide#${s.id}`} onClick={(e) => { e.preventDefault(); document.getElementById(s.id)?.scrollIntoView({ block: 'start' }) }}>{s.titre}</a>)}
        </nav>
        {SECTIONS_AIDE.map((s) => (
          <section key={s.id} id={s.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 8, scrollMarginTop: 16 }}>
            <h2 style={{ fontSize: 22 }}>{s.titre}</h2>
            {s.texte.map((t, i) => <p key={i}>{t}</p>)}
          </section>
        ))}
      </main>
    </>
  )
}
