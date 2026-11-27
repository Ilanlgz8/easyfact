import { useState } from 'react'
import { euros, round2, totaux } from '../store.jsx'
import { TAUX_TVA, totalLigne, ligneChiffree } from '../devis/calcul.js'

// Saisie d'un nombre décimal (virgule ou point, 2 décimales au plus). On garde le texte tapé
// tel quel (« 12,0 » ne devient pas « 12 » en cours de frappe) ; '' = non renseigné (null).
const RE_DECIMAL = /^\d*[.,]?\d{0,2}$/
const versValeur = (v) => (v === '' ? null : v.replace(',', '.'))
const affiche = (v) => (v === null || v === undefined ? '' : String(v).replace('.', ','))

// Éditeur de lignes partagé par « Nouveau devis » et « Nouvelle facture »
export default function LinesEditor({ doc, setDoc, acomptePct = 0, catalogue = [] }) {
  const setLine = (i, patch) => setDoc({ ...doc, lignes: doc.lignes.map((l, j) => (j === i ? { ...l, ...patch } : l)) })
  const remove = (i) => setDoc({ ...doc, lignes: doc.lignes.filter((_, j) => j !== i) })
  const t = totaux(doc)
  const acompte = t.ttc === null ? 0 : round2(t.ttc * acomptePct / 100)
  const tauxListe = doc.tva !== null && doc.tva !== undefined && TAUX_TVA.includes(Number(doc.tva))
  const [autre, setAutre] = useState(doc.tva !== null && doc.tva !== undefined && !tauxListe)
  const [autreTexte, setAutreTexte] = useState(autre ? affiche(doc.tva) : '')
  const valeurSelect = autre ? 'autre' : (doc.tva ?? '')

  const plus = (q, d) => {
    const n = Math.round(((Number(q) || 0) + d) * 100) / 100
    return n
  }

  const ajouterDuCatalogue = (id) => {
    const p = catalogue.find((x) => x.id === id)
    if (!p) return
    setDoc({ ...doc, lignes: [...doc.lignes.filter((l) => String(l.label || '').trim() || ligneChiffree(l)), { label: p.nom, qte: 1, prix: Number(p.prix) }] })
  }

  return (
    <>
      {doc.lignes.map((l, i) => (
        <div className="line" key={i}>
          <div className="line-label">
            {l.custom
              ? <input aria-label={`Libellé de la ligne ${i + 1}`} value={l.label} placeholder="Nouvelle ligne" onChange={(e) => setLine(i, { label: e.target.value })} />
              : l.label}
          </div>
          <div className="qty">
            <button type="button" aria-label={`Retirer 1 à la quantité de la ligne ${i + 1}`} onClick={() => (Number(l.qte) <= 1 ? remove(i) : setLine(i, { qte: plus(l.qte, -1) }))}>−</button>
            <input className="qty-input" inputMode="decimal" aria-label={`Quantité de la ligne ${i + 1}`} value={affiche(l.qte)} placeholder="À saisir"
              style={l.qte === null ? { borderColor: '#B45309' } : undefined}
              onChange={(e) => { const v = e.target.value; if (RE_DECIMAL.test(v)) setLine(i, { qte: versValeur(v) }) }} />
            {l.unite && <span className="small muted">{l.unite}</span>}
            <button type="button" aria-label={`Ajouter 1 à la quantité de la ligne ${i + 1}`} onClick={() => setLine(i, { qte: plus(l.qte, 1) })}>+</button>
          </div>
          <label className="price">
            Prix HT
            <input inputMode="decimal" aria-label={`Prix unitaire HT de la ligne ${i + 1}`} value={affiche(l.prix)} placeholder="À saisir"
              onChange={(e) => { const v = e.target.value; if (RE_DECIMAL.test(v)) setLine(i, { prix: versValeur(v) }) }} />
          </label>
          <span className="line-total">{totalLigne(l) === null ? 'À chiffrer' : euros(totalLigne(l))}</span>
          {l.horsCatalogue && <p className="muted small" style={{ flexBasis: '100%', color: '#B45309' }}>Hors catalogue : prestation non trouvée dans vos tarifs. Saisissez votre prix ou supprimez la ligne.</p>}
          {l.qte === null && <p className="muted small" style={{ flexBasis: '100%', color: '#B45309' }}>Quantité non précisée dans la demande : indiquez-la.</p>}
        </div>
      ))}

      {catalogue.length > 0 && (
        <label className="small" style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 16, fontWeight: 600 }}>
          Ajouter une prestation de mon catalogue
          <select className="input" value="" onChange={(e) => ajouterDuCatalogue(e.target.value)}>
            <option value="">Choisir une prestation…</option>
            {catalogue.map((p) => <option key={p.id} value={p.id}>{p.nom} — {euros(p.prix)}</option>)}
          </select>
        </label>
      )}
      <button type="button" className="btn btn-outline btn-block" style={{ marginTop: 12 }}
        onClick={() => setDoc({ ...doc, lignes: [...doc.lignes, { label: '', qte: 1, prix: null, custom: true }] })}>
        + Ajouter une ligne libre
      </button>

      <div className="totals">
        <div><span>Total HT</span><strong>{euros(t.ht)}</strong></div>
        <div>
          <label htmlFor="tva" style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            TVA
            <select id="tva" value={valeurSelect}
              onChange={(e) => {
                const v = e.target.value
                if (v === 'autre') { setAutre(true); setDoc({ ...doc, tva: autreTexte === '' ? null : Number(versValeur(autreTexte)) }); return }
                setAutre(false)
                setDoc({ ...doc, tva: v === '' ? null : Number(v) })
              }}
              style={{ border: '1.5px solid ' + (doc.tva == null ? '#B45309' : 'var(--border)'), borderRadius: 8, padding: '4px 8px', background: 'var(--white)' }}>
              {doc.tva == null && !autre && <option value="" disabled>À choisir</option>}
              <option value={20}>20 %</option>
              <option value={10}>10 %</option>
              <option value={5.5}>5,5 %</option>
              <option value={0}>0 % (franchise)</option>
              <option value="autre">Autre taux…</option>
            </select>
            {autre && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <input inputMode="decimal" aria-label="Autre taux de TVA en %" value={autreTexte} placeholder="ex. 2,1" style={{ width: 80, border: '1.5px solid var(--border)', borderRadius: 8, padding: '4px 8px' }}
                  onChange={(e) => { const v = e.target.value; if (!RE_DECIMAL.test(v)) return; setAutreTexte(v); setDoc({ ...doc, tva: v === '' ? null : Number(versValeur(v)) }) }} />
                %
              </span>
            )}
          </label>
          <strong>{t.tva === null ? '—' : euros(t.tva)}</strong>
        </div>
        <div className="big"><span>Total TTC</span><strong>{t.ttc === null ? '—' : euros(t.ttc)}</strong></div>
        {doc.tva == null && <p className="small" style={{ color: '#B45309' }}>Choisissez vous-même le taux de TVA applicable à ce chantier.</p>}
        {autre && <p className="muted small">Taux saisi par vous : EasyFact ne vérifie pas qu’il s’applique à ce chantier.</p>}
        {acomptePct > 0 && t.ttc !== null && (
          <>
            <div><span>Acompte déjà versé ({acomptePct} %)</span><strong>− {euros(acompte)}</strong></div>
            <div className="big"><span>Reste à payer</span><strong>{euros(round2(t.ttc - acompte))}</strong></div>
          </>
        )}
        {Number(doc.tva) === 10 && !autre && <p className="muted small">TVA à 10 % : travaux dans un logement de plus de 2 ans. Le client le certifie sur le devis ou la facture.</p>}
        {doc.tva === 0 && !autre && <p className="muted small">Mention ajoutée : « TVA non applicable, art. 293 B du CGI ».</p>}
        <p className="muted small" style={{ marginTop: 6 }}>Ajoutés automatiquement : vos coordonnées, SIRET, assurance décennale, conditions de paiement.</p>
      </div>
    </>
  )
}
