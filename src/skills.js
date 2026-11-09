// Parcours « façon Duolingo » : des CHAPITRES colorés (GROUPS) faits de COMPÉTENCES (SKILLS). Chaque exercice déclare sa compétence (`skill`).
// Rien n'est verrouillé. Les chapitres « soon » sont annoncés mais pas encore livrés (voir CLAUDE.md : lots).
export const GROUPS = [
  { id: "bases", name: "Les bases", color: "#C43E1C", ink: "#fff", blurb: "Diapositives, mises en page, formes, texte, couleurs, organisation." },
  { id: "accueil", name: "Ruban : Accueil", color: "#2B7A78", ink: "#fff", blurb: "Presse-papiers, police, paragraphe, dessin, styles rapides.", soon: true },
  { id: "insertion", name: "Ruban : Insertion", color: "#3A6EA5", ink: "#fff", blurb: "Images, icônes, SmartArt, graphiques, tableaux, liens, médias.", soon: true },
  { id: "creation", name: "Création, transitions, animations", color: "#7B4FA2", ink: "#fff", blurb: "Thèmes, arrière-plan, transitions, animations.", soon: true },
  { id: "design", name: "Mise en page et design", color: "#B5651D", ink: "#fff", blurb: "Un message par slide, hiérarchie, contraste, grille.", soon: true },
  { id: "donnees", name: "Graphiques et tableaux", color: "#4C8C4A", ink: "#fff", blurb: "Données dans PowerPoint : tableaux, graphiques, SmartArt.", soon: true },
  { id: "masque", name: "Masque et modèles", color: "#8A5A44", ink: "#fff", blurb: "Masque des diapositives, mises en page, modèles.", soon: true },
  { id: "diaporama", name: "Diaporama et collaboration", color: "#A23E48", ink: "#fff", blurb: "Présenter, commentaires, révision, accessibilité.", soon: true },
  { id: "metiers", name: "Cas de métier", color: "#1F3864", ink: "#fff", blurb: "Teaser, one-pager, strip profile, football field, bridge, timeline de process.", soon: true },
  { id: "sans365", name: "Sans Microsoft 365", color: "#6B6F76", ink: "#fff", blurb: "Ce qui marche partout (2016, 2019) et les fonctions récentes signalées.", soon: true },
];

export const SKILLS = [
  { id: "slides", group: "bases", name: "Diapositives", blurb: "Titre, ajouter, dupliquer, ordonner, supprimer" },
  { id: "layouts", group: "bases", name: "Mises en page", blurb: "Titre et contenu, puces, deux colonnes" },
  { id: "textbox", group: "bases", name: "Zones de texte", blurb: "Insérer du texte où l'on veut" },
  { id: "shapes", group: "bases", name: "Formes", blurb: "Dessiner, dupliquer, supprimer" },
  { id: "colors", group: "bases", name: "Remplissage et contour", blurb: "Couleurs hexadécimales, traits" },
  { id: "font", group: "bases", name: "Police", blurb: "Gras, taille, couleur, famille" },
  { id: "paragraph", group: "bases", name: "Paragraphe", blurb: "Alignement horizontal et vertical" },
  { id: "position", group: "bases", name: "Position et taille", blurb: "Valeurs exactes, rotation" },
  { id: "arrange", group: "bases", name: "Aligner et organiser", blurb: "Aligner, répartir, grouper, ordre Z" },
  { id: "setup", group: "bases", name: "Réglages de la présentation", blurb: "Arrière-plan, format, texte alternatif" },
];
export const skillById = (id) => SKILLS.find((s) => s.id === id);
export const groupById = (id) => GROUPS.find((g) => g.id === id);
export const skillsOf = (gid) => SKILLS.filter((s) => s.group === gid);
