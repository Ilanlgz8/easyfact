import { Link, useNavigate } from 'react-router-dom'
import { Badge } from '../components/ui.jsx'
import { useStore, euros, montant } from '../store.jsx'
import { statutDevis } from '../data.js'

export default function DevisList() {
  const { devis, client, sendDevis, notify } = useStore()
  const navigate = useNavigate()
  const n = (st) => devis.filter((d) => d.statut === st).length

  const action = (d) => {
    if (d.statut === 'pret') return <button className="btn btn-outline btn-sm" onClick={() => { sendDevis(d.id); notify(<>Devis n° {d.numero} envoyé à <strong>{client(d.clientId).nom}</strong> (démo, rien n’est parti).</>) }}>Envoyer (démo)</button>
    if (d.statut === 'signe') return <button className="btn btn-outline btn-sm" onClick={() => navigate('/app/factures/nouvelle?devis=' + d.id)}>Créer la facture</button>
    if (d.statut === 'attente') return <button className="btn btn-outline btn-sm" onClick={() => notify(<>Relance préparée pour <strong>{client(d.clientId).nom}</strong>. Rien ne part sans votre accord.</>)}>Relancer</button>
    return null
  }

  return (
    <>
      <div className="page-head">
        <div><h1>Devis</h1><p className="muted" style={{ marginTop: 6 }}>Données d’exemple</p></div>
        <Link to="/app/devis/nouveau" className="btn btn-dark">+ Nouveau devis</Link>
      </div>
      <div className="kpis">
        <div className="kpi"><p>À envoyer</p><strong>{n('pret')}</strong></div>
        <div className="kpi"><p>En attente de réponse</p><strong>{n('attente')}</strong></div>
        <div className="kpi"><p>Signés</p><strong>{n('signe')}</strong></div>
      </div>
      <section className="list">
        {devis.map((d) => (
          <div className="row" key={d.id}>
            <Link to={'/app/devis/' + d.id} className="row-main" style={{ textDecoration: 'none' }}><strong>{client(d.clientId).nom}</strong><span>Devis n° {d.numero}</span></Link>
            <div className="row-side">
              <span className="amount">{euros(montant(d))}</span>
              <Badge tone={statutDevis[d.statut].tone}>{statutDevis[d.statut].label}</Badge>
              {action(d)}
              <Link to={'/app/devis/' + d.id} className="btn btn-dark btn-sm">Ouvrir</Link>
            </div>
          </div>
        ))}
      </section>
    </>
  )
}
