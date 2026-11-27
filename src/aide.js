// Contenu de l'aide : source unique pour la page Aide et l'assistant.
export const SECTIONS_AIDE = [
  { id: 'devis', titre: 'Faire un devis', texte: [
    'Menu « Devis » puis « + Nouveau devis ».',
    '1. Choisissez le client (ou « + Nouveau client »).',
    '2. Décrivez les travaux en quelques mots. Si l’assistant IA est activé, il prépare les lignes à partir de votre catalogue. Sinon, ajoutez vos lignes vous-même.',
    '3. Vérifiez chaque ligne : quantité, prix, et choisissez le taux de TVA. Cochez la case de vérification, puis « Valider le devis ».',
  ] },
  { id: 'tva', titre: 'Choisir la TVA', texte: [
    'EasyFact ne choisit jamais la TVA à votre place. Choisissez 20 %, 10 %, 5,5 %, 0 % (franchise) ou « Autre taux… » pour saisir le vôtre.',
    'En cas de doute sur le taux applicable, demandez à votre comptable : EasyFact ne donne pas de conseil fiscal.',
  ] },
  { id: 'pdf', titre: 'Obtenir le PDF', texte: [
    'Ouvrez le devis validé, puis « Télécharger en PDF ». La fenêtre d’impression s’ouvre : choisissez « Enregistrer au format PDF ».',
    'Le bouton reste grisé tant que des prix ou la TVA manquent.',
  ] },
  { id: 'modifier', titre: 'Modifier un devis validé', texte: [
    'Un devis validé ne se modifie plus. Ouvrez-le et cliquez sur « Nouvelle version » : vous repartez de ses lignes.',
    'Quand vous validez, l’ancienne version est marquée « remplacée » et reste consultable. Le numéro ne change pas.',
  ] },
  { id: 'catalogue', titre: 'Mes prestations et mes prix', texte: [
    'Menu « Prestations » : ajoutez ou modifiez vos prestations et vos prix. Les devis déjà validés ne changent pas.',
    'Dans un devis, « Ajouter une prestation de mon catalogue » reprend le prix enregistré.',
  ] },
  { id: 'ia', titre: 'Si l’IA ne répond pas', texte: [
    'Vous passez automatiquement en saisie manuelle : votre texte est conservé, ajoutez vos lignes depuis le catalogue.',
    'L’IA ne fixe jamais de prix ni de TVA, et elle peut se tromper : relisez toujours les lignes proposées.',
  ] },
  { id: 'donnees', titre: 'Données et démonstration', texte: [
    'Ceci est une démonstration : comptes, clients, devis et montants sont fictifs. N’y saisissez pas de vraies données.',
    'Les données restent dans ce navigateur. « Réinitialiser la démo » (menu, en bas) remet les données d’exemple.',
    'Si l’assistant IA est activé, la description des travaux est envoyée au service OVHcloud AI Endpoints, après remplacement des noms de vos clients, e-mails, téléphones et adresses repérés. Ce filtrage n’est pas une anonymisation complète. Le nom du client choisi et vos prix ne sont pas envoyés.',
    'Prix du marché (si activé) : EasyFact lit les index officiels du bâtiment publiés chaque mois par l’INSEE. Les matériaux suivent l’indice de prix de chaque matériau (bois, carrelage, câbles…). Seuls les codes des indices sont demandés à l’INSEE : rien sur vous ni vos clients. Votre métier, s’il n’est pas dans la liste, est envoyé à OVHcloud pour choisir l’index le plus proche et proposer un catalogue de départ (sans prix).',
    'La dictée vocale (si activée) envoie l’enregistrement au service de transcription OVHcloud (Whisper, Europe). EasyFact ne conserve ni l’audio ni le texte transcrit, en dehors du champ où il s’écrit.',
  ] },
  { id: 'support', titre: 'Aide et contact', texte: [
    'Démonstration : le moyen de contact du support n’est pas encore défini. Adressez-vous à l’équipe EasyFact qui vous présente le site.',
  ] },
]

