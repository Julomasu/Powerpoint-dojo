// Ce que le PowerPoint de cet ordinateur sait lire/écrire. Office.js groupe ses fonctions en « jeux de conditions » PowerPointApi 1.1 → 1.10.
// On le détecte au lancement (isSetSupported) et on déduit des opérations/contrôles de chaque exercice la version qu'il demande.
export const SETS = ["1.1", "1.2", "1.3", "1.4", "1.5", "1.6", "1.7", "1.8", "1.9", "1.10"];
export const SET_INFO = {
  "1.3": "ajouter / supprimer des diapositives, balises",
  "1.4": "formes : ajouter, déplacer, redimensionner, couleur, texte, police",
  "1.5": "liens hypertextes, lecture du parent d'une forme",
  "1.8": "groupes, ordre Z, tableaux, mises en page, déplacer une diapositive, export d'une diapositive",
  "1.9": "mise en forme des tableaux",
  "1.10": "taille des diapositives, arrière-plan, texte alternatif, rotation, couleurs du thème",
};
const KEY = "powerpoint-dojo.caps";

export function detectSets() {
  const out = {};
  try {
    for (const v of SETS) out[v] = Office.context.requirements.isSetSupported("PowerPointApi", v);
  } catch { /* hors PowerPoint */ }
  return out;
}
export function getCaps() {
  try { return JSON.parse(localStorage.getItem(KEY)); } catch { return null; }
}
export function refreshCaps() {
  const sets = detectSets();
  const d = (() => { try { return Office.context.diagnostics ?? {}; } catch { return {}; } })();
  const caps = { sets, platform: d.platform ?? "", version: d.version ?? "", at: Date.now() };
  try { localStorage.setItem(KEY, JSON.stringify(caps)); } catch { /* rien */ }
  return caps;
}
export const maxSet = (caps = getCaps()) => [...SETS].reverse().find((v) => caps?.sets?.[v]) ?? null;
const ver = (v) => Number(v.split(".")[1]);

// Version de l'API qu'un exercice demande (d'après sa solution et ses contrôles)
const OP_API = { size: "1.10", bg: "1.10", group: "1.8", ungroup: "1.8", z: "1.8", moveSlide: "1.8", layout: "1.8", dupSlide: "1.8" };
const PROP_API = { alt: "1.10", rot: "1.10" };
export function requirementsOf(ex) {
  let need = "1.4";
  const up = (v) => { if (ver(v) > ver(need)) need = v; };
  for (const op of [...(ex.setup ?? []), ...(ex.sol ?? [])]) {
    if (OP_API[op.op]) up(OP_API[op.op]);
    for (const k of Object.keys(op.props ?? {})) if (PROP_API[k]) up(PROP_API[k]);
    for (const k of Object.keys(op.shape ?? {})) if (PROP_API[k]) up(PROP_API[k]);
    if (op.shape?.kind === "table") up("1.8");
    if (op.layout || op.op === "slide") up("1.3");
  }
  for (const a of ex.answers ?? []) {
    if (a.kind === "bg" || a.kind === "size") up("1.10");
    if (a.kind === "layout") up("1.8");
    if (a.kind === "transition" || a.kind === "anim") up("1.8");
  }
  return { api: need, tier: ex.tier ?? null, unwritable: [...(ex.setup ?? [])].some((o) => o.op === "transition" || o.op === "anim"), // PowerPoint ne laisse pas écrire ça : impossible de poser le départ
    xml: (ex.answers ?? []).some((a) => a.kind === "transition" || a.kind === "anim") };
}
// `caps` absent (jamais détecté) ou mode fichier : tout est compatible
export function compatible(ex, caps = getCaps()) {
  if (!caps?.sets) return true;
  if (ex.unwritable ?? requirementsOf(ex).unwritable) return false;
  const m = maxSet(caps);
  return !m || ver(m) >= ver(ex.api ?? requirementsOf(ex).api);
}
