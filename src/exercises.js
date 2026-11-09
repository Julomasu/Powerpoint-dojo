// Catalogue des exercices. Identifiants stables : ne jamais renommer un `id` publié (la progression des élèves en dépend).
import { basesTrack } from "./tracks/bases.js";

export const EXERCISES = [...basesTrack];
export const exById = (id) => EXERCISES.find((e) => e.id === id);
