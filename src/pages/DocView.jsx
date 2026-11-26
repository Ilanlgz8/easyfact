import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { Badge } from '../components/ui.jsx'
import { useStore, euros, totaux, round2, dateFr } from '../store.jsx'
import { statutDevis, statutFacture } from '../data.js'

// Page d'un devis ou d'une facture, mise en page comme le document envoyé au client
export default function DocView({ kind }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const store = useStore()
  const { entreprise, client, notify } = store
  const isDevis = kind === 'devis'
  const doc = (isDevis ? store.devis : store.factures).find((d) => d.id === id)
  if (!doc) return <Navigate to={isDevis ? '/app/devis' : '/app/factures'} replace />

  const c = client(doc.clientId)
  const t = totaux(doc)
  const acompte = round2(t.ttc * (doc.acompte || 0) / 100)
  const st = (isDevis ? statutDevis : statutFacture)[doc.statut]
  const delaiJours = parseInt(entreprise.delai, 10) || 0
  const titre = `${isDevis ? 'Devis' : 'Facture'} n° ${doc.numero}`

  const relancer = () => notify(<>Relance préparée pour <strong>{c.nom}</strong>. Rien ne part sans votre accord.</>)
  const imprimer = () => {
    try { window.print() } catch (e) { notify('Impression indisponible ici : ouvrez le site dans votre navigateur.') }
  }

  const actions = []
  if (isDevis) {
    if (doc.statut === 'pret') actions.push(<button key="send" className="btn btn-dark btn-sm" onClick={() => { store.sendDevis(doc.id); notify(<>{titre} envoyé à <strong>{c.nom}</strong> (démo).</>) }}>Envoyer</button>)
    if (doc.statut === 'attente') {
      actions.push(<button key="rel" className="btn btn-outline btn-sm" onClick={relancer}>Relancer</button>)
      actions.push(<button key="sign" className="btn btn-dark btn-sm" onClick={() => { store.signDevis(doc.id); notify(<>{titre} marqué <strong>signé</strong>.</>) }}>Marquer comme signé</button>)
    }
    if (doc.statut === 'signe') actions.push(<button key="fac" className="btn btn-dark btn-sm" onClick={() => navigate('/app/factures/nouvelle?devis=' + doc.id)}>Créer la facture</button>)
    if (doc.statut !== 'facture') actions.push(<Link key="edit" to={'/app/devis/nouveau?edit=' + doc.id} className="btn btn-outline btn-sm">Modifier</Link>)
  } else if (doc.statut === 'attente') {
    actions.push(<button key="rel" className="btn btn-outline btn-sm" onClick={relancer}>Relancer</button>)
    actions.push(<button key="paid" className="btn btn-dark btn-sm" onClick={() => { store.markPaid(doc.id); notify(<>{titre} marquée <strong>payée</strong>.</>) }}>Marquer payée</button>)
  }
  actions.push(<button key="pdf" className="btn btn-outline btn-sm" onClick={imprimer}>Télécharger en PDF</button>)

  return (
    <>
      <div className="page-head no-print">
        <div>
          <Link to={isDevis ? '/app/devis' : '/app/factures'} style={{ fontWeight: 600 }}>← {isDevis ? 'Tous les devis' : 'Toutes les factures'}</Link>
          <h1 style={{ marginTop: 10 }}>{titre}</h1>
          <p className="muted" style={{ marginTop: 6, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            {c.nom} · {euros(t.ttc)} <Badge tone={st.tone}>{st.label}</Badge>
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>{actions}</div>
      </div>

      <article className="paper">
        <header className="paper-head">
          <div>
            <strong className="paper-company">{entreprise.nom}</strong>
            <span>{entreprise.adresse}</span>
            <span>Tél. {entreprise.telephone}</span>
            <span>SIRET {entreprise.siret}</span>
          </div>
          <div className="paper-title">
            <strong>{isDevis ? 'DEVIS' : 'FACTURE'}</strong>
            <span>N° {doc.numero}</span>
            <span>Date : {dateFr(doc.date)}</span>
            {isDevis
              ? <span>Valable jusqu’au {dateFr(doc.date, 30)}</span>
              : <span>Échéance : {delaiJours ? dateFr(doc.date, delaiJours) : 'à réception'}</span>}
          </div>
        </header>

        <div className="paper-client">
          <span className="paper-label">{isDevis ? 'Client' : 'Facturé à'}</span>
          <strong>{c.nom}</strong>
          {c.adresse && <span>{c.adresse}</span>}
          {c.email && <span>{c.email}</span>}
        </div>

        {doc.objet && <p><span className="paper-label">Objet</span><br />{doc.objet}</p>}

        <div className="scroll">
          <table className="paper-table">
            <thead>
              <tr><th>Désignation</th><th className="r">Qté</th><th className="r">Prix unitaire HT</th><th className="r">Total HT</th></tr>
            </thead>
            <tbody>
              {doc.lignes.map((l, i) => (
                <tr key={i}>
                  <td>{l.label}</td>
                  <td className="r">{l.qte}</td>
                  <td className="r">{euros(Number(l.prix))}</td>
                  <td className="r">{euros(l.qte * Number(l.prix))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="paper-totals">
          <div><span>Total HT</span><span>{euros(t.ht)}</span></div>
          <div><span>TVA {String(doc.tva).replace('.', ',')} %</span><span>{euros(t.tva)}</span></div>
          <div className="big"><span>Total TTC</span><span>{euros(t.ttc)}</span></div>
          {!isDevis && acompte > 0 && (
            <>
              <div><span>Acompte déjà versé ({doc.acompte} %)</span><span>− {euros(acompte)}</span></div>
              <div className="big"><span>Reste à payer</span><span>{euros(t.ttc - acompte)}</span></div>
            </>
          )}
        </div>

        <footer className="paper-foot">
          {doc.tva === 0 && <p>TVA non applicable, art. 293 B du CGI.</p>}
          {doc.tva === 10 && <p>TVA à 10 % : le client certifie que les travaux portent sur un logement achevé depuis plus de 2 ans.</p>}
          {isDevis ? (
            <>
              <p>Devis valable 30 jours. {parseInt(entreprise.acompte, 10) ? `Acompte de ${entreprise.acompte} à la signature.` : ''}</p>
              <div className="paper-sign">
                <span>Bon pour accord — date et signature du client :</span>
                <div />
              </div>
            </>
          ) : (
            <>
              <p>Paiement {delaiJours ? `à ${delaiJours} jours` : 'à réception'} par virement. Pas d’escompte pour paiement anticipé.</p>
              {c.type === 'Pro' && <p>En cas de retard : pénalités au taux de 3 fois le taux d’intérêt légal et indemnité forfaitaire de 40 € pour frais de recouvrement.</p>}
            </>
          )}
          <p>Assurance professionnelle : garantie décennale souscrite auprès de {entreprise.assureur}, contrat n° {entreprise.contrat}. Couverture : France métropolitaine.</p>
        </footer>
      </article>
      <p className="demo-note no-print">Document de démonstration : entreprise, client et montants fictifs.</p>
    </>
  )
}
