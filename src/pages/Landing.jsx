import { Link } from 'react-router-dom'
import { Logo } from '../components/ui.jsx'

const metiers = ['Plombier', 'Électricien', 'Peintre', 'Maçon', 'Menuisier', 'Carreleur', 'Chauffagiste', 'Couvreur']

export default function Landing() {
  return (
    <>
      <section className="hero">
        <div className="wrap">
          <div className="pub-nav">
            <Logo />
            <nav>
              <a href="#comment">Comment ça marche</a>
              <a href="#metiers">Pour quel métier ?</a>
              <Link to="/demo" className="btn btn-ghost-light btn-sm">Accès démo</Link>
              <Link to="/connexion" className="btn btn-ghost-light btn-sm">Se connecter</Link>
            </nav>
          </div>
          <div className="hero-grid">
            <div>
              <span className="pill">Pour les artisans du bâtiment</span>
              <h1>Finissez votre journée sur le chantier, pas sur vos factures.</h1>
              <p className="lead">EasyFact fait vos devis et vos factures en quelques minutes, depuis votre téléphone. Vous travaillez, on s’occupe de la paperasse.</p>
              <div className="hero-cta">
                <Link to="/inscription" className="btn btn-mint">Créer mon premier devis</Link>
                <a href="#comment" className="btn btn-ghost-light">Voir comment ça marche</a>
              </div>
              <p className="trades">Plombiers · Électriciens · Peintres · Maçons · Carreleurs…</p>
            </div>
            <div className="preview-card" aria-label="Exemple de devis">
              <div className="l"><strong style={{ fontSize: 19 }}>Devis n° 024</strong><span className="badge badge-mint">Prêt à envoyer</span></div>
              <span className="muted small">M. Martin</span>
              <hr style={{ border: 'none', borderTop: '1px solid var(--line)', margin: 0 }} />
              <div className="l"><span>Remplacement chauffe-eau</span><strong>480,00 €</strong></div>
              <div className="l"><span>Main d’œuvre</span><strong>220,00 €</strong></div>
              <div className="l"><span>Déplacement</span><strong>40,00 €</strong></div>
              <hr style={{ border: 'none', borderTop: '1px solid var(--line)', margin: 0 }} />
              <div className="l" style={{ fontSize: 19 }}><strong>Total</strong><strong>740,00 €</strong></div>
              <Link to="/inscription" className="btn btn-dark btn-block">Envoyer au client (démo)</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="comment">
        <div className="wrap">
          <h2>Un devis en 3 gestes</h2>
          <p className="sub">Pas de formation. Pas de manuel. Vous ouvrez, vous remplissez, vous envoyez.</p>
          <div className="steps3">
            {[
              ['Choisissez', 'Un gros bouton « Nouveau devis », un autre « Nouvelle facture ». Rien d’autre à chercher.'],
              ['Remplissez', 'Client, prestations, prix. Vos lignes habituelles sont déjà enregistrées pour aller plus vite.'],
              ['Envoyez', 'Vous validez, vous téléchargez le PDF et vous le transmettez à votre client. Vous suivez ce qui est signé et payé. (Démo : aucun envoi automatique.)'],
            ].map(([t, d], i) => (
              <div key={t} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <span className="num">{i + 1}</span>
                <h3 style={{ fontSize: 22 }}>{t}</h3>
                <p className="muted">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" id="metiers" style={{ background: 'var(--beige)' }}>
        <div className="wrap">
          <h2>Fait pour votre métier</h2>
          <div className="tags">{metiers.map((m) => <span key={m} className="tag">{m}</span>)}</div>
        </div>
      </section>

      <section className="footer-cta">
        <div className="wrap">
          <h2>Ce soir, rentrez à l’heure.</h2>
          <p style={{ marginTop: 12, color: '#d6e5de' }}>Créez votre premier devis en quelques minutes.</p>
          <Link to="/inscription" className="btn btn-mint" style={{ marginTop: 28 }}>Créer mon premier devis</Link>
          <div className="footer-bar">
            <span>© EasyFact</span>
            <span><Link to="/aide#donnees">Données et démo</Link><Link to="/aide#support">Aide et contact</Link></span>
          </div>
        </div>
      </section>
    </>
  )
}
