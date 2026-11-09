// Contrôle qualité : joue la solution de chaque exercice dans le VRAI PowerPoint et vérifie que le correcteur la valide
// (et que le départ ne la valide pas). ⚠ Remplace tout le contenu de la présentation ouverte : à lancer dans une présentation vide.
import { loadSetup, applyOps, readDeck } from "./ppt.js";
import { grade } from "./grader.js";
import { compatible } from "./caps.js";

export async function validateAll(exercises, onProgress = () => {}) {
  const out = [];
  const list = exercises.filter((e) => compatible(e));
  let i = 0;
  for (const ex of list) {
    onProgress(++i, list.length, ex);
    try {
      await loadSetup(ex.setup);
      const g0 = grade(ex, await readDeck());
      await applyOps(ex.sol, { off: 0 });
      const g1 = grade(ex, await readDeck());
      const bad = g1.items.filter((x) => !x.ok);
      out.push({ id: ex.id, ok: g1.pass && !g0.pass, startPasses: g0.pass, fails: bad.map((b) => `${b.label} → ${b.msg ?? "non"}`) });
    } catch (e) {
      out.push({ id: ex.id, ok: false, error: e.message });
    }
  }
  return { out, skipped: exercises.length - list.length };
}
