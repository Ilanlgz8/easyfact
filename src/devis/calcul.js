// Calculs du devis, faits par le code (jamais par le modèle).
// Règle d'arrondi : total HT arrondi au centime, TVA calculée sur ce total puis arrondie,
// TTC = HT + TVA. Mode d'arrondi : demi-centime vers le haut (0,005 -> 0,01).

export const TAUX_TVA = [20, 10, 5.5, 0]

export const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100

// Prix absent (null) = ligne pas encore chiffrée par l'artisan.
export const ligneChiffree = (l) => l.prix !== null && l.prix !== undefined && l.prix !== '' && Number.isFinite(Number(l.prix))

export const totalLigne = (l) => (ligneChiffree(l) ? round2(Number(l.qte) * Number(l.prix)) : null)

// taux = null : TVA pas encore choisie -> pas de TVA ni de TTC affichés.
export function calculerTotaux(lignes, taux) {
  const ht = round2((lignes || []).reduce((s, l) => s + (ligneChiffree(l) ? Number(l.qte) * Number(l.prix) : 0), 0))
  if (taux === null || taux === undefined || taux === '') return { ht, tva: null, ttc: null }
  const tva = round2(ht * Number(taux) / 100)
  return { ht, tva, ttc: round2(ht + tva) }
}

// Ce qui empêche la validation du devis (liste vide = prêt à valider).
export function blocagesValidation(doc) {
  const b = []
  const lignes = (doc.lignes || []).filter((l) => String(l.label || '').trim() || ligneChiffree(l))
  if (lignes.length === 0) b.push('Ajoutez au moins une ligne.')
  if (lignes.some((l) => !ligneChiffree(l))) b.push('Saisissez le prix des lignes hors catalogue.')
  if (lignes.some((l) => !(Number(l.qte) > 0))) b.push('Chaque quantité doit être supérieure à 0.')
  if (!TAUX_TVA.includes(doc.tva)) b.push('Choisissez le taux de TVA.')
  return b
}
