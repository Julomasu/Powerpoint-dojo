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
