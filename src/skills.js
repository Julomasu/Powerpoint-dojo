// Parcours « façon Duolingo » : des CHAPITRES colorés (GROUPS) faits de COMPÉTENCES (SKILLS). Chaque exercice déclare sa compétence (`skill`).
// Rien n'est verrouillé. Les chapitres « soon » sont annoncés mais pas encore livrés (voir CLAUDE.md : lots).
export const GROUPS = [
  { id: "bases", name: "Les bases", color: "#C43E1C", ink: "#fff", blurb: "Diapositives, mises en page, formes, texte, couleurs, organisation." },
  { id: "accueil", name: "Ruban : Accueil", color: "#2B7A78", ink: "#fff", blurb: "Presse-papiers, diapositives, police, paragraphe, dessin, modification." },
  { id: "insertion", name: "Ruban : Insertion", color: "#3A6EA5", ink: "#fff", blurb: "Tableaux, images, icônes, SmartArt, graphiques, liens, médias." },
  { id: "creation", name: "Création, transitions, animations", color: "#7B4FA2", ink: "#fff", blurb: "Thèmes, format, arrière-plan, transitions, animations." },
  { id: "design", name: "Mise en page et design", color: "#B5651D", ink: "#fff", blurb: "Un message par slide, hiérarchie, contraste, grille.", soon: true },
  { id: "donnees", name: "Graphiques et tableaux", color: "#4C8C4A", ink: "#fff", blurb: "Données dans PowerPoint : tableaux, graphiques, SmartArt.", soon: true },
  { id: "masque", name: "Masque et modèles", color: "#8A5A44", ink: "#fff", blurb: "Masque des diapositives, mises en page, modèles.", soon: true },
  { id: "diaporama", name: "Diaporama et collaboration", color: "#A23E48", ink: "#fff", blurb: "Présenter, révision, accessibilité, affichage." },
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
  { id: "clipboard", group: "accueil", name: "Presse-papiers", blurb: "Copier, couper, reproduire la mise en forme" },
  { id: "slidesgrp", group: "accueil", name: "Groupe Diapositives", blurb: "Mise en page, rétablir, sections" },
  { id: "fontgrp", group: "accueil", name: "Groupe Police", blurb: "Taille, casse, effets, effacer la mise en forme" },
  { id: "paragrp", group: "accueil", name: "Groupe Paragraphe", blurb: "Puces, numérotation, interligne, colonnes" },
  { id: "drawing", group: "accueil", name: "Groupe Dessin", blurb: "Organiser, aligner, répartir, volet Sélection" },
  { id: "edit", group: "accueil", name: "Groupe Modification", blurb: "Remplacer, sélectionner" },
  { id: "tables", group: "insertion", name: "Tableaux", blurb: "Insérer, remplir, lignes et colonnes, style" },
  { id: "illustrations", group: "insertion", name: "Illustrations", blurb: "Images, icônes, SmartArt, graphiques, formes, 3D" },
  { id: "textins", group: "insertion", name: "Texte, liens et symboles", blurb: "WordArt, lien, action, pied de page, symbole" },
  { id: "media", group: "insertion", name: "Médias et commentaires", blurb: "Vidéo, audio, zoom, commentaires" },
  { id: "themes", group: "creation", name: "Thèmes, format et arrière-plan", blurb: "Thème, palette, taille, fond" },
  { id: "transitions", group: "creation", name: "Transitions", blurb: "Fondu, pousser, avance automatique" },
  { id: "animations", group: "creation", name: "Animations", blurb: "Entrée, emphase, sortie, ordre" },
  { id: "show", group: "diaporama", name: "Diaporama", blurb: "Lancer, masquer, présentateur, répétition" },
  { id: "review", group: "diaporama", name: "Révision", blurb: "Orthographe, accessibilité, notes, commentaires" },
  { id: "view", group: "diaporama", name: "Affichage", blurb: "Trieuse, plan, quadrillage, zoom, masque" },
];
export const skillById = (id) => SKILLS.find((s) => s.id === id);
export const groupById = (id) => GROUPS.find((g) => g.id === id);
export const skillsOf = (gid) => SKILLS.filter((s) => s.group === gid);
