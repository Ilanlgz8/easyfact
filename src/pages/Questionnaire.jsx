import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FlowLayout } from '../components/ui.jsx'
import { useStore } from '../store.jsx'
import { METIERS } from '../marche/indices.js'

const Q1 = [
  { k: 'metiers', label: 'Votre métier', multi: true, opts: [...METIERS, 'Autre'] },
  { k: 'equipe', label: 'Vous travaillez', opts: ['Seul', '2 à 5 personnes', '6 personnes et plus'] },
  { k: 'devisParMois', label: 'Combien de devis par mois ?', opts: ['Moins de 5', '5 à 15', '16 à 30', 'Plus de 30'] },
  { k: 'methode', label: 'Aujourd’hui, vous faites vos devis', multi: true, opts: ['Sur papier', 'Avec Word ou Excel', 'Avec un logiciel'] },
  { k: 'tva', label: 'Facturez-vous la TVA ?', opts: ['Oui', 'Non (franchise en base)'] },
  { k: 'clients', label: 'Vos clients', multi: true, opts: ['Particuliers', 'Professionnels'] },
  { k: 'acompte', label: 'Acompte demandé', opts: ['Aucun', '30 %', '40 %', '50 %'] },
  { k: 'delai', label: 'Délai de paiement', opts: ['À réception', '15 jours', '30 jours'] },
]

const Q2 = [
  { k: 'nom', label: 'Nom de l’entreprise', ph: 'Nom de votre entreprise' },
  { k: 'siret', label: 'SIRET', ph: '14 chiffres' },
  { k: 'adresse', label: 'Adresse', ph: 'N°, rue, code postal, ville' },
  { k: 'telephone', label: 'Téléphone', ph: '06 39 98 00 00' },
  { k: 'tauxHoraire', label: 'Taux horaire HT (€)', ph: 'Votre taux horaire', num: true },
  { k: 'deplacement', label: 'Frais de déplacement HT (€)', ph: '0 si vous n’en facturez pas', num: true },
  { k: 'assureur', label: 'Assureur décennale', ph: 'Nom de l’assureur' },
  { k: 'contrat', label: 'N° de contrat décennale', ph: 'Numéro de contrat' },
]

const empty = { metierAutre: '', metiers: [], methode: [], clients: [], equipe: '', devisParMois: '', tva: '', acompte: '', delai: '', style: '', anciensDevis: '' }

