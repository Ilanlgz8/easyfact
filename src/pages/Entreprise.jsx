import { useState } from 'react'
import { useStore, euros } from '../store.jsx'

const show = (v) => (Array.isArray(v) ? v.join(', ') : v === '' || v === undefined ? '—' : String(v))

function Bloc({ titre, champs, data, onSave }) {
  const [edit, setEdit] = useState(false)
  const [d, setD] = useState({})
  const start = () => { setD(Object.fromEntries(champs.map(([k]) => [k, Array.isArray(data[k]) ? data[k].join(', ') : data[k] ?? '']))); setEdit(true) }
  const save = (e) => {
    e.preventDefault()
    const out = {}
    champs.forEach(([k, , type]) => {
      out[k] = type === 'list' ? d[k].split(',').map((x) => x.trim()).filter(Boolean) : type === 'num' ? Number(String(d[k]).replace(',', '.')) || 0 : d[k]
    })
    onSave(out)
    setEdit(false)
  }
  return (
    <section className="card">
      <div className="card-head">
        <h2>{titre}</h2>
        {!edit && <button className="btn btn-outline btn-sm" onClick={start}>Modifier</button>}
      </div>
      {edit ? (
        <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {champs.map(([k, label]) => (
            <div className="field" key={k}>
              <label htmlFor={'e-' + k}>{label}</label>
              <input id={'e-' + k} className="input" value={d[k]} onChange={(e) => setD({ ...d, [k]: e.target.value })} />
            </div>
          ))}
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="submit" className="btn btn-mint">Enregistrer</button>
            <button type="button" className="btn btn-outline" onClick={() => setEdit(false)}>Annuler</button>
          </div>
        </form>
      ) : (
        champs.map(([k, label, type]) => (
          <div className="kv" key={k}>
            <span>{label}</span>
            <span>{type === 'num' ? euros(data[k]) : type === 'file' ? (data[k] || 'Aucun fichier') : show(data[k])}</span>
          </div>
        ))
      )}
    </section>
  )
}

export default function Entreprise() {
  const { entreprise, saveEntreprise, notify } = useStore()
  const save = (v) => { saveEntreprise(v); notify('Informations enregistrées.') }

  return (
    <>
      <div className="page-head">
        <div><h1>Mon entreprise</h1><p className="muted" style={{ marginTop: 6 }}>Vos réponses au questionnaire · réponses d’exemple</p></div>
      </div>
      <div className="grid-2">
        <Bloc titre="Coordonnées" data={entreprise} onSave={save} champs={[
          ['nom', 'Entreprise'], ['siret', 'SIRET'], ['adresse', 'Adresse'], ['telephone', 'Téléphone'],
          ['assureur', 'Assureur décennale'], ['contrat', 'N° de contrat'],
        ]} />
        <Bloc titre="Activité et tarifs" data={entreprise} onSave={save} champs={[
          ['metiers', 'Métier', 'list'], ['equipe', 'Équipe'], ['devisParMois', 'Devis par mois'], ['methode', 'Méthode actuelle', 'list'],
          ['tva', 'TVA'], ['clients', 'Clients', 'list'], ['tauxHoraire', 'Taux horaire HT', 'num'], ['deplacement', 'Déplacement HT', 'num'],
          ['acompte', 'Acompte'], ['delai', 'Délai de paiement'],
        ]} />
      </div>
      <Bloc titre="Personnalisation" data={entreprise} onSave={save} champs={[
        ['anciensDevis', 'Anciens devis', 'file'], ['style', 'Style des devis'],
      ]} />
    </>
  )
}
