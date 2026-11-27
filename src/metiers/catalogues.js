// Catalogues de départ et exemples de démonstration PAR MÉTIER (données fictives).
//
// Prix : PRIX D'EXEMPLE À VÉRIFIER par l'artisan (marqués `exemple: true`), datés d'octobre 2025
// pour que l'évolution du marché (index INSEE) puisse être calculée et proposée pendant le devis.
// Ce ne sont pas des prix de référence du marché. L'IA ne fixe aucun prix.
//
// Chaque élément : { nom, detail, prix, type: 'prestation' | 'materiau', indice } ;
// `indice` = code de src/marche/indices.js (BT pour la main-d'œuvre, IPPI pour les matériaux).
import { indiceDuMetier, moisParis } from '../marche/indices.js'

export const DATE_EXEMPLES = '2025-10'

const P = (nom, detail, prix, indice) => ({ nom, detail, prix, type: 'prestation', indice })
const M = (nom, detail, prix, indice) => ({ nom, detail, prix, type: 'materiau', indice })

export const CATALOGUES = {
  plombier: [
    P('Pose d’un mitigeur', 'À l’unité, hors fourniture', 80, 'BT38'),
    P('Remplacement d’un chauffe-eau', 'Forfait de pose', 280, 'BT38'),
    P('Recherche de fuite', 'Forfait', 120, 'BT38'),
    P('Débouchage de canalisation', 'Forfait', 130, 'BT38'),
    M('Mitigeur thermostatique', 'À l’unité', 185, 'CUIVRE'),
    M('WC suspendu avec bâti', 'À l’unité', 520, 'SANITAIRES'),
    M('Tube cuivre Ø 14', 'Au mètre', 14, 'CUIVRE'),
    M('Tube PER Ø 16', 'Au mètre', 3, 'TUBES_PLAST'),
  ],
  electricien: [
    P('Pose d’une prise ou d’un interrupteur', 'À l’unité', 55, 'BT47'),
    P('Remplacement du tableau électrique', 'Forfait de pose', 650, 'BT47'),
    P('Diagnostic de panne', 'Forfait', 90, 'BT47'),
    P('Tirage de ligne', 'Au mètre', 12, 'BT47'),
    M('Câble électrique 3G2,5', 'Au mètre', 2.4, 'CABLES'),
    M('Câble électrique 3G1,5', 'Au mètre', 1.6, 'CABLES'),
    M('Tableau électrique 2 rangées équipé', 'À l’unité', 420, 'CABLES'),
    M('Prise de courant encastrée', 'À l’unité', 14, 'CABLES'),
  ],
  peintre: [
    P('Peinture murs et plafonds (2 couches)', 'Au m²', 24, 'BT46'),
    P('Préparation des supports (enduit, ponçage)', 'Au m²', 12, 'BT46'),
    P('Pose de papier peint', 'Au m²', 18, 'BT46'),
    P('Peinture de boiseries', 'Au mètre linéaire', 15, 'BT46'),
    M('Peinture acrylique mate', 'Pot de 10 L', 95, 'PEINTURE'),
    M('Sous-couche', 'Pot de 10 L', 70, 'PEINTURE'),
    M('Enduit de rebouchage', 'Sac de 5 kg', 18, 'PLATRE'),
  ],
  macon: [
    P('Montage de mur en parpaings', 'Au m²', 65, 'BT03'),
    P('Coulage de dalle béton', 'Au m²', 85, 'BT03'),
    P('Ouverture de mur porteur', 'Forfait', 1800, 'BT03'),
    P('Enduit de façade', 'Au m²', 45, 'BT03'),
    M('Parpaing 20 × 20 × 50', 'À l’unité', 1.9, 'PARPAINGS'),
    M('Ciment', 'Sac de 35 kg', 11, 'CIMENT'),
    M('Mortier prêt à l’emploi', 'Sac de 25 kg', 9, 'MORTIER'),
  ],
  menuisier: [
    P('Pose de porte intérieure', 'À l’unité', 180, 'BT18a'),
    P('Pose de parquet', 'Au m²', 30, 'BT18a'),
    P('Pose de fenêtre bois', 'À l’unité', 250, 'BT19b'),
    P('Fabrication et pose de placard sur mesure', 'Au mètre linéaire', 450, 'BT18a'),
    M('Parquet chêne massif', 'Au m²', 65, 'CHENE'),
    M('Bloc-porte intérieur bois', 'À l’unité', 210, 'MENUIS_BOIS'),
    M('Panneau contreplaqué 18 mm', 'À l’unité', 48, 'PANNEAUX'),
    M('Fenêtre bois double vitrage', 'À l’unité', 520, 'MENUIS_BOIS'),
  ],
  carreleur: [
    P('Pose de carrelage au sol', 'Au m²', 45, 'BT09'),
    P('Pose de faïence murale', 'Au m²', 50, 'BT09'),
    P('Dépose d’ancien carrelage', 'Au m²', 18, 'BT09'),
    P('Ragréage du sol', 'Au m²', 15, 'BT09'),
    M('Carrelage grès cérame', 'Au m²', 35, 'CARREAUX'),
    M('Faïence murale', 'Au m²', 28, 'CARREAUX'),
    M('Mortier-colle', 'Sac de 25 kg', 16, 'MORTIER'),
  ],
  chauffagiste: [
    P('Entretien de chaudière', 'Forfait annuel', 140, 'BT40'),
    P('Remplacement de chaudière', 'Forfait de pose', 1200, 'BT40'),
    P('Pose de radiateur', 'À l’unité', 160, 'BT40'),
    P('Désembouage du circuit', 'Forfait', 450, 'BT40'),
    M('Chaudière gaz à condensation', 'À l’unité', 2400, 'RADIATEURS'),
    M('Radiateur acier', 'À l’unité', 240, 'RADIATEURS'),
    M('Tube cuivre Ø 16', 'Au mètre', 16, 'CUIVRE'),
  ],
  couvreur: [
    P('Réfection de toiture en tuiles', 'Au m²', 95, 'BT32'),
    P('Remplacement de tuiles cassées', 'Forfait', 220, 'BT32'),
    P('Nettoyage et traitement de toiture', 'Au m²', 18, 'BT32'),
    P('Pose de gouttière', 'Au mètre linéaire', 40, 'BT34'),
    M('Tuile terre cuite', 'Au m²', 28, 'TUILES'),
    M('Liteau bois traité', 'Au mètre', 1.2, 'MENUIS_BOIS'),
    M('Écran sous-toiture', 'Au m²', 4, 'TUBES_PLAST'),
  ],
}

