// Assistant SIMULÉ (sans IA) pour la démonstration. Interdit en production.
// Il répond par règles simples à partir des données du compte (devis, clients, catalogue,
// conversations passées) et de l'aide du site. Il ne modifie rien, ne valide rien, n'envoie rien.
// Toute affirmation sur le passé s'appuie sur un enregistrement retrouvé (source jointe) ;
// sinon : « je n'ai pas trouvé ». Les messages et les données sont traités comme des données,
// jamais comme des consignes.
import { calculerTotaux } from '../devis/calcul.js'
import { normaliser } from '../devis/extraction.js'

export const EXEMPLES = [
  'Retrouve le dernier devis de M. Martin',
  'Qu’avais-je proposé le mois dernier ?',
  'Quel est mon prix pour la recherche de fuite ?',
  'Comment faire un PDF ?',
]

const eur = (n) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n || 0)
const prixCat = (n) => (n === null || n === undefined ? 'prix à saisir' : eur(n) + ' HT')
const dateFr = (iso) => {
  const [y, m, d] = iso.split('-').map(Number)
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(y, m - 1, d)))
}
const MOTS_VIDES = new Set(['le', 'la', 'les', 'de', 'du', 'des', 'un', 'une', 'mon', 'ma', 'mes', 'pour', 'quel', 'quelle', 'est', 'prix', 'tarif', 'combien', 'coute', 'a', 'au', 'aux', 'et', 'en', 'sur', 'ce', 'cette', 'd', 'l', 'je', 'j', 'avais', 'avait', 'on', 'quoi', 'propos', 'chantier', 'parle', 'parler', 'discute', 'dit', 'qu', 'que', 'qui', 'retrouve', 'dernier', 'devis', 'client', 'm', 'mme', 'monsieur', 'madame', 'moi'])
const mots = (s) => normaliser(s).replace(/'/g, ' ').split(' ').filter((w) => w.length >= 3 && !MOTS_VIDES.has(w))

// Date du jour à Paris, 'YYYY-MM-DD' (calculée côté application, pas par un modèle).
export const aujourdhuiParis = (maintenant = new Date()) => maintenant.toLocaleDateString('fr-CA', { timeZone: 'Europe/Paris' })

export function periodeRelative(texte, maintenant = new Date()) {
  const t = normaliser(texte)
  const [y, m, d] = aujourdhuiParis(maintenant).split('-').map(Number)
  const iso = (Y, M, D) => `${Y}-${String(M).padStart(2, '0')}-${String(D).padStart(2, '0')}`
  const finMois = (Y, M) => new Date(Date.UTC(Y, M, 0)).getUTCDate()
  if (/mois dernier|mois precedent/.test(t)) {
    const Y = m === 1 ? y - 1 : y; const M = m === 1 ? 12 : m - 1
    return { debut: iso(Y, M, 1), fin: iso(Y, M, finMois(Y, M)), libelle: 'le mois dernier' }
  }
  if (/ce mois|mois ci/.test(t)) return { debut: iso(y, m, 1), fin: iso(y, m, finMois(y, m)), libelle: 'ce mois-ci' }
  if (/aujourd ?hui/.test(t)) return { debut: iso(y, m, d), fin: iso(y, m, d), libelle: 'aujourd’hui' }
  if (/semaine derniere|7 derniers jours/.test(t)) {
    const fin = new Date(Date.UTC(y, m - 1, d)); const debut = new Date(Date.UTC(y, m - 1, d - 7))
    return { debut: debut.toISOString().slice(0, 10), fin: fin.toISOString().slice(0, 10), libelle: 'les 7 derniers jours' }
  }
  return null
}

const ttc = (d) => calculerTotaux(d.lignes || [], d.tva).ttc
const versionsActives = (devis) => devis.filter((d) => d.statut !== 'remplace')
const resumeDevis = (d, client) => `Devis n° ${d.numero}${d.version > 1 ? ` (v${d.version})` : ''} — ${client?.nom || 'client inconnu'} — ${dateFr(d.date)} — ${ttc(d) === null ? 'TVA non choisie' : eur(ttc(d)) + ' TTC'} — ${d.objet || ''}`.trim()
const sourceDevis = (d) => ({ type: 'devis', id: d.id, libelle: `Devis n° ${d.numero}${d.version > 1 ? ` v${d.version}` : ''} du ${dateFr(d.date)}` })

// Clients dont le nom apparaît dans le message (nom complet ou nom de famille).
function clientsCites(texte, clients) {
  const t = ` ${normaliser(texte)} `
  return clients.filter((c) => {
    const n = normaliser(c.nom)
    const famille = normaliser(c.nom.replace(/^(m\.|mme|mlle|monsieur|madame)\s+/i, ''))
    return t.includes(` ${n} `) || (famille.length >= 3 && t.includes(` ${famille} `))
  })
}

export function repondre(message, { devis = [], clients = [], prestations = [], aide = [], conversations = [], maintenant = new Date() } = {}) {
  const t = normaliser(message)
  if (!t) return { texte: 'Écrivez votre question.' }

  // Hors périmètre : pas d'avis présenté comme fiable sur la TVA, le droit ou la sécurité du chantier.
  if (/\b(tva|taux|fiscal|impot|juridique|loi|legal|contrat|assurance|securite|norme|dtu)\b/.test(t) && !/\b(prix|tarif)\b/.test(t)) {
    return { texte: 'Je ne peux pas vous conseiller sur la TVA, le droit ou la sécurité d’un chantier : ce n’est pas fiable de ma part. Demandez à votre comptable ou à un professionnel. Dans un devis, c’est vous qui choisissez le taux de TVA.' }
  }

  // Écritures : l'assistant simulé ne modifie rien.
  if (/\b(ajoute|ajouter|modifie|modifier|supprime|supprimer|valide|valider|envoie|envoyer|change|changer)\b/.test(t) && /\b(ligne|devis|brouillon|prix)\b/.test(t)) {
    return { texte: 'Je ne modifie, ne valide, n’envoie et ne supprime aucun devis. Pour changer un devis validé : ouvrez-le, cliquez sur « Nouvelle version », puis ajoutez la ligne depuis votre catalogue.' }
  }

  // Questions d'utilisation : uniquement à partir de l'aide du site.
  if (/\b(comment|aide|ou trouver|faire un|obtenir)\b/.test(t)) {
    const cibles = [['pdf', 'pdf'], ['version', 'modifier'], ['modifi', 'modifier'], ['catalogue', 'catalogue'], ['prestation', 'catalogue'], ['ia', 'ia'], ['devis', 'devis'], ['donnee', 'donnees']]
    const id = cibles.find(([mot]) => t.includes(mot))?.[1]
    const s = aide.find((x) => x.id === id)
    if (s) return { texte: s.texte.join('\n'), sources: [{ type: 'aide', id: s.id, libelle: `Aide : ${s.titre}` }] }
    return { texte: 'Je n’ai pas trouvé cette question dans l’aide du site. Ouvrez « Aide » dans le menu.', sources: [{ type: 'aide', id: '', libelle: 'Aide' }] }
  }

  // Prix d'une prestation : catalogue de l'artisan.
  if (/\b(prix|tarif|combien|coute)\b/.test(t)) {
    const cherches = mots(message)
    const trouves = prestations.filter((p) => cherches.some((w) => mots(p.nom).some((x) => x.startsWith(w.slice(0, 5)) || w.startsWith(x.slice(0, 5)))))
    if (!trouves.length) return { texte: 'Je n’ai pas trouvé cette prestation dans votre catalogue (menu « Prestations »).' }
    // Nom complet écrit dans la question (« pose d’un mitigeur ») : c'est celui-là, pas les noms voisins.
    const complets = trouves.filter((p) => normaliser(message).includes(normaliser(p.nom)))
    if (complets.length === 1) trouves.splice(0, trouves.length, complets[0])
    if (trouves.length > 1) return { texte: 'Plusieurs prestations correspondent. Laquelle ?\n' + trouves.map((p) => `• ${p.nom} : ${prixCat(p.prix)}`).join('\n'), sources: [{ type: 'catalogue', id: '', libelle: 'Catalogue' }] }
    const p = trouves[0]
    return { texte: `Votre prix catalogue pour « ${p.nom} » : ${prixCat(p.prix)}${p.detail ? ` (${p.detail})` : ''}. Un devis déjà validé garde le prix qu’il avait à sa validation.`, sources: [{ type: 'catalogue', id: p.id, libelle: 'Catalogue : ' + p.nom }] }
  }

  // Conversations passées sur un sujet (« de quoi avait-on parlé à propos de … »).
  if (/\b(parle|discute|dit|conversation)\b/.test(t)) {
    const cherches = mots(message)
    if (!cherches.length) return { texte: 'De quel sujet ou de quel chantier ? Donnez un mot-clé (ex. « chauffe-eau »).' }
    const res = []
    for (const c of conversations) for (const m of c.messages || []) {
      if (m.role === 'artisan' && cherches.some((w) => normaliser(m.texte).includes(w))) res.push({ c, m })
    }
    if (!res.length) return { texte: `Je n’ai pas trouvé de conversation sur « ${cherches.join(' ')} ».` }
    const extrait = res.slice(-5)
    return { texte: 'Voici ce que vous m’aviez écrit :\n' + extrait.map(({ m }) => `• ${dateFr(m.date.slice(0, 10))} : « ${m.texte.slice(0, 120)} »`).join('\n'), sources: extrait.map(({ c }) => ({ type: 'conversation', id: c.id, libelle: 'Conversation : ' + c.titre })) }
  }

  // Devis par client et/ou par période.
  const cites = clientsCites(message, clients)
  const periode = periodeRelative(message, maintenant)
  if (/\b(devis|propose|proposition)\b/.test(t) || cites.length || periode) {
    if (cites.length > 1) return { texte: 'Plusieurs clients correspondent. Lequel ?\n' + cites.map((c) => `• ${c.nom}${c.type ? ` (${c.type})` : ''}`).join('\n') }
    let liste = versionsActives(devis)
    if (cites.length === 1) liste = liste.filter((d) => d.clientId === cites[0].id)
    if (periode) liste = liste.filter((d) => d.date >= periode.debut && d.date <= periode.fin)
    liste = [...liste].sort((a, b) => (b.date + b.numero).localeCompare(a.date + a.numero))
    const cible = [cites[0]?.nom, periode?.libelle].filter(Boolean).join(', ')
    if (!liste.length) return { texte: `Je n’ai pas trouvé de devis${cible ? ` (${cible})` : ''}.` }
    const nomDe = (d) => clients.find((c) => c.id === d.clientId) || d.fige?.client
    const veutLeDernier = /\bdernier\b/.test(t.replace(/\b(mois|semaine) (dernier|derniere)\b/g, ''))
    if (veutLeDernier || (cites.length === 1 && !periode)) {
      const d = liste[0]
      return { texte: `Dernier devis${cible ? ` (${cible})` : ''} :\n${resumeDevis(d, nomDe(d))}`, sources: [sourceDevis(d)] }
    }
    const ext = liste.slice(0, 5)
    return { texte: `${liste.length} devis${cible ? ` (${cible})` : ''}${liste.length > 5 ? ', voici les 5 plus récents' : ''} :\n` + ext.map((d) => '• ' + resumeDevis(d, nomDe(d))).join('\n'), sources: ext.map(sourceDevis) }
  }

  return { texte: 'Je n’ai pas compris. Je suis un assistant simulé qui sait répondre à quelques demandes, par exemple :\n' + EXEMPLES.map((e) => `• ${e}`).join('\n') }
}
