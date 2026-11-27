# EasyFact — démonstration

Devis et factures pour artisans, **avec des données fictives**. Projet de démonstration : à ne pas utiliser avec de vraies données.

- Pas de serveur ni de base : les données sont stockées dans le navigateur (`localStorage`).
- Une seule fonction serveur : `api/extraire.js`, qui appelle l'IA (Mistral Small 3.2 sur OVH AI Endpoints). Désactivée par défaut.
- Suivi du projet : [SUIVI.md](SUIVI.md). Exploitation : [EXPLOITATION.md](EXPLOITATION.md). Démo : [DEMO.md](DEMO.md). Guide artisan : [GUIDE-ARTISAN.md](GUIDE-ARTISAN.md).

## Installer et lancer

```bash
npm install
cp .env.example .env     # puis compléter .env (jamais commité)
npm run dev              # http://localhost:5173
```

Accès direct au compte de démo : http://localhost:5173/#/demo

## Interrupteurs (fichier .env ou variables Vercel)

| Variable | Effet | Défaut |
|---|---|---|
| `IA_ACTIVE` | `true` : l'IA prépare les lignes du devis | désactivé |
| `OVH_AI_ENDPOINTS_ACCESS_TOKEN` | clé OVH, côté serveur uniquement | vide |
| `VITE_DICTEE_ACTIVE` | `true` : bouton « Dicter » (Chrome, Edge) | désactivé |
| `VITE_CHATBOT_SIMULE` | `true` : assistant simulé, sans IA, hors production | désactivé |
| `MARCHE_ACTIF` | `true` : prix du marché pendant le devis (index INSEE du bâtiment, gratuit) | désactivé |

Après un changement du `.env`, relancer `npm run dev`.

## Tests

```bash
npm test          # calculs, cycle des devis, extraction, masquage — sans réseau
npm run test:ia   # 20 cas contre le vrai modèle (payant, coût affiché)
npm run build     # version à déployer dans dist/
```

## Organisation du code

```
api/extraire.js      fonction serveur : appel au modèle, interrupteur IA_ACTIVE
src/devis/           logique testée sans navigateur : calculs, cycle des devis, extraction, masquage
src/store.jsx        état de l'application (localStorage)
src/pages/           un écran par page
src/components/      éléments partagés (menu, lignes, dictée, assistant)
tests/               tests automatiques et les 20 cas IA
```
