import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Logo } from '../components/ui.jsx'
import { useStore } from '../store.jsx'

export default function Auth({ mode }) {
  const navigate = useNavigate()
  const { login, register, saveEntreprise } = useStore()
  const [tab, setTab] = useState(mode)
  const [show, setShow] = useState(false)
  const [f, setF] = useState({ prenom: '', email: '', password: '', cgu: false })
  const [error, setError] = useState('')
  const [oubli, setOubli] = useState(false)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })

  const submit = (e) => {
    e.preventDefault()
    setError('')
    if (!f.email.includes('@')) return setError('Entrez une adresse e-mail valide.')
    if (tab === 'login') {
      if (!f.password) return setError('Entrez votre mot de passe.')
      // Démo : tout compte est accepté et ouvre les données d'exemple
      login(f.email)
      saveEntreprise({})
      return navigate('/app')
    }
    if (!f.prenom.trim()) return setError('Entrez votre prénom.')
    if (f.password.length < 8) return setError('Le mot de passe doit faire au moins 8 caractères.')
    if (!f.cgu) return setError('Acceptez les conditions pour continuer.')
    register({ prenom: f.prenom.trim(), email: f.email })
    navigate('/questionnaire')
  }

  return (
    <div className="auth">
      <div className="auth-side">
        <Logo />
        <h1>La journée de chantier finie, <span>les papiers aussi.</span></h1>
        <p>Devis et factures pour les plombiers, électriciens, peintres et tous les artisans.</p>
        <span className="small" style={{ color: '#c3d6cd' }}>Données hébergées en France</span>
      </div>
      <div className="auth-form">
        <form onSubmit={submit} noValidate>
          <div className="tabs" role="tablist">
            <button type="button" role="tab" aria-selected={tab === 'login'} className={tab === 'login' ? 'on' : ''} onClick={() => setTab('login')}>Connexion</button>
            <button type="button" role="tab" aria-selected={tab === 'register'} className={tab === 'register' ? 'on' : ''} onClick={() => setTab('register')}>Inscription</button>
          </div>

          {tab === 'login' ? (
            <div>
              <h2 style={{ fontSize: 32 }}>Bon retour</h2>
              <p className="muted" style={{ marginTop: 6 }}>Connectez-vous pour retrouver vos devis et factures.</p>
            </div>
          ) : (
            <div>
              <h2 style={{ fontSize: 32 }}>Créer mon compte</h2>
              <p className="muted" style={{ marginTop: 6 }}>Trois informations suffisent pour commencer.</p>
            </div>
          )}

          {tab === 'register' && (
            <div className="field">
              <label htmlFor="prenom">Prénom</label>
              <input id="prenom" className="input" placeholder="Votre prénom" value={f.prenom} onChange={set('prenom')} autoComplete="given-name" />
            </div>
          )}
          <div className="field">
            <label htmlFor="email">Adresse e-mail</label>
            <input id="email" type="email" className="input" placeholder="vous@domaine.example" value={f.email} onChange={set('email')} autoComplete="email" />
          </div>
          <div className="field">
            <label htmlFor="pw">Mot de passe</label>
            <div className="pw">
              <input id="pw" type={show ? 'text' : 'password'} className="input" placeholder={tab === 'login' ? 'Votre mot de passe' : '8 caractères minimum'} value={f.password} onChange={set('password')} autoComplete={tab === 'login' ? 'current-password' : 'new-password'} />
              <button type="button" className="btn btn-outline" style={{ borderColor: 'var(--border)' }} onClick={() => setShow(!show)}>{show ? 'Masquer' : 'Afficher'}</button>
            </div>
          </div>

          {tab === 'login' ? (
            <>
              <button type="button" className="small linklike" style={{ alignSelf: 'flex-end', fontWeight: 600 }} aria-expanded={oubli} onClick={() => setOubli(!oubli)}>Mot de passe oublié ?</button>
              {oubli && <p className="small muted" role="status">Version de démonstration : il n’y a pas de vrai compte, donc rien à réinitialiser. Saisissez n’importe quel mot de passe, ou utilisez l’<Link to="/demo">accès démo</Link>.</p>}
            </>
          ) : (
            <label className="small" style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <input type="checkbox" checked={f.cgu} onChange={set('cgu')} style={{ width: 20, height: 20, accentColor: 'var(--forest)' }} />
              <span>J’accepte les conditions de la démonstration (<Link to="/aide#donnees" target="_blank">données et confidentialité</Link>).</span>
            </label>
          )}

          {error && <p className="error" role="alert">{error}</p>}
          <button type="submit" className="btn btn-dark btn-block" style={{ minHeight: 56 }}>{tab === 'login' ? 'Se connecter' : 'Créer mon compte'}</button>
          <p className="demo-note">Version de démonstration : aucun compte réel n’est créé, les données sont fictives.</p>
        </form>
      </div>
    </div>
  )
}
