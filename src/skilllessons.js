// Mini-leçons d'une minute, une par compétence : l'idée, le chemin dans le ruban, un exemple, les pièges. Clé = id de compétence.
// {{Windows|Mac}} = raccourci selon le système (voir keys.js).
export const LESSONS = {
  slides: {
    idea: "Une présentation est une suite de diapositives. Le volet de miniatures à gauche est ton plan de travail : on y ajoute, duplique, réordonne et supprime.",
    path: ["Nouvelle diapositive : Accueil → Nouvelle diapositive ({{Ctrl+M|⌘⇧N}})", "Dupliquer : clic droit sur la miniature → Dupliquer la diapositive ({{Ctrl+D|⌘D}} si elle est sélectionnée)", "Réordonner : glisser-déposer la miniature", "Supprimer : sélectionner la miniature → Suppr"],
    example: "Un deck de banque d'affaires : on duplique une diapositive « modèle » (même mise en page) plutôt que de tout refaire.",
    pitfalls: ["Cliquer sur la flèche du bouton Nouvelle diapositive ouvre le choix de mise en page : c'est voulu, mais le clic sur l'icône ajoute tout de suite.", "Pour sélectionner plusieurs miniatures : Maj + clic (suite) ou {{Ctrl|⌘}} + clic (une par une)."],
  },
  layouts: {
    idea: "La mise en page (disposition) décide des zones réservées : titre, contenu, deux colonnes… Tu écris dans ces zones plutôt que de dessiner des zones de texte : le texte est alors repris dans le plan et reste cohérent d'une diapositive à l'autre.",
    path: ["Accueil → Disposition", "Choisis « Titre et contenu » pour une liste à puces, « Deux contenus » pour comparer", "Accueil → Rétablir : remet les zones à leur place d'origine"],
    example: "Une diapositive « Nos priorités » : titre + trois puces dans la zone de contenu.",
    pitfalls: ["Changer de mise en page ne supprime pas ton texte : il glisse dans la nouvelle zone.", "Tape les puces avec Entrée, jamais avec des tirets saisis à la main."],
  },
  textbox: {
    idea: "Une zone de texte te laisse écrire n'importe où sur la diapositive (source en bas, légende, annotation). Elle est indépendante des mises en page.",
    path: ["Insertion → Zone de texte", "Glisse pour dessiner la zone, puis écris", "Format de la forme pour la taille et la position"],
    example: "« Source : rapport annuel 2025 » en petit, en bas à gauche, sous un graphique.",
    pitfalls: ["Un simple clic crée une zone qui s'agrandit avec le texte ; un glisser fixe la largeur.", "Pour déplacer la zone, saisis son bord (pas l'intérieur) — sinon tu places le curseur."],
  },
  shapes: {
    idea: "Les formes (rectangles, cercles, flèches) servent à bâtir des schémas. Chaque forme peut aussi contenir du texte.",
    path: ["Insertion → Formes", "Maj + glisser : forme proportionnée (carré, cercle)", "{{Ctrl+D|⌘D}} : dupliquer la forme sélectionnée"],
    example: "Trois rectangles « Étape » alignés pour un processus.",
    pitfalls: ["Une forme sélectionnée par son intérieur et son bord n'a pas le même effet : clique sur le bord pour agir sur la forme entière.", "Le volet Sélection ({{Alt+F10|⌥F10}}) liste toutes les formes, même celles qui sont cachées ou superposées."],
  },
  colors: {
    idea: "Le remplissage colore l'intérieur, le contour dessine le trait. Pour une couleur de marque précise, on saisit son code hexadécimal (RRGGBB).",
    path: ["Format de la forme → Remplissage de forme → Autres couleurs de remplissage → Personnalisé → Hex", "Contour de forme → couleur, épaisseur, tirets", "« Sans remplissage » / « Sans contour » pour les supprimer"],
    example: "Bleu marine du client : 1F3864 ; rouge d'alerte : C00000.",
    pitfalls: ["Saisis le code sans #.", "Une forme sans remplissage ni contour devient invisible (mais cliquable via le volet Sélection)."],
  },
  font: {
    idea: "La police se règle sur le texte sélectionné — ou sur toute la forme si tu sélectionnes la forme par son bord.",
    path: ["Accueil → groupe Police : nom, taille, gras, italique, souligné, couleur", "{{Ctrl+G|⌘B}} gras · {{Ctrl+I|⌘I}} italique · {{Ctrl+U|⌘U}} souligné", "{{Ctrl+Maj+>|⌘⇧>}} / {{Ctrl+Maj+<|⌘⇧<}} : agrandir / réduire"],
    example: "Titre 40 pt gras, corps 20 pt : la hiérarchie se voit au premier coup d'œil.",
    pitfalls: ["Dans une présentation, vise 18 pt minimum pour le corps du texte.", "Limite-toi à deux polices : l'une pour les titres, l'autre pour le texte."],
  },
  paragraph: {
    idea: "L'alignement horizontal (gauche, centre, droite, justifié) et vertical (haut, milieu, bas) sont deux réglages distincts.",
    path: ["Accueil → groupe Paragraphe : Aligner à gauche / Centrer / Aligner à droite / Justifier", "Accueil → Aligner le texte → Haut / Milieu / Bas", "{{Ctrl+E|⌘E}} centrer · {{Ctrl+L|⌘L}} gauche · {{Ctrl+R|⌘R}} droite"],
    example: "Un chiffre clé : centré horizontalement ET verticalement dans son rectangle.",
    pitfalls: ["Le texte d'une forme est par défaut centré ; celui d'une zone de texte est à gauche."],
  },
  position: {
    idea: "Glisser à la souris est approximatif. Pour un résultat net, saisis des valeurs exactes de position, de taille et de rotation.",
    path: ["Clic droit → Format de la forme → Taille et propriétés", "Position horizontale / verticale : distance depuis le coin supérieur gauche de la diapositive", "Format de la forme → Faire pivoter pour tourner par paliers de 90°"],
    example: "Un logo à 40 pt du bord gauche et 30 pt du haut, toujours au même endroit sur chaque diapositive.",
    pitfalls: ["Une diapositive 16:9 fait 960 × 540 pt (33,87 × 19,05 cm).", "Décoche « Verrouiller le rapport hauteur/largeur » pour changer une seule dimension."],
  },
  arrange: {
    idea: "Aligner, répartir et grouper donnent un rendu propre en deux clics, sans faire de la dentelle à la souris.",
    path: ["Format de la forme → Aligner (gauche, centre, haut, milieu…) — sélectionne d'abord au moins 2 formes", "Aligner → Répartir horizontalement / verticalement : espaces égaux", "Grouper : {{Ctrl+Maj+G|⌘⌥G}} · Dissocier : {{Ctrl+Maj+H|⌘⌥⇧G}}", "Avancer / Reculer / Premier plan / Arrière-plan : l'ordre d'empilement"],
    example: "Trois cartes : on les aligne à gauche puis on les répartit verticalement.",
    pitfalls: ["« Répartir » prend les deux formes extrêmes comme repères : place-les d'abord.", "Une forme cachée derrière une autre se retrouve avec le volet Sélection."],
  },
  setup: {
    idea: "Quelques réglages valent pour toute la présentation ou pour une diapositive : format, arrière-plan, accessibilité.",
    path: ["Création → Taille des diapositives (16:9, 4:3, personnalisée)", "Création → Format de l'arrière-plan (cette diapositive, ou « Appliquer partout »)", "Clic droit sur une forme → Modifier le texte de remplacement"],
    example: "Fond sombre sur la diapositive de fin, texte en blanc pour garder un bon contraste.",
    pitfalls: ["Après un changement de format, vérifie que rien ne déborde.", "Le texte de remplacement décrit l'information, pas la forme (« Organigramme en 3 filiales », pas « Rectangle »)."],
  },
};

