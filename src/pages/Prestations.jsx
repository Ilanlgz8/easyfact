import { useState } from 'react'
import { useStore, euros } from '../store.jsx'

function PrestationForm({ initial, onSave, onCancel }) {
  const [p, setP] = useState(initial)
  const submit = (e) => {
    e.preventDefault()
    if (!p.nom.trim() || isNaN(Number(p.prix))) return
    onSave({ ...p, nom: p.nom.trim(), prix: Number(p.prix) })
  }
  return (
    <form onSubmit={submit} style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end', padding: '16px 0', borderBottom: '1px solid var(--line)' }}>
      <div className="field" style={{ flex: '2 1 220px' }}>
        <label htmlFor="pn">Prestation</label>
        <input id="pn" className="input" value={p.nom} onChange={(e) => setP({ ...p, nom: e.target.value })} placeholder="Ex. : Débouchage canalisation" autoFocus />
      </div>
      <div className="field" style={{ flex: '1 1 160px' }}>
        <label htmlFor="pd">Unité</label>
        <input id="pd" className="input" value={p.detail} onChange={(e) => setP({ ...p, detail: e.target.value })} placeholder="Forfait, à l’heure…" />
      </div>
      <div className="field" style={{ flex: '0 1 130px' }}>
        <label htmlFor="pp">Prix HT (€)</label>
        <input id="pp" className="input" inputMode="decimal" value={p.prix} onChange={(e) => setP({ ...p, prix: e.target.value.replace(',', '.') })} />
      </div>
      <button type="submit" className="btn btn-mint">Enregistrer</button>
      <button type="button" className="btn btn-outline" onClick={onCancel}>Annuler</button>
    </form>
  )
}

export default function Prestations() {
  const { prestations, addPrestation, updatePrestation, notify } = useStore()
  const [edit, setEdit] = useState(null) // id ou 'new'

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Prestations et prix</h1>
          <p className="muted" style={{ marginTop: 6 }}>Le catalogue que l’IA utilise pour préparer vos devis · prix d’exemple</p>
        </div>
        <button className="btn btn-dark" onClick={() => setEdit('new')}>+ Ajouter</button>
      </div>

      <section className="list">
        {edit === 'new' && (
          <PrestationForm initial={{ nom: '', detail: '', prix: '' }} onCancel={() => setEdit(null)}
            onSave={(p) => { addPrestation(p); setEdit(null); notify('Prestation ajoutée au catalogue.') }} />
        )}
        {prestations.map((p) => edit === p.id ? (
          <PrestationForm key={p.id} initial={p} onCancel={() => setEdit(null)}
            onSave={(v) => { updatePrestation(p.id, v); setEdit(null); notify('Prix mis à jour.') }} />
        ) : (
          <div className="row" key={p.id}>
            <div className="row-main"><strong>{p.nom}</strong><span>{p.detail}</span></div>
            <div className="row-side">
              <span className="amount">{euros(p.prix)}</span>
              <button className="btn btn-outline btn-sm" onClick={() => setEdit(p.id)}>Modifier</button>
            </div>
          </div>
        ))}
      </section>
    </>
  )
}