export default function Questionnaire() {
  const navigate = useNavigate()
  const { demarrerActivite, notify } = useStore()
  const [a, setA] = useState(empty)
  const [envoi, setEnvoi] = useState(false)
  const [missing, setMissing] = useState([])

  const toggle = (k, v, multi) => {
    if (!multi) return setA({ ...a, [k]: v })
    const cur = a[k] || []
    setA({ ...a, [k]: cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v] })
  }
  const isOn = (k, v) => (Array.isArray(a[k]) ? a[k].includes(v) : a[k] === v)

  const submit = async (e) => {
    e.preventDefault()
    if (envoi) return
    const miss = [...Q1, ...Q2].filter((q) => {
      const v = a[q.k]
      return Array.isArray(v) ? v.length === 0 : v === undefined || String(v).trim() === ''
    })
    if (a.siret && a.siret.replace(/\s/g, '').length !== 14) miss.push({ k: 'siret', label: 'SIRET (14 chiffres)' })
    if (a.metiers.includes('Autre') && !a.metierAutre.trim()) miss.unshift({ k: 'metierAutre', label: 'Votre métier (Autre)' })
    setMissing(miss.map((q) => q.k))
    if (miss.length) {
      notify('Il manque ' + miss.length + ' réponse' + (miss.length > 1 ? 's' : '') + ' obligatoire' + (miss.length > 1 ? 's' : '') + '.')
      // On amène l'artisan sur la première réponse manquante (focus + défilement).
      const k = miss[0].k
      setTimeout(() => {
        const el = document.getElementById(k) || document.querySelector(`input[name="${k}"]`)
        if (el) { el.focus(); el.scrollIntoView({ block: 'center', behavior: 'smooth' }) }
      }, 0)
      return
    }
    // « Autre » est remplacé par le métier saisi : c'est lui qui est transmis à l'IA (devis, prix du marché).
    const { metierAutre, ...reste } = a
    const metiers = a.metiers.filter((m) => m !== 'Autre').concat(a.metiers.includes('Autre') ? [metierAutre.trim().slice(0, 60)] : [])
    // Métier « Autre » : l'IA propose les NOMS d'un catalogue de départ (sans prix). En cas d'échec, on continue sans.
    let elementsIA = []
    if (a.metiers.includes('Autre')) {
      setEnvoi(true)
      try {
        const rep = await fetch('/api/marche', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ metier: metierAutre.trim(), action: 'catalogue' }) })
        if (rep.ok) elementsIA = (await rep.json()).elements || []
      } catch { /* hors ligne : catalogue sans propositions */ }
    }
    demarrerActivite({ ...reste, metiers, tauxHoraire: Number(a.tauxHoraire), deplacement: Number(a.deplacement) }, elementsIA)
    notify(elementsIA.length ? 'C’est réglé ! L’IA a préparé votre catalogue : ajoutez vos prix.' : 'C’est réglé ! Bienvenue sur EasyFact.')
    navigate('/app')
  }

  const err = (k) => missing.includes(k)

  return (
    <FlowLayout cancelTo={null}>
      <form className="flow" onSubmit={submit} noValidate>
        <div>
          <h1>Réglons EasyFact pour vous</h1>
          <p className="muted" style={{ marginTop: 6 }}>Les questions marquées d’un <span className="req">*</span> sont obligatoires.</p>
        </div>

        <section className="card" style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          <div>
            <p className="small" style={{ color: '#1a6b48', fontWeight: 600 }}>Partie 1 sur 3</p>
            <h2 style={{ fontSize: 26, marginTop: 4 }}>Votre activité</h2>
            <p className="muted small">Il suffit de cocher.</p>
          </div>
          {Q1.map((q) => (
            <fieldset key={q.k} style={{ border: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <legend className="label" style={{ marginBottom: 10 }}>{q.label} <span className="req">*</span></legend>
              <div className="choices">
                {q.opts.map((o) => (
                  <label key={o} className={'choice' + (isOn(q.k, o) ? ' on' : '')}>
                    <input type={q.multi ? 'checkbox' : 'radio'} name={q.k} checked={isOn(q.k, o)} onChange={() => toggle(q.k, o, q.multi)} />
                    {o}
                  </label>
                ))}
              </div>
              {err(q.k) && <span className="error" role="alert">Cette réponse est obligatoire.</span>}
              {q.k === 'metiers' && a.metiers.includes('Autre') && (
                <div className="field">
                  <label htmlFor="metierAutre">Précisez votre métier <span className="req">*</span></label>
                  <input id="metierAutre" className="input" maxLength={60} placeholder="Ex. : ébéniste, plaquiste, serrurier…" value={a.metierAutre}
                    onChange={(e) => setA({ ...a, metierAutre: e.target.value })} style={err('metierAutre') ? { borderColor: 'var(--danger)' } : undefined} />
                  {err('metierAutre') && <span className="error">Indiquez votre métier.</span>}
                  <p className="muted small">L’IA s’en sert pour comprendre vos demandes et choisir l’index de prix du marché le plus proche.</p>
                </div>
              )}
            </fieldset>
          ))}
        </section>

        <section className="card" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <p className="small" style={{ color: '#1a6b48', fontWeight: 600 }}>Partie 2 sur 3</p>
            <h2 style={{ fontSize: 26, marginTop: 4 }}>Votre entreprise</h2>
            <p className="muted small">Ces informations apparaîtront sur vos devis et factures.</p>
          </div>
          <div className="form-grid">
            {Q2.map((q) => (
              <div key={q.k} className="field">
                <label htmlFor={q.k}>{q.label} <span className="req">*</span></label>
                <input id={q.k} className="input" inputMode={q.num || q.k === 'siret' ? 'numeric' : undefined} placeholder={q.ph}
                  value={a[q.k] || ''} onChange={(e) => setA({ ...a, [q.k]: e.target.value })}
                  style={err(q.k) ? { borderColor: 'var(--danger)' } : undefined} />
                {err(q.k) && <span className="error">{q.k === 'siret' && a.siret ? 'Le SIRET compte 14 chiffres.' : 'Ce champ est obligatoire.'}</span>}
              </div>
            ))}
          </div>
        </section>

        <section className="card" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <p className="small" style={{ color: '#1a6b48', fontWeight: 600 }}>Partie 3 sur 3</p>
            <h2 style={{ fontSize: 26, marginTop: 4 }}>Personnalisation</h2>
            <p className="muted small">Cette partie est facultative.</p>
          </div>
          <div className="field">
            <label htmlFor="anciens">Vos anciens devis <span className="muted" style={{ fontWeight: 400 }}>(facultatif)</span></label>
            <p className="muted small">Prochainement : l’IA reprendra vos prestations et vos prix. Démonstration : les fichiers ne sont ni envoyés ni analysés.</p>
            <div className="dropzone">
              <input id="anciens" type="file" multiple accept=".pdf,.doc,.docx,.xls,.xlsx,image/*"
                onChange={(e) => setA({ ...a, anciensDevis: [...e.target.files].map((f) => f.name).join(', ') })} />
            </div>
          </div>
          <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
            <legend className="label" style={{ marginBottom: 10 }}>Voulez-vous que nous reprenions le style de vos devis ? <span className="muted" style={{ fontWeight: 400 }}>(facultatif)</span></legend>
            <div className="choices">
              {['Oui, gardez mon style', 'Non, utilisez le modèle EasyFact'].map((o) => (
                <label key={o} className={'choice' + (a.style === o ? ' on' : '')}>
                  <input type="radio" name="style" checked={a.style === o} onChange={() => setA({ ...a, style: o })} />
                  {o}
                </label>
              ))}
            </div>
          </fieldset>
        </section>

        <button type="submit" className="btn btn-dark btn-block" style={{ minHeight: 56 }} disabled={envoi}>{envoi ? 'L’IA prépare votre catalogue…' : 'Terminer et accéder à mon accueil'}</button>
      </form>
    </FlowLayout>
  )
}
