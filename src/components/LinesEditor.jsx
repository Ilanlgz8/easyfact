import { euros, round2, totaux } from '../store.jsx'

// Éditeur de lignes partagé par « Nouveau devis » et « Nouvelle facture »
export default function LinesEditor({ doc, setDoc, acomptePct = 0 }) {
  const setLine = (i, patch) => setDoc({ ...doc, lignes: doc.lignes.map((l, j) => (j === i ? { ...l, ...patch } : l)) })
  const remove = (i) => setDoc({ ...doc, lignes: doc.lignes.filter((_, j) => j !== i) })
  const t = totaux(doc)
  const acompte = round2(t.ttc * acomptePct / 100)

  return (
    <>
      {doc.lignes.map((l, i) => (
        <div className="line" key={i}>
          <div className="line-label">
            {l.custom
              ? <input aria-label="Libellé de la ligne" value={l.label} placeholder="Nouvelle ligne" onChange={(e) => setLine(i, { label: e.target.value })} />
              : l.label}
          </div>
          <div className="qty">
            <button type="button" aria-label="Retirer 1" onClick={() => (l.qte <= 1 ? remove(i) : setLine(i, { qte: l.qte - 1 }))}>−</button>
            <span aria-label="Quantité">{l.qte}</span>
            <button type="button" aria-label="Ajouter 1" onClick={() => setLine(i, { qte: l.qte + 1 })}>+</button>
          </div>
          <label className="price">
            Prix HT
            <input inputMode="decimal" value={String(l.prix).replace('.', ',')}
              onChange={(e) => {
                const v = e.target.value.replace(',', '.')
                if (v === '' || /^\d*\.?\d{0,2}$/.test(v)) setLine(i, { prix: v === '' ? 0 : v.endsWith('.') ? v : Number(v) })
              }} />
          </label>
          <span className="line-total">{euros(l.qte * Number(l.prix))}</span>
        </div>
      ))}

      <button type="button" className="btn btn-outline btn-block" style={{ marginTop: 16 }}
        onClick={() => setDoc({ ...doc, lignes: [...doc.lignes, { label: '', qte: 1, prix: 0, custom: true }] })}>
        + Ajouter une ligne
      </button>

      <div className="totals">
        <div><span>Total HT</span><strong>{euros(t.ht)}</strong></div>
        <div>
          <label htmlFor="tva" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            TVA
            <select id="tva" value={doc.tva} onChange={(e) => setDoc({ ...doc, tva: Number(e.target.value) })}
              style={{ border: '1.5px solid var(--border)', borderRadius: 8, padding: '4px 8px', background: 'var(--white)' }}>
              <option value={20}>20 %</option>
              <option value={10}>10 %</option>
              <option value={5.5}>5,5 %</option>
              <option value={0}>0 % (franchise)</option>
            </select>
          </label>
          <strong>{euros(t.tva)}</strong>
        </div>
        <div className="big"><span>Total TTC</span><strong>{euros(t.ttc)}</strong></div>
        {acomptePct > 0 && (
          <>
            <div><span>Acompte déjà versé ({acomptePct} %)</span><strong>− {euros(acompte)}</strong></div>
            <div className="big"><span>Reste à payer</span><strong>{euros(t.ttc - acompte)}</strong></div>
          </>
        )}
        {doc.tva === 10 && <p className="muted small">TVA à 10 % : travaux dans un logement de plus de 2 ans. Le client le certifie sur le devis ou la facture.</p>}
        {doc.tva === 0 && <p className="muted small">Mention ajoutée : « TVA non applicable, art. 293 B du CGI ».</p>}
        <p className="muted small" style={{ marginTop: 6 }}>Ajoutés automatiquement : vos coordonnées, SIRET, assurance décennale, conditions de paiement.</p>
      </div>
    </>
  )
}