// Exemples de devis et factures par métier : { objet, lignes: [[nom du catalogue, quantité]] }.
// Les prix viennent du catalogue ; « Main-d’œuvre » et « Déplacement » des réponses au questionnaire.
const EXEMPLES = {
  plombier: [['Remplacement de deux mitigeurs', [['Pose d’un mitigeur', 2], ['Mitigeur thermostatique', 2], ['Déplacement', 1]]],
    ['Recherche et réparation de fuite', [['Recherche de fuite', 1], ['Tube cuivre Ø 14', 3], ['Main-d’œuvre', 2]]],
    ['Remplacement des WC', [['WC suspendu avec bâti', 1], ['Main-d’œuvre', 4], ['Déplacement', 1]]]],
  electricien: [['Remplacement du tableau électrique', [['Remplacement du tableau électrique', 1], ['Tableau électrique 2 rangées équipé', 1], ['Déplacement', 1]]],
    ['Ajout de prises dans le salon', [['Pose d’une prise ou d’un interrupteur', 4], ['Prise de courant encastrée', 4], ['Câble électrique 3G2,5', 25]]],
    ['Recherche de panne', [['Diagnostic de panne', 1], ['Main-d’œuvre', 1], ['Déplacement', 1]]]],
  peintre: [['Peinture d’un séjour de 40 m²', [['Préparation des supports (enduit, ponçage)', 40], ['Peinture murs et plafonds (2 couches)', 40], ['Peinture acrylique mate', 2]]],
    ['Papier peint de la chambre', [['Pose de papier peint', 25], ['Enduit de rebouchage', 1], ['Déplacement', 1]]],
    ['Peinture des boiseries', [['Peinture de boiseries', 20], ['Sous-couche', 1], ['Main-d’œuvre', 3]]]],
  macon: [['Mur de clôture', [['Montage de mur en parpaings', 18], ['Parpaing 20 × 20 × 50', 180], ['Mortier prêt à l’emploi', 12]]],
    ['Dalle de terrasse', [['Coulage de dalle béton', 20], ['Ciment', 15], ['Déplacement', 1]]],
    ['Enduit de façade', [['Enduit de façade', 60], ['Mortier prêt à l’emploi', 20], ['Main-d’œuvre', 4]]]],
  menuisier: [['Parquet chêne massif du séjour', [['Pose de parquet', 25], ['Parquet chêne massif', 25], ['Déplacement', 1]]],
    ['Remplacement de trois portes intérieures', [['Pose de porte intérieure', 3], ['Bloc-porte intérieur bois', 3], ['Déplacement', 1]]],
    ['Placard sur mesure dans l’entrée', [['Fabrication et pose de placard sur mesure', 2], ['Panneau contreplaqué 18 mm', 6], ['Main-d’œuvre', 3]]]],
  carreleur: [['Carrelage de la cuisine', [['Dépose d’ancien carrelage', 15], ['Pose de carrelage au sol', 15], ['Carrelage grès cérame', 16]]],
    ['Faïence de la salle de bain', [['Pose de faïence murale', 12], ['Faïence murale', 13], ['Mortier-colle', 3]]],
    ['Ragréage et carrelage du couloir', [['Ragréage du sol', 10], ['Pose de carrelage au sol', 10], ['Carrelage grès cérame', 11]]]],
  chauffagiste: [['Remplacement de la chaudière', [['Remplacement de chaudière', 1], ['Chaudière gaz à condensation', 1], ['Déplacement', 1]]],
    ['Ajout de deux radiateurs', [['Pose de radiateur', 2], ['Radiateur acier', 2], ['Tube cuivre Ø 16', 8]]],
    ['Entretien et désembouage', [['Entretien de chaudière', 1], ['Désembouage du circuit', 1], ['Déplacement', 1]]]],
  couvreur: [['Réfection du pan de toiture nord', [['Réfection de toiture en tuiles', 40], ['Tuile terre cuite', 42], ['Écran sous-toiture', 40]]],
    ['Tuiles cassées après la tempête', [['Remplacement de tuiles cassées', 1], ['Tuile terre cuite', 2], ['Déplacement', 1]]],
    ['Gouttières de la maison', [['Pose de gouttière', 24], ['Main-d’œuvre', 2], ['Déplacement', 1]]]],
}

