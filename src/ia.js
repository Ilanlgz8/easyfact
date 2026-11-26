// IA SIMULÉE pour la démo.
// Elle lit la description des travaux, repère des mots-clés et propose
// des lignes à partir du catalogue de prestations de l'artisan.
// Dans le vrai produit, cette fonction serait remplacée par un appel au
// modèle hébergé sur OVH AI Endpoints, qui utiliserait l'outil « Créer un devis ».

const find = (prestations, mot) =>
  prestations.find((p) => p.nom.toLowerCase().includes(mot))

export function preparerLignes(texte, prestations, entreprise) {
  const t = (texte || '').toLowerCase()
  const lignes = []
  let forfait = false

  if (t.includes('chauffe')) {
    const p = find(prestations, 'chauffe-eau')
    lignes.push({ label: 'Pose chauffe-eau (forfait)', qte: 1, prix: p ? p.prix : 280 })
    const litres = t.match(/(\d+)\s*l\b/)
    lignes.push({ label: `Chauffe-eau ${litres ? litres[1] + ' L' : ''} (fourniture)`.replace('  ', ' '), qte: 1, prix: 390 })
    forfait = true
  }
  if (t.includes('mitigeur')) {
    const p = find(prestations, 'mitigeur')
    const n = t.match(/(\d+)\s*mitigeur/)
    lignes.push({ label: 'Pose d’un mitigeur', qte: n ? parseInt(n[1], 10) : 1, prix: p ? p.prix : 80 })
    forfait = true
  }
  if (t.includes('fuite')) {
    const p = find(prestations, 'fuite')
    lignes.push({ label: 'Recherche de fuite (forfait)', qte: 1, prix: p ? p.prix : 120 })
    forfait = true
  }

  // Heures de main-d'œuvre, seulement si aucun forfait ne les couvre déjà
  const heures = t.match(/(\d+)\s*h\b/)
  if (!forfait || (heures && !t.includes('chauffe'))) {
    lignes.push({ label: 'Main-d’œuvre', qte: heures ? parseInt(heures[1], 10) : 1, prix: Number(entreprise.tauxHoraire) || 45 })
  }

  const dep = Number(entreprise.deplacement) || 0
  if (dep > 0) lignes.push({ label: 'Déplacement', qte: 1, prix: dep })

  return lignes
}