const L = (idea, path, example, pitfalls) => ({ idea, path, example, pitfalls });
Object.assign(LESSONS, {
  clipboard: L("Copier, couper et coller déplacent des formes ou du texte ; le Pinceau et « Coller en conservant uniquement le texte » gèrent la mise en forme.", ["Copier {{Ctrl+C|⌘C}} · Couper {{Ctrl+X|⌘X}} · Coller {{Ctrl+V|⌘V}}", "Accueil → Reproduire la mise en forme (double-clic = plusieurs fois)", "Coller → icône « Conserver uniquement le texte »"], "Récupérer un chiffre d'un autre document sans importer sa police.", ["Coller par défaut garde la mise en forme de la source (selon le réglage) : vérifie l'icône Options de collage qui apparaît."]),
  slidesgrp: L("Le groupe Diapositives règle la mise en page de la diapositive courante, la remet d'aplomb (Rétablir) et organise en sections.", ["Accueil → Nouvelle diapositive ▾ (choix de la mise en page)", "Accueil → Disposition / Rétablir / Section"], "Un grand deck découpé en sections « Contexte », « Analyse », « Annexes ».", ["Rétablir remet aussi la taille de police : tu perds un réglage manuel."]),
  fontgrp: L("Le groupe Police règle chaque caractère ; la gomme efface tout, la casse change majuscules/minuscules sans retaper.", ["Accueil → Police, Taille, A↑ A↓, Effacer, Gras…", "Modifier la casse (Aa)", "Flèche du groupe → boîte Police (barré, exposant, espacement)"], "Un titre en majuscules et espacé pour un effet « signature ».", ["Les effets (ombre, barré, surbrillance) se confirment à la main : PowerPoint ne les expose pas."]),
  paragrp: L("Le paragraphe gère alignement, puces, numéros, interligne, retrait et colonnes.", ["Accueil → Paragraphe : Puces, Numérotation, Interligne", "{{Tab|Tab}} / {{Maj+Tab|⇧Tab}} : niveau de liste", "Colonnes, Orientation du texte"], "Une liste d'étapes numérotées avec interligne 1,5.", ["Les puces tapées à la main (« - ») ne sont pas de vraies puces : elles se décalent à la ligne."]),
  drawing: L("Dessin et Organiser : ordre d'empilement, alignement, répartition, groupement et volet Sélection.", ["Accueil → Organiser → Avancer / Reculer / Aligner / Grouper", "Volet Sélection : renommer, masquer (œil), réordonner", "Effets sur la forme, Styles rapides"], "Trois cartes alignées en haut, réparties horizontalement, nommées.", ["« Répartir » prend les deux formes extrêmes comme repères.", "Une forme masquée reste dans le fichier."]),
  edit: L("Le groupe Modification remplace du texte partout et sélectionne rapidement.", ["Accueil → Remplacer ({{Ctrl+H|⌘⇧H}})", "Accueil → Sélectionner → Sélectionner tout ({{Ctrl+A|⌘A}})"], "Changer une année dans tout un deck.", ["« Remplacer tout » agit sur toute la présentation : relis après."]),
  tables: L("Un tableau PowerPoint sert à présenter des chiffres courts ; au-delà, un graphique est plus lisible.", ["Insertion → Tableau (glisser sur la grille)", "Disposition du tableau → Insérer / Supprimer / Fusionner", "Création du tableau → Styles de tableau"], "Un comparatif de trois sociétés sur trois indicateurs.", ["Ne colle pas un grand tableau Excel : résume.", "{{Tab|Tab}} dans la dernière cellule ajoute une ligne."]),
  illustrations: L("Images, icônes, SmartArt, graphiques, formes et modèles 3D enrichissent une diapositive.", ["Insertion → Images / Icônes / SmartArt / Graphique / Formes", "Format → Taille, rognage, styles"], "Un SmartArt « processus » pour un calendrier de transaction.", ["Icônes, 3D et images de stock demandent Microsoft 365.", "Toujours un texte de remplacement sur les images utiles."]),
  textins: L("Insertion → texte : zones de texte, WordArt, liens, symboles, pied de page, date, numéros.", ["Insertion → Zone de texte / WordArt / Symbole / Lien ({{Ctrl+K|⌘K}})", "Insertion → En-tête et pied de page → Appliquer partout"], "« Confidentiel » + numéro de diapositive sur chaque page.", ["« Appliquer » n'agit que sur la diapositive courante ; « Appliquer partout » sur toutes."]),
  media: L("Vidéo, audio, enregistrement d'écran, zoom et commentaires.", ["Insertion → Vidéo / Audio / Enregistrement d'écran / Zoom / Commentaire"], "Une démo produit en vidéo intégrée.", ["Intègre les médias (Enregistrer sous) pour qu'ils voyagent avec le fichier."]),
  themes: L("Le thème règle polices, couleurs et effets de toute la présentation ; le format et l'arrière-plan s'y ajoutent.", ["Création → Thèmes / Variantes (couleurs, polices)", "Création → Taille des diapositives", "Création → Format de l'arrière-plan → Appliquer partout"], "Changer toute la charte d'un deck en deux clics.", ["Choisis thème et format AVANT de mettre en page."]),
  transitions: L("Une transition règle le passage d'une diapositive à l'autre. Une seule, discrète, partout.", ["Transitions → galerie (Fondu, Pousser…)", "Transitions → Avancer : au clic / après N secondes", "Appliquer partout"], "Fondu partout dans un pitch deck.", ["Les effets spectaculaires fatiguent le public.", "La Morphose demande Microsoft 365 ou 2019."]),
  animations: L("Une animation fait entrer, attirer l'œil ou sortir un objet. Entrée (vert), Emphase (jaune), Sortie (rouge), Trajectoire.", ["Animations → galerie / Ajouter une animation", "Volet Animation : ordre, durée, déclencheur", "Reproduire l'animation"], "Faire apparaître trois arguments un par un.", ["Choisir dans la galerie REMPLACE ; « Ajouter une animation » empile.", "Anime pour guider le regard, pas pour décorer."]),
  show: L("Le diaporama se lance depuis le début ou la diapositive courante ; masquer, répéter, mode Présentateur.", ["{{F5|⌘⇧Retour}} depuis le début · {{Maj+F5|⇧F5}} depuis la diapositive courante", "Diaporama → Masquer la diapositive / Répéter le minutage / Diaporama personnalisé"], "Une version courte pour un auditoire pressé.", ["Teste TOUJOURS en plein écran avant de présenter."]),
  review: L("Révision : orthographe, accessibilité, notes, commentaires, comparaison.", ["Révision → Grammaire et orthographe (F7)", "Révision → Vérifier l'accessibilité", "Notes, Nouveau commentaire, Langue"], "Corriger les fautes et décrire les images avant envoi au client.", ["Les notes et commentaires ne sont pas lisibles par le Dojo : tu les confirmes."]),
  view: L("Affichage : trieuse, plan, notes, quadrillage, repères, zoom, masque.", ["Affichage → Trieuse de diapositives / Mode Plan", "Quadrillage, Repères, Ajuster à la fenêtre", "Masque des diapositives"], "Trieuse pour réordonner 40 diapositives d'un coup d'œil.", ["Le masque change TOUTES les diapositives : un chapitre lui sera consacré."]),
});

