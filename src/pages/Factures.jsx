import { Link } from 'react-router-dom'
import { Badge } from '../components/ui.jsx'
import { useStore, euros, montant, reste } from '../store.jsx'
import { statutFacture } from '../data.js'

export default function Factures() {
  const { factures, client, markPaid, notify } = useStore()
  const attente = factures.filter((f) => f.statut === 'attente')
  const total = attente.reduce((s, f) => s + reste(f), 0)

  return (
    <>
      <div className="page-head">
        <div><h1>Factures</h1><p className="muted" style={{ marginTop: 6 }}>Données d’exemple</p></div>
        <Link to="/app/factures/nouvelle" className="btn btn-dark">+ Nouvelle facture</Link>
      </div>
      <div className="kpis" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
        <div className="kpi"><p>À encaisser</p><strong>{euros(total).replace(',00', '')}</strong></div>
        <div className="kpi"><p>Factures en attente</p><strong>{attente.length}</strong></div>
      </div>
      <section className="list">
        {factures.map((f) => (
          <div className="row" key={f.id}>
            <Link to={'/app/factures/' + f.id} className="row-main" style={{ textDecoration: 'none' }}><strong>{client(f.clientId).nom}</strong><span>Facture n° {f.numero}</span></Link>
            <div className="row-side">
              <span className="amount">{euros(montant(f))}</span>
              <Badge tone={statutFacture[f.statut].tone}>{statutFacture[f.statut].label}</Badge>
              {f.statut === 'attente' ? (
                <>
                  <button className="btn btn-outline btn-sm" onClick={() => { markPaid(f.id); notify(<>Facture n° {f.numero} marquée <strong>payée</strong>.</>) }}>Marquer payée</button>
                  <button className="btn btn-outline btn-sm" onClick={() => notify(<>Relance préparée pour <strong>{client(f.clientId).nom}</strong>. Rien ne part sans votre accord.</>)}>Relancer</button>
                </>
              ) : null}
              <Link to={'/app/factures/' + f.id} className="btn btn-dark btn-sm">Ouvrir</Link>
            </div>
          </div>
        ))}
      </section>
    </>
  )
}
