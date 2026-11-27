import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { FlowLayout, Steps } from '../components/ui.jsx'
import LinesEditor from '../components/LinesEditor.jsx'
import BoutonDictee from '../components/BoutonDictee.jsx'
import { useStore } from '../store.jsx'
import { extraireLignes } from '../ia.js'
import { blocagesValidation } from '../devis/calcul.js'

export default function NouveauDevis() {
  const navigate = useNavigate()
  const { clients, devis, prestations, entreprise, client, addClient, addDevis, updateDevis, notify } = useStore()
  const [params] = useSearchParams()
  // Mode « Modifier » : on ouvre directement l'étape de vérification avec les lignes du devis
  const edited = devis.find((d) => d.id === params.get('edit'))
  const [step, setStep] = useState(edited ? 2 : 0)
  const [clientId, setClientId] = useState(edited ? edited.clientId : clients[0]?.id)
  const [newClient, setNewClient] = useState(null)
  const [texte, setTexte] = useState('')
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(false)
  const [doc, setDoc] = useState(edited ? { clientId: edited.clientId, tva: edited.tva, objet: edited.objet, lignes: edited.lignes.map((l) => ({ ...l })) } : null)
  const [ok, setOk] = useState(false)

  // IA : lignes proposées par le modèle, prix repris du catalogue. TVA jamais préremplie.
  const [infoIA, setInfoIA] = useState(null)
  const toStep2 = async () => {
    setLoading(true)
    const objet = texte.trim() ? texte.trim().charAt(0).toUpperCase() + texte.trim().slice(1) : 'Travaux de plomberie'
    const r = await extraireLignes(texte, prestations)
    const lignes = r.mode === 'ia' ? r.lignes : [{ label: '', qte: 1, prix: null, custom: true }]
    setInfoIA(r)
    setDoc({ clientId, objet, tva: null, lignes })
    setOk(false)
    setLoading(false)
    setStep(2)
  }

  const blocages = doc ? blocagesValidation(doc) : []

  const valider = () => {
    if (blocages.length) return
    const lignes = doc.lignes.filter((l) => l.label.trim() || l.prix).map(({ horsCatalogue, ...l }) => ({ ...l, prix: Number(l.prix) }))
    if (edited) {
      updateDevis(edited.id, { ...doc, lignes, statut: 'attente' })
      notify(<>Devis n° {edited.numero} modifié et validé (démo : rien n’est envoyé à <strong>{client(clientId).nom}</strong>).</>)
      return navigate('/app/devis/' + edited.id)
    }
    const numero = addDevis({ ...doc, lignes })
    notify(<>Devis n° {numero} validé (démo : aucun e-mail envoyé à <strong>{client(clientId).nom}</strong>).</>)
    navigate('/app/devis')
  }

  const saveClient = () => {
    if (!newClient?.nom?.trim()) return
    const id = addClient(newClient.nom.trim(), newClient.type)
    setClientId(id)
    setNewClient(null)
  }

  return (
    <FlowLayout>
      <div className="flow">
        <h1>{edited ? `Modifier le devis n° ${edited.numero}` : 'Nouveau devis'}</h1>
        <Steps labels={['Client', 'Travaux', 'Vérification']} current={step} />

        {step === 0 && (
          <>
            <section className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <h2 style={{ fontSize: 22 }}>Pour quel client ?</h2>
              <div className="pick-grid" role="radiogroup" aria-label="Client">
                {clients.map((c) => (
                  <button type="button" key={c.id} role="radio" aria-checked={clientId === c.id} className={'pick' + (clientId === c.id ? ' on' : '')} onClick={() => setClientId(c.id)}>
                    <strong>{c.nom}</strong><span>{c.type}</span>
                  </button>
                ))}
              </div>
              {newClient ? (
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                  <input className="input" style={{ flex: '1 1 220px' }} aria-label="Nom du nouveau client" placeholder="Nom du client" value={newClient.nom}
                    onChange={(e) => setNewClient({ ...newClient, nom: e.target.value })} autoFocus />
                  <select className="input" style={{ width: 160 }} aria-label="Type de client" value={newClient.type} onChange={(e) => setNewClient({ ...newClient, type: e.target.value })}>
                    <option>Particulier</option><option>Pro</option>
                  </select>
                  <button type="button" className="btn btn-mint" onClick={saveClient}>Ajouter</button>
                </div>
              ) : (
                <button type="button" className="btn btn-outline btn-block" onClick={() => setNewClient({ nom: '', type: 'Particulier' })}>+ Nouveau client</button>
              )}
            </section>
            <div className="flow-actions"><span className="spacer" /><button className="btn btn-dark" onClick={() => setStep(1)} disabled={!clientId}>Continuer</button></div>
          </>
        )}

        {step === 1 && (
          <>
            <section className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <label htmlFor="travaux" style={{ fontWeight: 700, fontSize: 22 }}>Décrivez les travaux en quelques mots</label>
              <textarea id="travaux" className="input" placeholder="Ex. : remplacement chauffe-eau 200 L, 2 h" value={texte} onChange={(e) => setTexte(e.target.value)} />
              <BoutonDictee valeur={texte} onChange={setTexte} />
              <label htmlFor="photos" style={{ fontWeight: 700, fontSize: 22 }}>Ajoutez des photos du chantier</label>
              <div className="dropzone"><input id="photos" type="file" accept="image/*" multiple onChange={(e) => setPhotos([...e.target.files].map((f) => f.name))} /></div>
              {photos.length > 0 && <p className="small muted">{photos.length} photo{photos.length > 1 ? 's' : ''} ajoutée{photos.length > 1 ? 's' : ''}.</p>}
              <p className="muted small">L’IA prépare les lignes à partir de vos mots, de vos photos et de votre catalogue. Vous vérifiez ensuite.</p>
            </section>
            <div className="flow-actions">
              <button className="btn btn-outline" onClick={() => setStep(0)}>Retour</button>
              <button className="btn btn-dark" onClick={toStep2} disabled={loading}>{loading ? 'L’IA prépare vos lignes…' : 'Continuer'}</button>
            </div>
          </>
        )}

        {step === 2 && doc && (
          <>
            <section className="card">
              <h2 style={{ fontSize: 22 }}>Vérifiez le devis</h2>
              <p className="muted" style={{ marginTop: 4 }}>{client(clientId).nom} · prix repris de votre catalogue, modifiables</p>
              {infoIA?.mode === 'ia' && <p className="small muted" style={{ marginTop: 6 }}>Lignes proposées par l’IA à partir de votre description. Vérifiez-les.</p>}
              {infoIA?.mode === 'manuel' && <p className="small" style={{ marginTop: 6, color: '#B45309' }}>{infoIA.raison} Saisissez les lignes vous-même.</p>}
              {infoIA?.remarques?.length > 0 && <ul className="small muted" style={{ marginTop: 6 }}>{infoIA.remarques.map((r, i) => <li key={i}>{r}</li>)}</ul>}
              <LinesEditor doc={doc} setDoc={setDoc} />
            </section>
            <section className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <label className="check"><input type="checkbox" checked={ok} onChange={(e) => setOk(e.target.checked)} />J’ai vérifié les lignes, les prix et le taux de TVA, et je valide ce devis</label>
              {blocages.length > 0 && <ul className="small" style={{ color: '#B45309' }}>{blocages.map((b) => <li key={b}>{b}</li>)}</ul>}
              <p className="muted">Démonstration : aucun e-mail n’est envoyé au client.</p>
              <button className="btn btn-dark btn-block" disabled={!ok || blocages.length > 0} onClick={valider} style={{ minHeight: 56 }}>Valider le devis (démo, aucun envoi)</button>
            </section>
            <div className="flow-actions"><button className="btn btn-outline" onClick={() => (edited ? navigate('/app/devis/' + edited.id) : (setStep(1), setOk(false)))}>Retour</button></div>
          </>
        )}
      </div>
    </FlowLayout>
  )
}
