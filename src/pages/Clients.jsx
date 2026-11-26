import { useState } from 'react'
import { Badge } from '../components/ui.jsx'
import { useStore, euros, montant } from '../store.jsx'
import { statutDevis, statutFacture } from '../data.js'

const plural = (n, w) => `${n} ${w}${n > 1 ? 's' : ''}`

function resume(devis, factures) {
  const parts = []
  const c = (st) => devis.filter((d) => d.statut === st).length
  if (c('pret')) parts.push(`${plural(c('pret'), 'devis')} ${c('pret') > 1 ? 'prêts' : 'prêt'} à envoyer`)
  if (c('attente')) parts.push(`${plural(c('attente'), 'devis')} en attente`)
  if (c('signe')) parts.push(`${plural(c('signe'), 'devis')} ${c('signe') > 1 ? 'signés' : 'signé'}`)
  const imp = factures.filter((f) => f.statut === 'attente').length
  if (imp) parts.push(`${plural(imp, 'facture')} à encaisser`)
  return parts.join(', ') || 'Aucun document en cours'
}

export default function Clients() {
  const { clients, devis, factures, addClient, notify } = useStore()
  const [open, setOpen] = useState(null)
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ nom: '', type: 'Particulier' })

  const save = (e) => {
    e.preventDefault()
    if (!form.nom.trim()) return
    addClient(form.nom.trim(), form.type)
    notify('Client ajouté.')
    setForm({ nom: '', type: 'Particulier' })
    setAdding(false)
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Clients</h1>
          <p className="muted" style={{ marginTop: 6 }}>{clients.length} clients · données d’exemple</p>
        </div>
        <button className="btn btn-dark" onClick={() => setAdding(!adding)}>+ Nouveau client</button>
      </div>

      {adding && (
        <form className="card" onSubmit={save} style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="field" style={{ flex: '1 1 260px' }}>
            <label htmlFor="nom">Nom du client</label>
            <input id="nom" className="input" placeholder="Ex. : Mme Bernard" value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} autoFocus />
          </div>
          <div className="choices">
            {['Particulier', 'Pro'].map((t) => (
              <label key={t} className={'choice' + (form.type === t ? ' on' : '')}>
                <input type="radio" name="type" checked={form.type === t} onChange={() => setForm({ ...form, type: t })} />{t}
              </label>
            ))}
          </div>
          <button type="submit" className="btn btn-mint">Ajouter</button>
        </form>
      )}

      <section className="list">
        {clients.map((c) => {
          const d = devis.filter((x) => x.clientId === c.id)
          const f = factures.filter((x) => x.clientId === c.id)
          return (
            <div key={c.id}>
              <div className="row">
                <div className="row-main"><strong>{c.nom}</strong><span>{resume(d, f)}</span></div>
                <div className="row-side">
                  <Badge tone={c.type === 'Pro' ? 'mint' : 'grey'}>{c.type}</Badge>
                  <button className="btn btn-outline btn-sm" aria-expanded={open === c.id} onClick={() => setOpen(open === c.id ? null : c.id)}>{open === c.id ? 'Fermer' : 'Ouvrir'}</button>
                </div>
              </div>
              {open === c.id && (
                <div style={{ padding: '0 0 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[...d.map((x) => ['Devis', x, statutDevis]), ...f.map((x) => ['Facture', x, statutFacture])].map(([type, x, st]) => (
                    <div key={x.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, background: 'var(--cream)', borderRadius: 12, padding: '12px 16px', flexWrap: 'wrap' }}>
                      <span>{type} n° {x.numero} · <strong>{euros(montant(x))}</strong></span>
                      <Badge tone={st[x.statut].tone}>{st[x.statut].label}</Badge>
                    </div>
                  ))}
                  {d.length + f.length === 0 && <p className="muted">Aucun devis ni facture pour ce client.</p>}
                </div>
              )}
            </div>
          )
        })}
      </section>
    </>
  )
}
