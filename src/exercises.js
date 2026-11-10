// Catalogue des exercices. Identifiants stables : ne jamais renommer un `id` publié (la progression des élèves en dépend).
import { basesTrack } from "./tracks/bases.js";
import { rubanAccueil } from "./tracks/ruban-accueil.js";
import { rubanInsertion } from "./tracks/ruban-insertion.js";
import { rubanAutres } from "./tracks/ruban-autres.js";
import { designTrack } from "./tracks/design.js";
import { metiersTrack } from "./tracks/metiers.js";
import { sans365Track } from "./tracks/sans365.js";

// Badges de version : fonctions absentes des PowerPoint « perpétuels » 2016/2019 (« 365 ») ou de 2016 seulement (« 2019+ »).
const TIER = { "i-icone": "365", "i-3d": "365", "i-zoom": "2019+", "i-ecran": "2019+", "t-morphose": "2019+", "a-surligner": "2019+", "i-lien": null, "s-designer": "365", "s-images-stock": "365", "s-sous-titres": "365", "s-cameo": "365", "s-copilot": "365", "i-graphique": null };
export const EXERCISES = [...basesTrack, ...rubanAccueil, ...rubanInsertion, ...rubanAutres, ...designTrack, ...metiersTrack, ...sans365Track].map((e) => (TIER[e.id] ? { ...e, tier: TIER[e.id] } : e));
export const exById = (id) => EXERCISES.find((e) => e.id === id);
