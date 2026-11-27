// Calculs du devis, faits par le code (jamais par le modèle), en CENTIMES ENTIERS.
//
// Ordre et arrondis (identiques à l'écran et dans le PDF) :
// 1. Total de ligne = quantité × prix unitaire, arrondi au centime.
// 2. Total HT = somme des totaux de ligne (déjà arrondis).
// 3. TVA = total HT × taux, arrondie au centime.
// 4. TTC = HT + TVA.
// Arrondi : demi-centime vers le haut (0,005 € -> 0,01 €).
// Les prix ont au plus 2 décimales, les quantités et les taux au plus 2 décimales.

export const TAUX_TVA = [20, 10, 5.5, 0]
export const PRIX_MAX = 1_000_000
export const QTE_MAX = 10_000
export const TAUX_MAX = 100

// Entier à partir d'un nombre ayant au plus `dec` décimales (évite 1.005 * 100 = 100.4999…).
const enEntier = (n, dec) => Math.round(Number((Number(n)).toFixed(dec)) * 10 ** dec)

// Arrondi au centime, demi vers le haut (en valeur absolue). Utilisé pour l'acompte.
export const round2 = (n) => {
  const x = Number(n)
  const s = x < 0 ? -1 : 1
  return (s * Math.floor(Math.abs(x) * 100 + 0.5 + 1e-9)) / 100
}

// Prix absent (null) = ligne pas encore chiffrée par l'artisan.
export const ligneChiffree = (l) => l.prix !== null && l.prix !== undefined && l.prix !== '' && Number.isFinite(Number(l.prix))
export const quantiteRenseignee = (l) => l.qte !== null && l.qte !== undefined && l.qte !== '' && Number.isFinite(Number(l.qte))

// qte (2 déc.) × prix (2 déc.) = produit en 1/10 000 € ; arrondi au centime.
function centimesLigne(l) {
  const q = enEntier(l.qte, 2)
  const p = enEntier(l.prix, 2)
  const dixMillemes = q * p
  return Math.floor((dixMillemes + 50) / 100)
}

export const totalLigne = (l) => (ligneChiffree(l) && quantiteRenseignee(l) ? centimesLigne(l) / 100 : null)

export const tauxValide = (t) => t !== null && t !== undefined && t !== '' && Number.isFinite(Number(t)) &&
  Number(t) >= 0 && Number(t) <= TAUX_MAX && Math.abs(Number(t) * 100 - Math.round(Number(t) * 100)) < 1e-6

// taux = null : TVA pas encore choisie -> pas de TVA ni de TTC affichés.
export function calculerTotaux(lignes, taux) {
  const htC = (lignes || []).reduce((s, l) => s + (ligneChiffree(l) && quantiteRenseignee(l) ? centimesLigne(l) : 0), 0)
  if (taux === null || taux === undefined || taux === '' || !Number.isFinite(Number(taux))) return { ht: htC / 100, tva: null, ttc: null }
  // taux en centièmes de % : htC × t / 10 000, arrondi au centime (demi vers le haut).
  const t = enEntier(taux, 2)
  const tvaC = Math.floor((htC * t + 5000) / 10000)
  return { ht: htC / 100, tva: tvaC / 100, ttc: (htC + tvaC) / 100 }
}

// Ce qui empêche la validation du devis (liste vide = prêt à valider).
export function blocagesValidation(doc) {
  const b = []
  const lignes = (doc.lignes || []).filter((l) => String(l.label || '').trim() || ligneChiffree(l))
  if (lignes.length === 0) b.push('Ajoutez au moins une ligne.')
  if (lignes.some((l) => !String(l.label || '').trim())) b.push('Donnez un libellé à chaque ligne.')
  if (lignes.some((l) => !ligneChiffree(l))) b.push('Saisissez le prix de chaque ligne (lignes « À chiffrer »).')
  if (lignes.some((l) => ligneChiffree(l) && (Number(l.prix) < 0 || Number(l.prix) > PRIX_MAX))) b.push(`Chaque prix doit être compris entre 0 et ${PRIX_MAX.toLocaleString('fr-FR')} €.`)
  if (lignes.some((l) => !quantiteRenseignee(l))) b.push('Indiquez la quantité de chaque ligne (quantités « À saisir »).')
  else if (lignes.some((l) => !(Number(l.qte) > 0) || Number(l.qte) > QTE_MAX)) b.push(`Chaque quantité doit être supérieure à 0 et au plus ${QTE_MAX.toLocaleString('fr-FR')}.`)
  if (!tauxValide(doc.tva)) b.push('Choisissez le taux de TVA (entre 0 et 100 %, 2 décimales au plus).')
  return b
}
