// Données fictives de démonstration (aucune vraie personne ni entreprise).
// Chaque devis et chaque facture a ses lignes : les totaux sont recalculés à partir d'elles.

const L = (label, qte, prix) => ({ label, qte, prix })

export const seed = {
  user: null, // { prenom, email } une fois connecté
  onboarded: false,
  entreprise: {
    nom: 'Dumas Plomberie',
    siret: '123 456 789 00012',
    adresse: '12 rue des Artisans, 20200 Bastia',
    telephone: '06 12 34 56 78',
    assureur: 'Assureur Exemple',
    contrat: 'DEC-000123',
    metiers: ['Plombier'],
    equipe: 'Seul',
    devisParMois: '5 à 15',
    methode: ['Avec Word ou Excel'],
    tva: 'Oui',
    clients: ['Particuliers', 'Professionnels'],
    acompte: '30 %',
    delai: '15 jours',
    tauxHoraire: 45,
    deplacement: 30,
    anciensDevis: '',
    style: 'Oui, gardez mon style',
  },
  clients: [
    { id: 'c1', nom: 'M. Martin', type: 'Particulier', adresse: '4 avenue des Oliviers, 20200 Bastia', email: 'martin@exemple.fr' },
    { id: 'c2', nom: 'Mme Leroy', type: 'Particulier', adresse: '18 rue du Port, 20600 Furiani', email: 'leroy@exemple.fr' },
    { id: 'c3', nom: 'SCI Les Pins', type: 'Pro', adresse: '2 chemin des Pins, 20290 Borgo', email: 'contact@sci-lespins.exemple.fr' },
    { id: 'c4', nom: 'M. Durand', type: 'Particulier', adresse: '7 boulevard Paoli, 20200 Bastia', email: 'durand@exemple.fr' },
    { id: 'c5', nom: 'Mme Petit', type: 'Particulier', adresse: '25 rue Saint-Joseph, 20200 Bastia', email: 'petit@exemple.fr' },
    { id: 'c6', nom: 'SARL Roux', type: 'Pro', adresse: 'Zone artisanale, lot 9, 20600 Furiani', email: 'compta@roux.exemple.fr' },
  ],
  prestations: [
    { id: 'p1', nom: 'Main-d’œuvre', detail: 'À l’heure', prix: 45 },
    { id: 'p2', nom: 'Déplacement', detail: 'Forfait', prix: 30 },
    { id: 'p3', nom: 'Pose d’un mitigeur', detail: 'À l’unité, hors fourniture', prix: 80 },
    { id: 'p4', nom: 'Remplacement d’un chauffe-eau', detail: 'Forfait de pose', prix: 280 },
    { id: 'p5', nom: 'Recherche de fuite', detail: 'Forfait', prix: 120 },
  ],
  devis: [
    {
      id: 'd25', numero: '025', clientId: 'c5', date: '2026-11-25', statut: 'pret', tva: 10,
      objet: 'Remplacement de deux mitigeurs (cuisine et salle de bain)',
      lignes: [L('Pose d’un mitigeur', 2, 80), L('Mitigeurs thermostatiques (fourniture)', 2, 80), L('Déplacement', 1, 30)],
    },
    {
      id: 'd24', numero: '024', clientId: 'c1', date: '2026-11-24', statut: 'pret', tva: 10,
      objet: 'Remplacement du chauffe-eau électrique',
      lignes: [L('Remplacement d’un chauffe-eau (pose)', 1, 280), L('Chauffe-eau 200 L (fourniture)', 1, 362.73), L('Déplacement', 1, 30)],
    },
    {
      id: 'd23', numero: '023', clientId: 'c3', date: '2026-11-18', statut: 'signe', tva: 20,
      objet: 'Rénovation de la salle de bain du logement n° 3',
      lignes: [L('Rénovation salle de bain (forfait)', 1, 1491.67), L('Fourniture sanitaires', 1, 300)],
    },
    {
      id: 'd22', numero: '022', clientId: 'c6', date: '2026-11-14', statut: 'attente', tva: 20,
      objet: 'Remplacement de la colonne d’eau de l’atelier',
      lignes: [L('Remplacement colonne d’eau (forfait)', 1, 1100), L('Main-d’œuvre', 8, 45), L('Déplacement', 3, 30)],
    },
    {
      id: 'd21', numero: '021', clientId: 'c6', date: '2026-11-10', statut: 'attente', tva: 20,
      objet: 'Fuite sur canalisation des sanitaires',
      lignes: [L('Recherche de fuite', 1, 120), L('Réparation canalisation (forfait)', 1, 223.33), L('Main-d’œuvre', 2, 45)],
    },
    {
      id: 'd20', numero: '020', clientId: 'c5', date: '2026-11-05', statut: 'attente', tva: 10,
      objet: 'Débouchage de l’évier de la cuisine',
      lignes: [L('Débouchage évier (forfait)', 1, 130), L('Main-d’œuvre', 2, 45), L('Déplacement', 1, 30)],
    },
  ],
  factures: [
    {
      id: 'f11', numero: '011', clientId: 'c2', date: '2026-11-12', statut: 'attente', tva: 10,
      objet: 'Remplacement des WC par un WC suspendu',
      lignes: [L('Remplacement WC suspendu (pose)', 1, 450), L('WC suspendu avec bâti (fourniture)', 1, 520.91), L('Main-d’œuvre', 2, 45), L('Déplacement', 1, 30)],
    },
    {
      id: 'f10', numero: '010', clientId: 'c4', date: '2026-11-08', statut: 'attente', tva: 10,
      objet: 'Réparation d’une fuite sous l’évier',
      lignes: [L('Recherche de fuite', 1, 120), L('Remplacement joints et raccords', 1, 159.09), L('Déplacement', 1, 30)],
    },
    {
      id: 'f09', numero: '009', clientId: 'c1', date: '2026-10-28', statut: 'payee', tva: 10,
      objet: 'Pose de deux mitigeurs thermostatiques',
      lignes: [L('Pose d’un mitigeur', 2, 80), L('Mitigeurs thermostatiques (fourniture)', 1, 369.09), L('Déplacement', 1, 30)],
    },
  ],
}

export const statutDevis = {
  pret: { label: 'Prêt à envoyer', tone: 'mint' },
  attente: { label: 'En attente de réponse', tone: 'yellow' },
  signe: { label: 'Signé', tone: 'grey' },
  facture: { label: 'Facturé', tone: 'grey' },
}

export const statutFacture = {
  attente: { label: 'En attente de paiement', tone: 'yellow' },
  payee: { label: 'Payée', tone: 'grey' },
}