Object.assign(LESSONS, {
  oneslide: L("Une diapositive = un message. Le titre dit la conclusion, le corps en donne trois preuves au maximum.", ["Titre : une phrase complète avec un verbe et un chiffre", "Corps : 3 puces maximum ; le reste va en annexe", "Pas de paragraphes : des mots-clés"], "« Le CA progresse de +12 % » plutôt que « Chiffre d'affaires ».", ["Si tu hésites entre deux messages, fais deux diapositives."]),
  hier: L("La hiérarchie guide l'œil : titre, sous-titre, texte, source. Trois tailles, deux polices, trois couleurs, un contraste solide.", ["Tailles décroissantes : ex. 40 / 28 / 20 pt, jamais sous 18 pt pour le corps", "Contraste texte/fond ≥ 4,5:1 (clair sur foncé ou foncé sur clair)", "Création → Variantes → Polices / Couleurs pour régler le thème"], "Titre 40 gras, texte 20, source 11 en gris.", ["Le gras n'a de valeur que s'il est rare.", "Évite le gris clair sur blanc et le blanc sur jaune."]),
  grid: L("Une grille invisible donne un rendu pro : marges constantes, formes alignées, espaces égaux, tailles identiques.", ["Marges d'au moins 40 pt autour de la diapositive", "Aligner → Répartir pour des espaces égaux", "Format de la forme → Taille : saisis la même valeur partout"], "Trois cartes 240 × 160, mêmes tops, 60 pt d'espace entre elles.", ["Rien ne doit en recouvrir un autre.", "Calcule les positions plutôt que de les viser à l'œil."]),
  "mna-valo": L("Les pages de valorisation sont des graphiques dessinés à la main avec des formes : la position et la taille de chaque forme traduisent un chiffre (échelle choisie).", ["Football field : x = origine + (min − axe) × échelle ; largeur = (max − min) × échelle", "Bridge : hauteur = valeur × échelle ; haut = axe − niveau × échelle", "Tableaux de comparables : multiples, médiane, moyenne"], "Barres de DCF, comparables et transactions sur un même axe.", ["Un seul axe, une seule échelle pour toutes les barres.", "Arrondis comme le reste du document (une décimale, « x »)."]),
  "mna-docs": L("Teaser, one-pager, strip profile : des pages courtes, anonymes quand il le faut, avec une structure fixe.", ["Teaser : nom de code, 3 chiffres, mention de confidentialité", "Strip profile : bandeau + tableau court", "Sources et emplois : les deux totaux doivent être égaux"], "Un teaser « Projet Atlas » d'une page.", ["Anonymise partout : titres, notes, propriétés du fichier.", "Les mentions légales se mettent en petit, en bas."]),
  "mna-process": L("Timeline et organigramme : positions calculées, formes alignées et réparties.", ["Timeline : pas = (fin − début) / (n − 1)", "À l'échelle du temps : x = origine + mois × largeur du mois", "Organigramme : parent centré sur ses enfants"], "Calendrier d'une cession de janvier à novembre.", ["Les jalons rapprochés dans le temps se chevauchent : alterne haut et bas."]),
  "autres-metiers": L("Mêmes outils, autres métiers : matrices, entonnoirs, histogrammes, tableaux de KPI.", ["Matrice 2×2 : quatre cases égales, espaces égaux, grille centrée", "Entonnoir : largeur proportionnelle, barres centrées", "Taux = réalisé ÷ objectif"], "Entonnoir de ventes, effectifs par service, parcours d'intégration.", ["Vérifie toujours un total par un deuxième calcul."]),
  "s365-base": L("Ce qui marche dans toutes les versions : formes, images de fichier, fondu, PDF, enregistrement en .ppt.", ["Fichier → Exporter → PDF", "Enregistrer sous → Présentation PowerPoint 97-2003", "Insertion → Images → Cet appareil"], "Un deck lisible chez un client qui a PowerPoint 2016.", ["Les fonctions récentes disparaissent ou s'aplatissent dans les vieux formats."]),
  "s365-recent": L("Concepteur, images de stock, sous-titres en direct, Cameo, assistant IA : réservés à Microsoft 365 (parfois 2019+). Le Dojo les signale par un badge.", ["Si le bouton n'existe pas dans ton ruban, tu n'as pas la fonction", "Utilise « Je n'ai pas cette fonction » pour passer l'exercice"], "Concepteur propose des mises en page à partir de ton contenu.", ["Ces fonctions dépendent d'un service en ligne et d'un abonnement."]),
});
