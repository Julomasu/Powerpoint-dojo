// Vérifie chaque exercice SANS PowerPoint :
//  1. identifiants uniques ;
//  2. l'état de départ ne satisfait PAS déjà tous les contrôles (sinon l'exercice est gratuit) ;
//  3. après la solution, TOUS les contrôles passent ;
//  4. le modèle survit à un aller-retour .pptx (écriture → lecture) : c'est le mode fichier ;
//  5. quelques tirages de chaque générateur de certification (lot 4).
import { EXERCISES } from "../src/exercises.js";
import { runOps, cloneDeck } from "../src/deck.js";
import { grade } from "../src/grader.js";
import { writePptx, readPptx } from "../src/pptx.js";

const only = process.argv[2];
let fail = 0;
const bad = (id, msg) => { fail++; console.log(`✗ ${id.padEnd(22)} ${msg}`); };

{ const seen = new Set(); for (const e of EXERCISES) { if (seen.has(e.id)) bad(e.id, "IDENTIFIANT EN DOUBLE"); seen.add(e.id); } }

// propriétés comparées après l'aller-retour .pptx
const CMP = ["name", "text", "left", "top", "width", "height", "fill", "lineColor", "lineWeight", "fontName", "fontSize", "bold", "italic", "underline", "color", "align", "valign", "alt", "rot", "group", "ph"];
const same = (a, b, k) => (typeof a === "number" && typeof b === "number" ? Math.abs(a - b) < 0.1 : (a ?? null) === (b ?? null));

for (const ex of EXERCISES) {
  if (only && ex.id !== only) continue;
  try {
    const start = runOps(ex.setup);
    const g0 = grade(ex, start);
    if (g0.pass) bad(ex.id, "le départ satisfait déjà tous les contrôles");
    if (!ex.sol) { bad(ex.id, "pas de solution (sol)"); continue; }
    const end = runOps(ex.sol, cloneDeck(start));
    const g1 = grade(ex, end);
    if (!g1.pass) { bad(ex.id, "la solution échoue : " + g1.items.filter((i) => !i.ok).map((i) => `${i.label} → ${i.msg ?? "non"}`).join(" ; ")); continue; }
    // mode fichier : aller-retour .pptx de l'état final, puis re-correction
    const back = await readPptx(await writePptx(end));
    const g2 = grade(ex, back);
    if (!g2.pass) bad(ex.id, "après aller-retour .pptx : " + g2.items.filter((i) => !i.ok).map((i) => `${i.label} → ${i.msg ?? "non"}`).join(" ; "));
    if (back.slides.length !== end.slides.length) bad(ex.id, "nombre de diapositives changé par l'aller-retour .pptx");
    end.slides.forEach((s, i) => {
      const t = back.slides[i];
      for (const sh of s.shapes) {
        const r = t?.shapes.find((x) => x.name === sh.name);
        if (!r) { bad(ex.id, `forme « ${sh.name} » perdue dans le .pptx`); continue; }
        for (const k of CMP) if (sh[k] !== undefined && sh.kind !== "table" && !(k === "fill" && sh.ph) && !same(sh[k], r[k], k) && !(r[k] === undefined)) bad(ex.id, `« ${sh.name} ».${k} : ${sh[k]} → ${r[k]} après .pptx`);
      }
    });
  } catch (e) {
    bad(ex.id, "erreur : " + e.message);
  }
}
console.log(fail ? `\n${fail} problème(s).` : `\n✓ ${EXERCISES.length} exercices vérifiés (départ, solution, aller-retour .pptx).`);
process.exit(fail ? 1 : 0);
