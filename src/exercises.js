// Catalogue des exercices. Identifiants stables : ne jamais renommer un `id` publié (la progression des élèves en dépend).
import { basesTrack } from "./tracks/bases.js";
import { rubanAccueil } from "./tracks/ruban-accueil.js";
import { rubanInsertion } from "./tracks/ruban-insertion.js";
import { rubanAutres } from "./tracks/ruban-autres.js";

export const EXERCISES = [...basesTrack, ...rubanAccueil, ...rubanInsertion, ...rubanAutres];
export const exById = (id) => EXERCISES.find((e) => e.id === id);
