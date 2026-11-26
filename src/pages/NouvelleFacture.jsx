import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { FlowLayout, Steps } from '../components/ui.jsx'
import LinesEditor from '../components/LinesEditor.jsx'
import { useStore, euros, montant } from '../store.jsx'
import { preparerLignes } from '../ia.js'

export default function NouvelleFacture() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { devis, clients, prestations, entreprise, client, addFacture, notify } = useStore()
  const signes = devis.filter((d) => d.statut === 'signe')

  const pre = params.get('devis')
  const [source, setSource] = useState(signes.length ? 'devis' : 'zero')
  const [devisId, setDevisId] = useState(pre && signes.some((d) => d.id === pre) ? pre : signes[0]?.id)
  const [clientId, setClientId] = useState(clients[0]?.id)
  const [step, setStep] = useState(0)
  const [doc, setDoc] = useState(null)
  const [ok, setOk] = useState(false)

  const acomptePct = source === 'devis' ? parseInt(entreprise.acompte, 10) || 0 : 0

  const continuer = () => {
    if (source === 'devis') {
      const d = devis.find((x) => x.id === devisId)
      setDoc({ clientId: d.clientId, tva: d.tva ?? 20, objet: d.objet ? d.objet + ' (devis n° ' + d.numero + ')' : 'Selon devis n° ' + d.numero, lignes: (d.lignes || [{ label: 'Travaux (selon devis n° ' + d.numero + ')', qte: 1, prix: montant(d) }]).map((l) => ({ ...l })) })
    } else {
      const tva = String(entreprise.tva).startsWith('Non') ? 0 : client(clientId).type === 'Pro' ? 20 : 10
      setDoc({ clientId, tva, lignes: preparerLignes('', prestations, entreprise) })
    }
    setStep(1)
  }

  const valider = () => {
    addFacture({ ...doc, acompte: acomptePct }, source === 'devis' ? devisId : null)
    notify(<>Facture envoyée à <strong>{client(doc.clientId).nom}</strong> (démo : aucun e-mail réel).</>)
    navigate('/app/factures')
  }

  return (
    <FlowLayout>
      <div className="flow">
        <h1>Nouvelle facture</h1>
        <Steps labels={['Départ', 'Vérification']} current={step} />

        {step === 0 && (
          <>
            <section className="card" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <h2 style={{ fontSize: 22 }}>D’où part la facture ?</h2>
              <div className="pick-grid" role="radiogroup" aria-label="Point de départ">
                <button type="button" role="radio" aria-checked={source === 'devis'} className={'pick' + (source === 'devis' ? ' on' : '')} onClick={() => setSource('devis')} disabled={!signes.length}>
                  <strong>Depuis un devis signé</strong><span>{signes.length ? 'Lignes déjà remplies' : 'Aucun devis signé pour l’instant'}</span>
                </button>
                <button type="button" role="radio" aria-checked={source === 'zero'} className={'pick' + (source === 'zero' ? ' on' : '')} onClick={() => setSource('zero')}>
                  <strong>Partir de zéro</strong><span>Client, puis travaux</span>
                </button>
              </div>

              {source === 'devis' ? (
                <>
                  <h2 style={{ fontSize: 22 }}>Choisissez le devis signé</h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {signes.map((d) => (
                      <button type="button" key={d.id} className={'pick' + (devisId === d.id ? ' on' : '')} onClick={() => setDevisId(d.id)}>
                        <strong>{client(d.clientId).nom}</strong>
                        <span>Devis n° {d.numero} · {euros(montant(d))} · Signé</span>
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <h2 style={{ fontSize: 22 }}>Pour quel client ?</h2>
                  <div className="pick-grid">
                    {clients.map((c) => (
                      <button type="button" key={c.id} className={'pick' + (clientId === c.id ? ' on' : '')} onClick={() => setClientId(c.id)}>
                        <strong>{c.nom}</strong><span>{c.type}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </section>
            <div className="flow-actions"><span className="spacer" /><button className="btn btn-dark" onClick={continuer}>Continuer</button></div>
          </>
        )}

        {step === 1 && doc && (
          <>
            <section className="card">
              <h2 style={{ fontSize: 22 }}>Vérifiez la facture</h2>
              <p className="muted" style={{ marginTop: 4 }}>{client(doc.clientId).nom} · lignes et prix d’exemple, modifiables</p>
              <LinesEditor doc={doc} setDoc={setDoc} acomptePct={acomptePct} />
            </section>
            <section className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <label className="check"><input type="checkbox" checked={ok} onChange={(e) => setOk(e.target.checked)} />J’ai vérifié et je valide cette facture</label>
              <p className="muted">Rien ne part sans votre validation. L’e-mail sera envoyé à : [e-mail du client]</p>
              <button className="btn btn-dark btn-block" disabled={!ok || doc.lignes.length === 0} onClick={valider} style={{ minHeight: 56 }}>Valider et envoyer par e-mail</button>
            </section>
            <div className="flow-actions"><button className="btn btn-outline" onClick={() => { setStep(0); setOk(false) }}>Retour</button></div>
          </>
        )}
      </div>
    </FlowLayout>
  )
}
