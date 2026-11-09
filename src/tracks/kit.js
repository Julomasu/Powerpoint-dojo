// Outils communs aux fichiers d'exercices.
import { mk, confirmA } from "../answers.js";
import { O } from "../deck.js";
export const NAVY = "#1F3864", RED = "#C00000", GREEN = "#548235", GREY = "#7F7F7F", ORANGE = "#ED7D31";
export const titleSlide = (title, extra = {}) => O.slide("titleOnly", { title, ...extra });
// Exercice dont PowerPoint ne laisse rien lire : l'élève le fait puis confirme (« C'est fait »). Aucun XP bonus n'est donné sans effort
// puisque la liste de contrôle reste « à confirmer » tant qu'il n'a pas cliqué.
export const mkc = (o) => mk({ answers: [confirmA(o.id + "-ok", o.label)], sol: [], ...o });
