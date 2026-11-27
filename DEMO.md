# Démonstration EasyFact — 5 minutes (données fictives)

## Avant de commencer (5 min avant)
1. `npm run dev`, ouvrir http://localhost:5173 dans **Chrome**.
2. `.env` : `IA_ACTIVE=true` + clé OVH (démo locale seulement), `VITE_CHATBOT_SIMULE=true` si l'on montre l'assistant.
3. Tester une fois l'IA : Nouveau devis > « changer le chauffe-eau » > Continuer. Si échec → plan de secours.
4. Ouvrir `#/demo`, puis menu > **Réinitialiser la démo**.

## Déroulé (5 min)
| Temps | Écran | À faire | À dire |
|---|---|---|---|
| 0:00 | Accueil public | montrer le titre, cliquer **Accès démo** | « Un artisan finit son devis sur le chantier, en 3 étapes. » |
| 0:30 | Tableau de bord | montrer devis à envoyer, factures impayées | « Tout est fictif : aucune vraie donnée. » |
| 1:00 | Devis > + Nouveau devis | choisir **M. Martin** | « Le client est choisi à part : son nom n'est pas envoyé à l'IA. » |
| 1:20 | Travaux | taper : `Changer le chauffe-eau 200 L, 1h30 de main-d'oeuvre et le déplacement` → Continuer | « L'IA lit la demande et la découpe en prestations de son catalogue. » |
| 2:00 | Vérification | montrer : prix repris du catalogue, quantité 1,5 h, TVA « À choisir » | « L'IA ne fixe ni prix ni TVA. Les totaux sont calculés par le code, au centime. » |
| 2:40 | Vérification | choisir **10 %**, cocher, **Valider** (double-cliquer exprès) | « Double clic : un seul devis, un seul numéro. » |
| 3:10 | Devis validé | **Télécharger en PDF** (mention DÉMONSTRATION) | « Le PDF vient de la version validée. » |
| 3:40 | Devis validé | **Nouvelle version** → changer une quantité → valider | « Un devis validé est figé : on crée une version 2, la version 1 reste consultable. » |
| 4:20 | Assistant (si activé) | « Quel est mon prix pour la recherche de fuite ? » puis « Retrouve le dernier devis de M. Martin » | « Assistant simulé pour la démo : il répond à partir des vraies données du compte. » |
| 4:50 | Aide | ouvrir **Aide** | « Une page d'aide courte, pour démarrer sans formation. » |

## Plan de secours si l'IA tombe
- Le site passe tout seul en **saisie manuelle** avec un message clair : c'est une fonctionnalité, montrez-la.
- À l'étape Vérification : **Ajouter une prestation de mon catalogue** → « Remplacement d'un chauffe-eau »,
  puis « Main-d'œuvre » (quantité 1,5), puis « Déplacement ». La suite de la démo est identique.
- Dire : « Sans IA, l'artisan ajoute ses lignes en 3 clics depuis son catalogue. »

## Vidéo de présentation (à enregistrer par l'équipe)
Enregistrement : **Windows + Alt + R** (Xbox Game Bar) ou OBS. Fenêtre Chrome en 1280 × 720, zoom 110 %.
Suivre le même déroulé ; durée cible 2 à 3 min :
1. (0:00–0:15) Accueil, phrase d'accroche, **Accès démo**.
2. (0:15–1:15) Nouveau devis avec IA : client, phrase, lignes proposées, TVA choisie, validation.
3. (1:15–1:45) PDF avec la mention DÉMONSTRATION.
4. (1:45–2:15) Nouvelle version d'un devis validé.
5. (2:15–2:45) Assistant simulé (2 questions) et page Aide.
6. (2:45–3:00) Conclusion : « Calculs par le code, TVA choisie par l'artisan, IA qui propose sans décider. »
Texte à l'écran au début : « Démonstration — données fictives ».
