# EasyFact — interface de test

Projet MIRA (24 h). Site de devis et factures pour artisans, **avec des données fictives**.
Il n'y a pas de serveur : tout est stocké dans le navigateur (localStorage).

## Lancer le projet

```bash
npm install
npm run dev
```

Puis ouvrir l'adresse affichée (en général http://localhost:5173).

Pour générer la version à mettre en ligne :

```bash
npm run build      # crée le dossier dist/
npm run preview    # teste dist/ en local
```

Le dossier `dist/` peut être déposé tel quel sur n'importe quel hébergeur de fichiers statiques.

## Parcours de démo

1. Accueil → « Créer mon premier devis » → Inscription (n'importe quel e-mail, mot de passe de 8 caractères).
2. Questionnaire en 3 parties (maquette de Nawel) → espace connecté.
3. « Nouveau devis » : client → décrivez les travaux (ex. `remplacement chauffe-eau 200 L, 2 h`) → l'IA prépare les lignes → vérification → envoi.
4. Accueil : « Créer la facture » sur le devis signé de SCI Les Pins → acompte de 30 % déduit.

« Réinitialiser la démo » (en bas du menu) remet les données d'exemple.
Connexion directe : onglet Connexion, n'importe quel e-mail et mot de passe.

## Ce qui est simulé

| Élément | Dans la démo | Dans le vrai produit |
| --- | --- | --- |
| IA du devis | `src/ia.js` repère des mots-clés (chauffe-eau, fuite, mitigeur, heures) et utilise le catalogue | Modèle sur OVH AI Endpoints + outil « Créer un devis » via MCP |
| Envoi e-mail, relances | Message de confirmation, rien n'est envoyé | Service d'e-mail |
| Comptes, données | localStorage du navigateur | Base de données hébergée en France |

## Organisation du code

```
src/
  data.js            données fictives (clients, prestations, devis, factures)
  store.jsx          état global, calculs (HT, TVA, TTC, acompte), sauvegarde
  ia.js              IA simulée
  components/        logo, menu, barre d'étapes, éditeur de lignes
  pages/             une page par écran de la maquette
```
