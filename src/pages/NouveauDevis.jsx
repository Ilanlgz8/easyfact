import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { FlowLayout, Steps } from '../components/ui.jsx'
import LinesEditor from '../components/LinesEditor.jsx'
import { useStore } from '../store.jsx'
import { preparerLignes } from '../ia.js'

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

  const tvaParDefaut = (id) => {
    if (String(entreprise.tva).startsWith('Non')) return 0
    return client(id).type === 'Pro' ? 20 : 10
  }

  const toStep2 = () => {
    setLoading(true)
    // IA simulée : petit délai pour montrer qu'elle « prépare » les lignes
    window.setTimeout(() => {
      const objet = texte.trim() ? texte.trim().charAt(0).toUpperCase() + texte.trim().slice(1) : 'Travaux de plomberie'
      setDoc({ clientId, objet, tva: tvaParDefaut(clientId), lignes: preparerLignes(texte || 'chauffe-eau', prestations, entreprise) })
      setLoading(false)
      setStep(2)
    }, 900)
  }

  const valider = () => {
    const lignes = doc.lignes.filter((l) => l.label.trim() || l.prix)
    if (edited) {
      updateDevis(edited.id, { ...doc, lignes, statut: 'attente' })
      notify(<>Devis n° {edited.numero} modifié et renvoyé à <strong>{client(clientId).nom}</strong> (démo).</>)
      return navigate('/app/devis/' + edited.id)
    }
    const numero = addDevis({ ...doc, lignes })
    notify(<>Devis n° {numero} envoyé à <strong>{client(clientId).nom}</strong> (démo : aucun e-mail réel).</>)
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
              <p className="muted" style={{ marginTop: 4 }}>{client(clientId).nom} · lignes et prix d’exemple, modifiables</p>
              <LinesEditor doc={doc} setDoc={setDoc} />
            </section>
            <section className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <label className="check"><input type="checkbox" checked={ok} onChange={(e) => setOk(e.target.checked)} />J’ai vérifié et je valide ce devis</label>
              <p className="muted">Rien ne part sans votre validation. L’e-mail sera envoyé à : [e-mail du client]</p>
              <button className="btn btn-dark btn-block" disabled={!ok || doc.lignes.length === 0} onClick={valider} style={{ minHeight: 56 }}>Valider et envoyer par e-mail</button>
            </section>
            <div className="flow-actions"><button className="btn btn-outline" onClick={() => (edited ? navigate('/app/devis/' + edited.id) : (setStep(1), setOk(false)))}>Retour</button></div>
          </>
        )}
      </div>
    </FlowLayout>
  )
}
