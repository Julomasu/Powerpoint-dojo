// Test de niveau : questions à choix, rattachées à un chapitre (`group`). Un chapitre dont toutes les questions sont justes peut être sauté.
// Lot 2 : questions du chapitre « Les bases » ; chaque nouveau chapitre ajoute les siennes (cible ≈ 24 questions au total).
const Q = (group, q, options, answer, why) => ({ group, q, options, answer, why });
export const QUESTIONS = [
  Q("bases", "Comment ajouter une diapositive à la fin de la présentation ?", ["Accueil → Nouvelle diapositive", "Insertion → Zone de texte", "Création → Variantes", "Affichage → Trieuse"], 0, "Le bouton Nouvelle diapositive est dans l'onglet Accueil."),
  Q("bases", "Que fait « Dupliquer la diapositive » (clic droit sur la miniature) ?", ["Elle supprime l'original", "Elle crée une copie juste après", "Elle l'exporte en PDF", "Elle l'envoie à la fin"], 1, "La copie est insérée juste après l'originale."),
  Q("bases", "Pour réordonner les diapositives, le plus simple est de…", ["les supprimer et les refaire", "glisser-déposer les miniatures", "changer de thème", "modifier le masque"], 1, "Glisser-déposer dans le volet de gauche."),
  Q("bases", "Quelle mise en page choisir pour une liste à puces sous un titre ?", ["Titre seul", "Vide", "Titre et contenu", "En-tête de section"], 2, "Titre et contenu a une grande zone de texte à puces."),
  Q("bases", "Comment obtenir un carré parfait (et non un rectangle) en dessinant ?", ["Maintenir Maj en glissant", "Maintenir Alt", "Double-cliquer", "Impossible"], 0, "Maj garde les proportions."),
  Q("bases", "Que contient le champ « Hex » d'une couleur personnalisée ?", ["Une taille de police", "Le code couleur RRGGBB", "Un pourcentage de transparence", "Un nom de thème"], 1, "Ex. 1F3864 pour un bleu marine."),
  Q("bases", "Pour changer la police de TOUT le texte d'une forme, je…", ["sélectionne la forme par son bord", "sélectionne la diapositive", "ferme PowerPoint", "supprime la forme"], 0, "Sélectionner la forme entière applique le réglage à tout le texte."),
  Q("bases", "L'alignement vertical du texte dans une forme se règle avec…", ["Centrer", "Aligner le texte (Haut / Milieu / Bas)", "Interligne", "Retrait"], 1, "« Centrer » est horizontal ; « Aligner le texte » est vertical."),
  Q("bases", "Pour répartir 3 formes avec des espaces égaux, je les sélectionne puis…", ["Aligner → Répartir horizontalement", "Grouper", "Faire pivoter", "Mettre au premier plan"], 0, "Répartir égalise les espaces entre formes."),
  Q("bases", "À quoi sert le volet Sélection ?", ["Choisir un thème", "Lister, nommer et masquer les formes de la diapositive", "Corriger l'orthographe", "Lancer le diaporama"], 1, "Il liste toutes les formes, même superposées."),
  Q("bases", "Une forme est cachée derrière une autre. Pour la ramener devant :", ["Mettre au premier plan", "Faire pivoter", "Dissocier", "Réinitialiser"], 0, "L'ordre d'empilement (ordre Z) se règle dans Organiser."),
  Q("bases", "Que décrit un bon texte de remplacement (alt) ?", ["La couleur de la forme", "L'information que porte l'image ou le schéma", "Le nom du fichier", "La taille en points"], 1, "Il décrit l'information pour qui ne voit pas l'image."),
];
export const KEY = "powerpoint-dojo.placement";
export const getPlacement = () => { try { return JSON.parse(localStorage.getItem(KEY)); } catch { return null; } };
export const savePlacement = (r) => { try { localStorage.setItem(KEY, JSON.stringify(r)); } catch { /* rien */ } };
// groupes dont toutes les questions sont justes
export const acquiredGroups = (answers) => {
  const by = {};
  QUESTIONS.forEach((q, i) => { (by[q.group] ??= []).push(answers[i] === q.answer); });
  return Object.entries(by).filter(([, v]) => v.length && v.every(Boolean)).map(([g]) => g);
};
