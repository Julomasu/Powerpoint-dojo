# PowerPoint Dojo : notes pour Claude

Add-in PowerPoint (Office.js) d'entraînement, en français, jumeau de l'Excel Dojo (Julomasu/excel-dojo). Le propriétaire (Jules, stagiaire M&A, débutant en code) travaille sur Mac ET sur un Windows sans droits administrateur : il demande les changements à Claude, il n'installe rien en local. Dépôt **public** : jamais de secret (jamais de clé Supabase `service_role`).

## Fonctionnement
- Site statique Vite + JS vanille (`src/`), affiché comme volet d'add-in dans PowerPoint, ou comme page web (« mode fichier » : téléchargement d'un .pptx, dépôt pour correction).
- Production prévue : projet Vercel `powerpoint-dojo` (**à connecter par Jules**). **Un push sur `main` redéploiera la production.** Ne fusionner que sur demande explicite.
- `/install` génère le `manifest.xml` (`src/manifest.js`). **Ne jamais changer** `HOSTED_ID` ni l'adresse du site une fois publiés.
- Branche de travail lot 1 : `claude/powerpoint-dojo-lot1`.

## Architecture (idée centrale)
Un **modèle de présentation** (`src/deck.js`, unités en points, 960×540 = 16:9) et des **opérations JSON** (`slide`, `add`, `set`, `del`, `delSlide`, `dupSlide`, `moveSlide`, `layout`, `bg`, `size`, `group`, `ungroup`, `z`, `notes`, `hide`) :
- `setup` (départ) et `sol` (solution) d'un exercice sont des listes d'opérations ;
- jouées en JS pur par `npm run verify` (`runOps`), dans le vrai PowerPoint par `src/ppt.js` (`applyOps`, `loadSetup`), écrites en .pptx par `src/pptx.js` ;
- le correcteur (`src/grader.js`, contrôles de `src/answers.js`) ne voit que le modèle, produit par `readDeck()` (PowerPoint) ou `readPptx()` (mode fichier).
- **Règle d'or** : une propriété illisible dans une version = `undefined` dans le modèle = **ignorée** (jamais bloquante). Un contrôle entièrement ignoré s'affiche « non vérifiable ».
- Contrôles : `shapeA`, `countA`, `slidesA`, `layoutA`, `bgA`, `sizeA`, `alignA`, `distributeA`, `ruleA`, `noOverlapA`, `insideA`, `contrastA`, `confirmA`. Sélecteurs de forme : `"Nom"`, `{name, ph, text, kind, group, idx, nth}`.
- Fichiers : `xml.js` (mini lecteur XML), `pptx.js`, `ppt.js`, `caps.js` (jeux PowerPointApi 1.1→1.10, `requirementsOf`), `profile.js`, `diagnostic.js`, `validate.js`, `skills.js` (GROUPS/SKILLS), `skilllessons.js`, `keys.js`, `preview.js` (aperçu SVG), `progress.js` + `cloud.js` + `config.js` (comme l'Excel Dojo), `main.js` (UI), `tracks/*.js` (exercices).

## Ce que l'API PowerPoint permet (d'après learn.microsoft.com, PowerPointApi 1.1→1.10)
**Lu et écrit pour de vrai** : diapositives (ajout, suppression, déplacement 1.8, mise en page par `applyLayout` 1.8, lecture `layout`), formes (nom, position, taille, remplissage, contour, texte, police, alignements, type) 1.4 ; groupes, ordre Z, tableaux (valeurs) 1.8 ; arrière-plan, taille des diapositives, texte alternatif, rotation, couleurs du thème 1.10 ; liens 1.5/1.10 ; export d'une diapositive en base64 (`exportAsBase64`, 1.8).
**Non exposé** (à confirmer par l'élève via `confirmA`, ou à lire dans le XML d'`exportAsBase64` avec `xml.js` + JSZip — prévu aux lots suivants) : animations, transitions, SmartArt (type lisible seulement), médias, morph, mode diaporama, notes, diapositives masquées, géométrie précise d'une forme (rectangle/ellipse : `kind:"shape"` lu, les sélecteurs `kind` sont donc permissifs), sections.
**Dépend de la version** : tout ce qui est marqué 1.8/1.10 ; `requirementsOf` déduit la version d'un exercice, `compatible()` masque les exercices non corrigeables.
**⚠ Rien n'a pu être testé dans un vrai PowerPoint** (pas disponible ici) : `ppt.js` (lecture/écriture Office.js), la détection de mise en page par type de `SlideLayout`, la balise `PPTDOJO`, et l'ouverture des .pptx générés dans PowerPoint (testé seulement avec LibreOffice). **Jules doit lancer Moi → Diagnostic de ton PowerPoint puis « Contrôle qualité »** sur Mac et Windows, et rapporter les lignes en échec.
- Sécurité : le Dojo **remplace tout le contenu de la présentation ouverte** à chaque exercice. Une présentation non marquée et non vide déclenche une demande de confirmation. Le Diagnostic, lui, n'ajoute que des diapositives temporaires.

## Écrire un exercice
`mk({ id, skill, level, xp, title, story, setup:[ops], answers:[contrôles], sol:[ops], steps:[pistes], hint })` dans `src/tracks/*.js`, puis l'ajouter à `src/exercises.js`. Valeurs attendues **calculées en JS**. Ne jamais renommer un `id` publié. `steps` = Piste (−10 %), `hint` = Indice (−30 %), Solution = 0 XP (écrit la solution dans la présentation). Utiliser `{{Windows|Mac}}` pour les raccourcis (`K` dans `keys.js`). Chaque exercice doit : ne pas être réussi au départ, être réussi après `sol`, survivre à un aller-retour .pptx.

## Vérifier avant de pousser
`npm install`, `npm run verify` (départ ≠ réussi, solution réussie, aller-retour .pptx, ids uniques), `npm run build`. Aperçu local : `DOJO_HTTP=1 npm run dev`. `npm run icons` / `node scripts/make-manifest.mjs` (manifest de test local).

## Plan par lots
1. ✅ Squelette, manifest, install, diagnostic, chapitre « Les bases » (31 exercices), mode fichier, progression locale, compte (config vide).
2. Formation complète : test pour sauter, test de niveau (≈24 questions), écran d'accueil déjà là.
3. Ruban onglet par onglet (≈150 exercices) ; lecture XML via `exportAsBase64` pour transitions/animations.
4. Certification (générateurs à graine, 5 niveaux, 7 domaines, /100) + `verify` sur plusieurs tirages.
5. Comptes : activer Supabase (`supabase/schema.sql`, table `pptdojo_progress`) — **demander à Jules l'URL et la clé publishable**.
6. Cas de métier M&A, « sans Microsoft 365 » (`caps.js` + badges), volume (500+).

## Contraintes
Interface et messages en français, ton direct. Pas de dépendance sans raison (seule dépendance : jszip). Un add-in ne lit pas tout : toujours prévoir `confirmA`.
