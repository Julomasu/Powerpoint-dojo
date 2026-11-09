// Écran Diagnostic : teste, dans le vrai PowerPoint de l'élève, ce que le Dojo sait écrire ET relire. Sert à repérer ce qui dépend de la
// version (jeux PowerPointApi 1.x) avant de croire qu'un exercice est faux. La présentation n'est pas modifiée : le test se fait sur
// des diapositives temporaires ajoutées à la fin puis supprimées.
import { hasOffice, readDeck, applyOps, run, supports } from "./ppt.js";
import { findShape } from "./deck.js";
import { SETS, SET_INFO, refreshCaps } from "./caps.js";
import { appInfo } from "./profile.js";

const near = (a, b) => (typeof a === "number" && typeof b === "number" ? Math.abs(a - b) < 1 : (a ?? null) === (b ?? null));

// (libellé, forme ou diapositive, propriété, valeur attendue, version minimale)
const PROBES = [
  ["Texte d'une zone de texte", "T", "text", "Bonjour\nle monde", "1.4"],
  ["Position et taille", "T", "left", 100, "1.4"], ["", "T", "top", 80, "1.4"], ["", "T", "width", 300, "1.4"], ["", "T", "height", 60, "1.4"],
  ["Police : nom", "T", "fontName", "Georgia", "1.4"], ["Police : taille", "T", "fontSize", 28, "1.4"], ["Police : gras", "T", "bold", true, "1.4"], ["Police : italique", "T", "italic", true, "1.4"],
  ["Police : souligné", "T", "underline", true, "1.4"], ["Police : couleur", "T", "color", "#C00000", "1.4"],
  ["Alignement horizontal", "T", "align", "center", "1.4"], ["Alignement vertical", "T", "valign", "middle", "1.4"],
  ["Remplissage", "R", "fill", "#1F3864", "1.4"], ["Contour : couleur", "R", "lineColor", "#548235", "1.4"], ["Contour : épaisseur", "R", "lineWeight", 3, "1.4"],
  ["Texte alternatif", "R", "alt", "Description test", "1.10"], ["Rotation", "R", "rot", 45, "1.10"],
  ["Groupe", "G1", "group", "Groupe test", "1.8"],
  ["Arrière-plan de la diapositive", "S", "bg", "#1F3864", "1.10"],
  ["Mise en page reconnue", "S", "layout", "titleOnly", "1.8"],
  ["Espace réservé de titre reconnu", "P", "text", "Titre test", "1.8"],
  ["Tableau : valeurs", "TB", "values", "Tableau", "1.8"],
];

export async function diagnose(onStep = () => {}) {
  const steps = [];
  const push = (s) => { steps.push(s); onStep(steps); };
  if (!hasOffice()) return [{ label: "PowerPoint", ok: false, note: "Ouvre le Dojo depuis PowerPoint (onglet Accueil → Ouvrir le Dojo) pour lancer le diagnostic." }];
  const caps = refreshCaps();
  const info = appInfo();
  push({ label: "Version de PowerPoint", ok: true, note: `${info.platform || "?"} ${info.version || ""}`.trim() });
  for (const v of SETS) if (SET_INFO[v]) push({ label: `PowerPointApi ${v}`, ok: !!caps.sets[v], note: SET_INFO[v] + (caps.sets[v] ? "" : " — non disponible ici : les exercices qui en dépendent sont signalés") });

  let n = 0;
  try {
    n = await run(async (ctx) => { ctx.presentation.slides.load("items/id"); await ctx.sync(); return ctx.presentation.slides.items.length; });
    const ops = [
      { op: "slide", layout: "titleOnly", title: "Titre test", bg: "#1F3864" },
      { op: "add", s: 0, shape: { kind: "text", name: "DojoT", text: "Bonjour\nle monde", left: 100, top: 80, width: 300, height: 60, fontName: "Georgia", fontSize: 28, bold: true, italic: true, underline: true, color: "#C00000", align: "center", valign: "middle" } },
      { op: "add", s: 0, shape: { kind: "rect", name: "DojoR", left: 100, top: 200, width: 200, height: 80, fill: "#1F3864", lineColor: "#548235", lineWeight: 3, alt: "Description test", rot: 45 } },
      { op: "add", s: 0, shape: { kind: "rect", name: "DojoG1", left: 400, top: 200, width: 80, height: 80, fill: "#C00000" } },
      { op: "add", s: 0, shape: { kind: "rect", name: "DojoG2", left: 500, top: 200, width: 80, height: 80, fill: "#548235" } },
      { op: "group", s: 0, sels: ["DojoG1", "DojoG2"], name: "Groupe test" },
      { op: "add", s: 0, shape: { kind: "table", name: "DojoTB", rows: 2, cols: 2, values: [["Tableau", "b"], ["c", "d"]], left: 100, top: 320, width: 300, height: 80 } },
    ];
    push({ label: "Écriture de diapositives de test", ok: true, note: "ajoutées à la fin, supprimées ensuite" });
    try { await applyOps(ops, { off: n }); } catch (e) { push({ label: "Écriture dans la présentation", ok: false, note: e.message }); throw e; }
    const deck = await readDeck();
    const sl = deck.slides[n];
    if (!sl) throw new Error("La diapositive de test est introuvable.");
    for (const [label, who, prop, want, api] of PROBES) {
      if (!label) continue;
      if (!supports(api)) { push({ label, ok: null, note: `ignoré : demande PowerPointApi ${api}` }); continue; }
      let got;
      if (who === "S") got = prop === "bg" ? sl.bg : sl[prop];
      else if (who === "P") got = findShape(sl, { ph: "title" })?.text;
      else if (who === "T") got = null; // les propriétés de T se testent ci-dessous
      let ok;
      if (who === "S" || who === "P") ok = got !== undefined && near(String(got).toUpperCase?.() ?? got, String(want).toUpperCase?.() ?? want);
      else {
        const sh = findShape(sl, who === "G1" ? "DojoG1" : who === "TB" ? "DojoTB" : who === "R" ? "DojoR" : "DojoT");
        got = sh?.[prop];
        ok = prop === "values" ? got?.[0]?.[0] === want : near(typeof got === "string" ? got.toUpperCase() : got, typeof want === "string" ? want.toUpperCase() : want);
        if (prop === "text" && who === "T") ok = String(got).replace(/\r/g, "\n").replace(/\v/g, "\n") === want;
      }
      push({ label, ok: !!ok, note: ok ? "lu et écrit correctement" : got === undefined ? "non lisible dans cette version (sera ignoré par le correcteur)" : `attendu ${JSON.stringify(want)}, lu ${JSON.stringify(got)}` });
    }
  } catch (e) {
    push({ label: "Diagnostic interrompu", ok: false, note: e.message });
  } finally {
    // nettoyage : supprime les diapositives de test (celles après les n premières)
    try {
      await run(async (ctx) => {
        const s = ctx.presentation.slides;
        s.load("items/id");
        await ctx.sync();
        s.items.slice(n).forEach((x) => x.delete());
        await ctx.sync();
      });
    } catch { /* rien à nettoyer */ }
  }
  return steps;
}
