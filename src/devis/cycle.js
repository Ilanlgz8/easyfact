// Cycle de vie des devis, en fonctions pures (testées sans navigateur).
//
// Règles :
// - Valider crée un devis figé : lignes, TVA, objet et une copie de l'entreprise et du client.
//   Changer ensuite le catalogue, le profil ou la fiche client ne le modifie pas.
// - Numérotation : numéro suivant = plus grand numéro existant + 1, sur 3 chiffres.
//   Les versions d'un même devis gardent son numéro (026 v1, 026 v2…).
// - Idempotence : chaque validation porte une clé unique ; une 2e validation avec la même clé
//   (double clic, réessai) renvoie le devis déjà créé au lieu d'en créer un autre.
// - Modifier un devis validé crée une nouvelle version ; l'ancienne passe à « remplacé »
//   et reste consultable. Rien n'est supprimé.
// - Verrou : on ne peut pas créer une nouvelle version d'un devis déjà remplacé ou facturé
//   (ex. modifié entre-temps dans un autre onglet) : erreur « conflit ».

export const STATUTS_NON_MODIFIABLES = ['remplace', 'facture']

export function prochainNumero(devis) {
  const max = (devis || []).reduce((m, d) => Math.max(m, parseInt(d.numero, 10) || 0), 0)
  return String(max + 1).padStart(3, '0')
}

const copie = (o) => (o ? JSON.parse(JSON.stringify(o)) : null)

function construire(doc, { id, date, cle, numero, version, entreprise, client, remplace }) {
  return {
    clientId: doc.clientId,
    objet: doc.objet,
    tva: doc.tva,
    lignes: copie(doc.lignes),
    id,
    numero,
    version,
    date,
    statut: 'attente',
    cle,
    ...(remplace ? { remplace } : {}),
    fige: { entreprise: copie(entreprise), client: copie(client) },
  }
}

// Renvoie { etat, devis, dejaFait } ou { erreur }.
export function creerDevis(etat, doc, { id, date, cle, entreprise, client }) {
  if (!cle) return { erreur: 'clé manquante' }
  const existant = etat.devis.find((d) => d.cle === cle)
  if (existant) return { etat, devis: existant, dejaFait: true }
  const devis = construire(doc, { id, date, cle, numero: prochainNumero(etat.devis), version: 1, entreprise, client })
  return { etat: { ...etat, devis: [devis, ...etat.devis] }, devis, dejaFait: false }
}

// Renvoie { etat, devis, dejaFait } ou { erreur: 'introuvable' | 'conflit' | 'clé manquante' }.
export function nouvelleVersion(etat, ancienId, doc, { id, date, cle, entreprise, client }) {
  if (!cle) return { erreur: 'clé manquante' }
  const existant = etat.devis.find((d) => d.cle === cle)
  if (existant) return { etat, devis: existant, dejaFait: true }
  const ancien = etat.devis.find((d) => d.id === ancienId)
  if (!ancien) return { erreur: 'introuvable' }
  if (STATUTS_NON_MODIFIABLES.includes(ancien.statut)) return { erreur: 'conflit', remplacePar: ancien.remplacePar || null }
  const devis = construire(doc, { id, date, cle, numero: ancien.numero, version: (ancien.version || 1) + 1, entreprise, client, remplace: ancien.id })
  const autres = etat.devis.map((d) => (d.id === ancien.id ? { ...d, statut: 'remplace', remplacePar: devis.id } : d))
  return { etat: { ...etat, devis: [devis, ...autres] }, devis, dejaFait: false }
}

// Dernière version d'un devis (en suivant remplacePar).
export function derniereVersion(devis, id) {
  let d = devis.find((x) => x.id === id)
  const vus = new Set()
  while (d && d.remplacePar && !vus.has(d.id)) {
    vus.add(d.id)
    d = devis.find((x) => x.id === d.remplacePar) || d
  }
  return d
}