const cleMetier = (m) => String(m || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim()

// Main-d'œuvre et déplacement : prix donnés par l'artisan au questionnaire (pas des exemples).
function communes(entreprise, mois, indiceMetier) {
  return [
    { nom: 'Main-d’œuvre', detail: 'À l’heure', prix: Number(entreprise.tauxHoraire) || 0, type: 'prestation', indice: indiceMetier, prixDepuis: mois },
    { nom: 'Déplacement', detail: 'Forfait', prix: Number(entreprise.deplacement) || 0, type: 'prestation', indice: indiceMetier, prixDepuis: mois },
  ]
}

// Catalogue de l'entreprise : métiers de la liste (fusionnés, sans doublon) + éléments proposés par l'IA
// pour un métier « Autre » (sans prix : à saisir).
export function catalogueEntreprise(entreprise, elementsIA = [], mois = moisParis()) {
  const metiers = entreprise.metiers || []
  const connus = metiers.map(cleMetier).filter((m) => CATALOGUES[m])
  const indiceMetier = indiceDuMetier(metiers.find((m) => indiceDuMetier(m))) || 'BT01'
  const liste = [...communes(entreprise, mois, indiceMetier)]
  const vus = new Set(liste.map((p) => p.nom.toLowerCase()))
  for (const m of connus) {
    for (const p of CATALOGUES[m]) {
      if (vus.has(p.nom.toLowerCase())) continue
      vus.add(p.nom.toLowerCase())
      liste.push({ ...p, prixDepuis: DATE_EXEMPLES, exemple: true })
    }
  }
  for (const e of elementsIA) {
    if (vus.has(e.nom.toLowerCase())) continue
    vus.add(e.nom.toLowerCase())
    liste.push({ ...e, prix: null, proposeParIA: true })
  }
  return liste.map((p, i) => ({ id: 'p' + (i + 1), ...p }))
}

// Devis et factures d'exemple du premier métier de la liste (aucun pour un métier « Autre »).
export function exemplesEntreprise(entreprise, catalogue) {
  const m = (entreprise.metiers || []).map(cleMetier).find((x) => EXEMPLES[x])
  if (!m) return { devis: [], factures: [] }
  const ligne = ([nom, qte]) => {
    const p = catalogue.find((x) => x.nom === nom)
    return { label: nom, qte, prix: p && p.prix !== null ? p.prix : 0 }
  }
  const tvaPart = 10 // exemples : travaux chez des particuliers, logement de plus de 2 ans
  const [a, b, c] = EXEMPLES[m]
  const devis = [
    { id: 'd3', numero: '003', clientId: 'c5', date: '2026-11-25', statut: 'pret', tva: tvaPart, objet: a[0], lignes: a[1].map(ligne) },
    { id: 'd2', numero: '002', clientId: 'c3', date: '2026-11-18', statut: 'attente', tva: 20, objet: b[0], lignes: b[1].map(ligne) },
    { id: 'd1', numero: '001', clientId: 'c1', date: '2026-11-10', statut: 'signe', tva: tvaPart, objet: c[0], lignes: c[1].map(ligne) },
  ]
  const factures = [
    { id: 'f2', numero: '002', clientId: 'c2', date: '2026-11-12', statut: 'attente', tva: tvaPart, objet: b[0], lignes: b[1].map(ligne) },
    { id: 'f1', numero: '001', clientId: 'c4', date: '2026-10-28', statut: 'payee', tva: tvaPart, objet: c[0], lignes: c[1].map(ligne) },
  ]
  return { devis, factures }
}
