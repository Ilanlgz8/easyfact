import { Link, useNavigate } from 'react-router-dom'
import { Badge } from '../components/ui.jsx'
import { useStore, euros, montant, reste } from '../store.jsx'
import { statutDevis, statutFacture } from '../data.js'

export default function Home() {
  const { user, devis, factures, client, sendDevis, notify } = useStore()
  const navigate = useNavigate()

  const aEnvoyer = devis.filter((d) => d.statut === 'pret')
  const enAttente = devis.filter((d) => d.statut === 'attente')
  const signes = devis.filter((d) => d.statut === 'signe')
  const impayees = factures.filter((f) => f.statut === 'attente')
  const aEncaisser = impayees.reduce((s, f) => s + reste(f), 0)

  // « À faire maintenant » : 1 devis à envoyer, 1 facture à relancer, 1 devis signé à facturer
  const todo = [
    aEnvoyer.find((d) => d.numero === '024') || aEnvoyer[0],
    impayees[0],
    signes[0],
  ].filter(Boolean)

  const action = (doc) => {
    if (factures.includes(doc)) {
      return <button className="btn btn-outline btn-sm" onClick={() => notify(<>Relance préparée pour <strong>{client(doc.clientId).nom}</strong>. Rien ne part sans votre accord.</>)}>Relancer</button>
    }
    if (doc.statut === 'pret') {
      return <button className="btn btn-dark btn-sm" onClick={() => { sendDevis(doc.id); notify(<>Devis n° {doc.numero} envoyé à <strong>{client(doc.clientId).nom}</strong> (démo).</>) }}>Envoyer</button>
    }
    return <button className="btn btn-outline btn-sm" onClick={() => navigate('/app/factures/nouvelle?devis=' + doc.id)}>Créer la facture</button>
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Bonjour {user.prenom}</h1>
          <p className="muted" style={{ marginTop: 6, fontSize: 18 }}>Qu’est-ce qu’on fait aujourd’hui ?</p>
        </div>
        <span className="avatar" aria-hidden="true">{user.prenom.charAt(0).toUpperCase()}</span>
      </div>

      <div className="big-actions">
        <Link to="/app/devis/nouveau" className="big-action mint"><span className="plus">+</span> Nouveau devis</Link>
        <Link to="/app/factures/nouvelle" className="big-action dark"><span className="plus">+</span> Nouvelle facture</Link>
      </div>

      <div className="kpis">
        <div className="kpi"><p>Devis à envoyer</p><strong>{aEnvoyer.length}</strong></div>
        <div className="kpi"><p>Devis en attente de réponse</p><strong>{enAttente.length}</strong></div>
        <div className="kpi"><p>Factures à encaisser</p><strong>{euros(aEncaisser).replace(',00', '')}</strong></div>
      </div>

      <section className="list" style={{ padding: '22px 26px 8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 6 }}>
          <h2 style={{ fontSize: 26 }}>À faire maintenant</h2>
          <Link to="/app/devis" style={{ fontWeight: 600 }}>Tout voir</Link>
        </div>
        {todo.length === 0 && <p className="muted" style={{ padding: '16px 0' }}>Rien d’urgent. Bonne journée sur le chantier !</p>}
        {todo.map((doc) => {
          const isF = factures.includes(doc)
          const st = isF ? statutFacture[doc.statut] : statutDevis[doc.statut]
          return (
            <div className="row" key={doc.id}>
              <Link to={(isF ? '/app/factures/' : '/app/devis/') + doc.id} className="row-main" style={{ textDecoration: 'none' }}>
                <strong>{client(doc.clientId).nom}</strong>
                <span>{isF ? 'Facture' : 'Devis'} n° {doc.numero} · {euros(montant(doc))}</span>
              </Link>
              <div className="row-side"><Badge tone={st.tone}>{st.label}</Badge>{action(doc)}</div>
            </div>
          )
        })}
      </section>
    </>
  )
}
