# Règles du projet EasyFact

- Référence de travail : `SUIVI.md` (état, décisions, prochaine action). Le tenir à jour à chaque lot.
- Données fictives uniquement. Aucun secret dans le dépôt ni dans les journaux (pas de texte saisi, pas de clé).
- Pas de serveur ni de base : l'état est dans le navigateur (`localStorage`). Seule exception : la fonction `api/extraire.js`.
- Les montants sont calculés par le code (`src/devis/calcul.js`, en centimes). Jamais par l'IA.
- TVA : aucun taux par défaut, jamais choisi par l'IA.
- Un devis validé est figé ; une modification crée une nouvelle version (`src/devis/cycle.js`).
- Toute nouvelle fonction risquée passe derrière un interrupteur désactivé par défaut (variables `IA_ACTIVE`, `VITE_DICTEE_ACTIVE`, `VITE_CHATBOT_SIMULE`).
- Branche de travail ; un commit par lot testé ; ne rien pousser ni déployer sans accord. Production : uniquement après « GO PROD ».
- Tests : `npm test` (sans appel réseau) ; `npm run test:ia` appelle le vrai modèle (payant, budget total 5 €).
