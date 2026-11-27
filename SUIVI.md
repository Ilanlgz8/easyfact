# SUIVI EasyFact

Dernière mise à jour : 27/11/2026. Branche : `feat/ia-devis-plomberie` (PR Ilanlgz8/easyfact#1).

## Prochaine action
Voir la section « Lots » : premier lot non terminé.

## État par fonctionnalité
États : TESTÉ, CODÉ NON TESTÉ, PARTIEL, ABSENT, BLOQUÉ, NON VÉRIFIABLE.

| Fonctionnalité | État | Preuve / remarque |
|---|---|---|
| Comptes, authentification serveur, isolation | ABSENT | décision : pas de serveur pour la démo (voir décisions) |
| Base de données, sauvegarde, restauration | ABSENT | idem |
| Calculs HT / TVA / TTC | TESTÉ | `npm test` |
| TVA sans défaut, choix par l'artisan | TESTÉ | `npm test` + navigateur |
| Extraction IA | PARTIEL | voir lot 5 |
| Chatbot | ABSENT | lot 8 (simulé) |
| Double clic / numérotation | TESTÉ | clé d’idempotence, src/devis/cycle.js (valable pour un navigateur) |
| Versions et copie figée | TESTÉ | entreprise et client copiés à la validation ; anciens devis d’exemple sans copie |
| Dictée vocale | CODÉ NON TESTÉ (Chrome OK à la main) | derrière `VITE_DICTEE_ACTIVE`, désactivée par défaut |

## Lots
| Lot | Contenu | État |
|---|---|---|
| 0 | SUIVI, CLAUDE, README, interrupteur dictée | TESTÉ (commit 20e84de) |
| 1-2 | Tests de non-régression, double clic | TESTÉ : tests/cycle.test.js + triple clic en navigateur = 1 devis |
| 3 | Versions de devis figées | TESTÉ : v2 créée, v1 « remplacée » consultable, conflit affiché si on modifie une version remplacée |
| 4 | Centimes, « Autre taux » de TVA | à faire |
| 5 | Extraction IA conforme + 20 cas | à faire |
| 6 | Corrections d'expérience | à faire |
| 7 | Aide, guides, scénario de démo | à faire |
| 8 | Chatbot simulé | à faire |

## Décisions
| Date | Décision | Raison |
|---|---|---|
| 27/11/2026 | Rester sans serveur ni base pour la démo | démo en direct le jour même ; une base = nouveau service soumis à accord |
| 27/11/2026 | Corrections de l'état des lieux seulement, pas de refonte | réponse question 1 |
| 27/11/2026 | Dictée vocale derrière un interrupteur, désactivée par défaut | hors périmètre du prompt précédent ; audio envoyé à Google sur Chrome |
| 27/11/2026 | TVA : ajout d'un « Autre taux » saisi par l'artisan, aucune règle corse codée | l'artisan choisit son taux (réponse question 5) |
| 27/11/2026 | IA valable pour tous les métiers (prompt générique), tests surtout en plomberie | demande explicite ; **écart** avec le prompt qui fixe la plomberie comme référence |
| 27/11/2026 | Clé en main : aide courte seulement | réponse question 6 |
| 27/11/2026 | Chatbot simulé (sans IA), interrupteur dédié, interdit en production | pas de base pour la mémoire ; réponse question 7 |
| 27/11/2026 | Commit par lot, sans push | réponse question 9 |
| 27/11/2026 | Budget de test IA : 5 € au total malgré 200 € de crédits OVH | règle du prompt ; dépensé avant ce jour : ≈ 0 € |

## Questions ouvertes
- Moyen de support pour les artisans (adresse, formulaire) : à définir.
- Durée réelle de conservation des conversations du chatbot : à valider avant données réelles.
- Vidéo de présentation : script fourni dans `DEMO.md`, enregistrement par l'équipe.

## Dette
- Pas de serveur : quotas, droits, numérotation et verrous ne valent que pour un navigateur.
- `/api/extraire` sans authentification ni quota serveur : garder `IA_ACTIVE=false` en production.
- Dépendances : `npm audit` signale vite (élevée, serveur de dev) et react-router (modérée).

## Dépense IA
| Date | Appels | Coût estimé |
|---|---|---|
| 26-27/11/2026 | ≈ 50 refusés (401, non facturés) + 1 réussi | < 0,001 € |
