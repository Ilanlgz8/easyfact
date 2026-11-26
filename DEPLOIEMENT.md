# Mise en service de l'assistant IA (devis plomberie) — démonstration

Données fictives uniquement. L'IA est **désactivée par défaut** : sans réglage, le devis passe en saisie manuelle.

## Fonctionnement
- Le navigateur envoie la description et la liste des prestations (sans prix) à `/api/extraire` (fonction Vercel).
- La fonction appelle Mistral-Small-3.2-24B-Instruct-2506 sur OVH AI Endpoints, valide le JSON, réessaie une fois, sinon renvoie une erreur → saisie manuelle.
- Les prix viennent du catalogue, les totaux de `src/devis/calcul.js`. Une prestation hors catalogue apparaît sans prix, à compléter.
- La TVA n'est jamais préremplie : l'artisan la choisit et coche la validation.

## Variables d'environnement (Vercel > Settings > Environment Variables)
| Nom | Valeur | Rôle |
| --- | --- | --- |
| `IA_ACTIVE` | `true` pour activer, toute autre valeur = désactivé | Interrupteur |
| `OVH_AI_ENDPOINTS_ACCESS_TOKEN` | la clé OVH (jamais dans le dépôt) | Authentification |

## Activer / désactiver
- Activer : mettre `IA_ACTIVE=true` puis redéployer (Deployments > Redeploy).
- Désactiver : mettre `IA_ACTIVE=false` (ou supprimer la variable) puis redéployer. Le site reste utilisable en saisie manuelle.
- Couper en urgence : supprimer ou révoquer la clé côté OVH : la fonction échoue proprement, saisie manuelle.

## Retour en arrière
- Vercel : Deployments > déploiement précédent > « Promote to Production » (ou « Instant Rollback »).
- Code : `git revert <commit>` sur la branche, ou revenir à `main`, qui n'est pas modifiée.

## Tests
```
npm test          # calculs + validation JSON + cas 16, 17, 20, sans appel au modèle
npm run test:ia   # les 20 cas contre le vrai modèle (clé dans l'environnement, coût estimé affiché)
```
