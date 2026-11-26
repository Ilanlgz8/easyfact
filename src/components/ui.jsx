import { Link, NavLink, Navigate, Outlet, useNavigate } from 'react-router-dom'
import { useStore } from '../store.jsx'

export function Logo({ to = '/' }) {
  return (
    <Link to={to} className="logo" aria-label="EasyFact, accueil">
      <svg width="30" height="30" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <rect x="3" y="3" width="26" height="26" rx="6" stroke="#fff" strokeWidth="2.6" />
        <path d="M10 16.5l4.5 4.5L22.5 12" stroke="#74E8AE" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span>Easy<span className="fact">Fact</span></span>
    </Link>
  )
}

export const Badge = ({ tone, children }) => <span className={`badge badge-${tone}`}>{children}</span>

export function Toast() {
  const { toast } = useStore()
  if (!toast) return null
  return <div className="toast" role="status">{toast}</div>
}

export function AppLayout() {
  const { user, onboarded, logout, resetDemo, notify } = useStore()
  const navigate = useNavigate()
  if (!user) return <Navigate to="/connexion" replace />
  if (!onboarded) return <Navigate to="/questionnaire" replace />

  const links = [
    ['/app', 'Accueil', true],
    ['/app/clients', 'Clients'],
    ['/app/prestations', 'Prestations'],
    ['/app/devis', 'Devis'],
    ['/app/factures', 'Factures'],
    ['/app/entreprise', 'Mon entreprise'],
  ]
  return (
    <div className="app">
      <aside className="sidebar">
        <Logo to="/app" />
        {links.map(([to, label, end]) => (
          <NavLink key={to} to={to} end={end} className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>
            {label}
          </NavLink>
        ))}
        <div className="sidebar-foot">
          <button type="button" onClick={() => { resetDemo(); notify('Données d’exemple remises à zéro.') }}>Réinitialiser la démo</button>
          <button type="button" onClick={() => { logout(); navigate('/') }}>Se déconnecter</button>
        </div>
      </aside>
      <main className="main">
        <Outlet />
      </main>
      <Toast />
    </div>
  )
}

export function FlowLayout({ children, cancelTo = '/app' }) {
  return (
    <>
      <header className="topbar">
        <Logo to="/app" />
        {cancelTo && <Link to={cancelTo} className="cancel">Annuler</Link>}
      </header>
      {children}
      <Toast />
    </>
  )
}

export function Steps({ labels, current }) {
  return (
    <div className="steps" style={{ gridTemplateColumns: `repeat(${labels.length}, 1fr)` }}>
      {labels.map((l, i) => (
        <div key={l} className={'step' + (i <= current ? ' done' : '') + (i === current ? ' current' : '')}>
          {i + 1}. {l}
        </div>
      ))}
    </div>
  )
}

export function RequireUser({ children }) {
  const { user } = useStore()
  if (!user) return <Navigate to="/connexion" replace />
  return children
}
