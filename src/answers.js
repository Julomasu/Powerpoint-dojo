// Contrôles d'un exercice : chaque contrôle est une ligne de la liste « Ce que ta présentation doit contenir ».
//   test(deck, ctx) renvoie true | false | string (message d'échec) | { ok, msg, skip }
//   - ctx.confirmed : étapes que l'élève a confirmées lui-même (confirmA)
// Règle d'or : une propriété que le PowerPoint de l'élève ne sait pas lire (valeur `undefined`) est IGNORÉE, jamais bloquante.
import { findShapes, colorDist, hex, contrast, overlaps, inside, GEOS } from "./deck.js";

const TOL = { left: 1.5, top: 1.5, width: 1.5, height: 1.5, rot: 0.6, lineWeight: 0.3, fontSize: 0.01 };
const PROP_LABEL = { text: "le texte", left: "la position horizontale", top: "la position verticale", width: "la largeur", height: "la hauteur", fill: "la couleur de remplissage", lineColor: "la couleur du contour", lineWeight: "l'épaisseur du contour", fontName: "la police", fontSize: "la taille de police", bold: "le gras", italic: "l'italique", underline: "le soulignement", color: "la couleur du texte", align: "l'alignement", valign: "l'alignement vertical", alt: "le texte alternatif", rot: "la rotation", name: "le nom", link: "le lien" };
const num = (x) => Math.round(x * 10) / 10;

// Teste une valeur lue contre une valeur attendue. Renvoie null si OK, "ignoré" si illisible, sinon un message.
function matchProp(key, actual, want) {
  if (actual === undefined) return "ignoré";
  const lbl = PROP_LABEL[key] ?? key;
  if (want instanceof RegExp) return want.test(String(actual ?? "")) ? null : `${lbl} ne correspond pas`;
  if (typeof want === "function") return want(actual) ? null : `${lbl} n'est pas bon`;
  if (want && typeof want === "object") {
    if ("near" in want) return colorDist(actual, want.near) <= (want.tol ?? 40) ? null : `${lbl} est trop différente`;
    if ("approx" in want) return Math.abs(actual - want.approx) <= (want.tol ?? 1.5) ? null : `${lbl} : ${num(actual)} au lieu d'environ ${num(want.approx)}`;
    if ("min" in want || "max" in want) {
      if (want.min != null && actual < want.min) return `${lbl} est trop petit${key === "fontSize" ? "e" : ""} (${num(actual)}, au moins ${want.min})`;
      if (want.max != null && actual > want.max) return `${lbl} est trop grand${key === "fontSize" ? "e" : ""} (${num(actual)}, au plus ${want.max})`;
      return null;
    }
    if ("exact" in want) return String(actual ?? "") === want.exact ? null : `${lbl} : respecte exactement les majuscules et minuscules`;
    if ("oneOf" in want) return want.oneOf.some((w) => matchProp(key, actual, w) === null) ? null : `${lbl} n'est pas celui demandé`;
  }
  if (["fill", "lineColor", "color"].includes(key)) {
    if (want === null) return actual === null ? null : `${lbl} devrait être vide`;
    if (actual === null) return `${lbl} est vide`;
    return colorDist(actual, want) <= 12 ? null : `${lbl} n'est pas la bonne`;
  }
  if (typeof want === "number") return Math.abs(actual - want) <= (TOL[key] ?? 0.01) ? null : `${lbl} : ${num(actual)} au lieu de ${num(want)}`;
  if (typeof want === "boolean") return !!actual === want ? null : `${lbl} ${want ? "n'est pas activé" : "est activé"}`;
  if (typeof want === "string") return String(actual ?? "").trim().toLowerCase() === want.trim().toLowerCase() ? null : `${lbl} : « ${actual ?? ""} » au lieu de « ${want} »`;
  return null;
}

// Forme(s) qui répondent à `sel` : au moins une doit vérifier TOUTES les propriétés de `props`
export function shapeA(slide, sel, props, label, opts = {}) {
  return {
    kind: "shape",
    label,
    test(deck) {
      const sl = deck.slides[slide];
      if (!sl) return `Il n'y a pas de diapositive ${slide + 1}.`;
      const cands = findShapes(sl, sel);
      if (!cands.length) return opts.missing ?? "Je ne trouve pas cette forme sur la diapositive " + (slide + 1) + ".";
      let first = null, seen = 0;
      for (const s of cands) {
        let bad = null;
        for (const [k, w] of Object.entries(props)) {
          const r = matchProp(k, s[k], w);
          if (r === "ignoré") seen++;
          else if (r) { bad = r; break; }
        }
        if (!bad) return seen === Object.keys(props).length && seen > 0 ? { ok: true, skip: true } : true;
        first ??= bad;
      }
      return first[0].toUpperCase() + first.slice(1) + ".";
    },
  };
}

// Nombre de formes d'un certain type (n exact ou { min, max })
export function countA(slide, sel, n, label) {
  return {
    kind: "count",
    label,
    test(deck) {
      const sl = deck.slides[slide];
      if (!sl) return `Il n'y a pas de diapositive ${slide + 1}.`;
      const c = findShapes(sl, sel).length;
      const ok = typeof n === "number" ? c === n : (n.min == null || c >= n.min) && (n.max == null || c <= n.max);
      return ok ? true : `J'en compte ${c}${typeof n === "number" ? `, il en faut ${n}` : n.min != null && c < n.min ? `, il en faut au moins ${n.min}` : `, il en faut au plus ${n.max}`}.`;
    },
  };
}

export const slidesA = (n, label = n === 1 ? "La présentation contient 1 diapositive" : `La présentation contient ${n} diapositives`) => ({
  kind: "slides", label,
  test: (deck) => (typeof n === "number" ? deck.slides.length === n : deck.slides.length >= (n.min ?? 0) && deck.slides.length <= (n.max ?? 1e9)) || `Il y a ${deck.slides.length} diapositive${deck.slides.length > 1 ? "s" : ""}.`,
});

export const layoutA = (slide, layout, label) => ({
  kind: "layout", label,
  test(deck) {
    const s = deck.slides[slide];
    if (!s) return `Il n'y a pas de diapositive ${slide + 1}.`;
    if (s.layout === undefined) return { ok: true, skip: true };
    return s.layout === layout || `La mise en page de la diapositive ${slide + 1} n'est pas la bonne.`;
  },
});

export const bgA = (slide, color, label) => ({
  kind: "bg", label,
  test(deck) {
    const s = deck.slides[slide];
    if (!s) return `Il n'y a pas de diapositive ${slide + 1}.`;
    if (s.bg === undefined) return { ok: true, skip: true };
    return (s.bg && colorDist(s.bg, color) <= 12) || "La couleur d'arrière-plan n'est pas la bonne.";
  },
});

export const sizeA = (w, h, label) => ({
  kind: "size", label,
  test: (deck) => (Math.abs(deck.slideW - w) < 1 && Math.abs(deck.slideH - h) < 1) || `Le format est ${num(deck.slideW)} × ${num(deck.slideH)} pt.`,
});

// Alignement : toutes les formes désignées partagent le même bord / centre
export function alignA(slide, sels, edge, label, tol = 1.5) {
  const get = { left: (s) => s.left, right: (s) => s.left + s.width, top: (s) => s.top, bottom: (s) => s.top + s.height, centerX: (s) => s.left + s.width / 2, centerY: (s) => s.top + s.height / 2 }[edge];
  return {
    kind: "align", label,
    test(deck) {
      const sl = deck.slides[slide];
      const xs = [];
      for (const q of sels) {
        const f = findShapes(sl, q)[0];
        if (!f) return "Il manque une des formes à aligner.";
        xs.push(get(f));
      }
      return Math.max(...xs) - Math.min(...xs) <= tol || `Elles ne sont pas alignées (écart de ${num(Math.max(...xs) - Math.min(...xs))} pt).`;
    },
  };
}

// Répartition régulière : espaces égaux entre les formes (horizontalement ou verticalement)
export function distributeA(slide, sels, axis, label, tol = 1.5) {
  return {
    kind: "distribute", label,
    test(deck) {
      const sl = deck.slides[slide];
      const shapes = sels.map((q) => findShapes(sl, q)[0]);
      if (shapes.some((s) => !s)) return "Il manque une des formes à répartir.";
      const a = axis === "h" ? ["left", "width"] : ["top", "height"];
      const sorted = [...shapes].sort((x, y) => x[a[0]] - y[a[0]]);
      const gaps = sorted.slice(1).map((s, i) => s[a[0]] - (sorted[i][a[0]] + sorted[i][a[1]]));
      return Math.max(...gaps) - Math.min(...gaps) <= tol || `Les espaces ne sont pas égaux (de ${num(Math.min(...gaps))} à ${num(Math.max(...gaps))} pt).`;
    },
  };
}

// Règle libre : fn(deck) → true | false | message
export const ruleA = (label, fn) => ({ kind: "rule", label, test: (deck, ctx) => fn(deck, ctx) });

// Règles de qualité courantes (design) réutilisées par les exercices
export const noOverlapA = (slide, label = "Aucune forme n'en recouvre une autre") => ({
  kind: "rule", label,
  test(deck) {
    const sh = deck.slides[slide].shapes.filter((s) => !s.ph || s.text);
    for (let i = 0; i < sh.length; i++) for (let j = i + 1; j < sh.length; j++) if (overlaps(sh[i], sh[j])) return `« ${sh[i].name} » et « ${sh[j].name} » se chevauchent.`;
    return true;
  },
});
export const insideA = (slide, label = "Tout reste dans la diapositive") => ({
  kind: "rule", label,
  test(deck) {
    const out = deck.slides[slide].shapes.find((s) => !inside(s, deck));
    return !out || `« ${out.name} » dépasse de la diapositive.`;
  },
});
export const contrastA = (slide, sel, min, label) => ({
  kind: "rule", label,
  test(deck) {
    const s = findShapes(deck.slides[slide], sel)[0];
    if (!s) return "Je ne trouve pas la zone de texte.";
    if (s.color === undefined || s.fill === undefined) return { ok: true, skip: true };
    const bg = s.fill ?? deck.slides[slide].bg ?? "#FFFFFF";
    const c = contrast(s.color, bg);
    return c >= min || `Contraste insuffisant : ${num(c)}:1 (il faut au moins ${min}:1).`;
  },
});

// Transition / animations : lues dans le XML de la diapositive (undefined = non lisible ici, donc ignoré)
export const transitionA = (slide, want, label) => ({
  kind: "transition", label,
  test(deck) {
    const s = deck.slides[slide];
    if (!s) return `Il n'y a pas de diapositive ${slide + 1}.`;
    if (s.transition === undefined) return { ok: true, skip: true };
    if (!s.transition) return "Aucune transition sur cette diapositive.";
    const t = s.transition;
    if (want.effect && !(Array.isArray(want.effect) ? want.effect : [want.effect]).includes(t.effect)) return `La transition est « ${t.effect} », pas celle demandée.`;
    if (want.advClick !== undefined && t.advClick !== want.advClick) return want.advClick ? "L'avance au clic doit rester cochée." : "Décoche « Au clic ».";
    if (want.advTime !== undefined && (t.advTime == null || Math.abs(t.advTime - want.advTime) > 0.05)) return `Le délai d'avance automatique est ${t.advTime ?? "absent"} s au lieu de ${want.advTime} s.`;
    if (want.dur !== undefined && (t.dur == null || Math.abs(t.dur - want.dur) > 0.05)) return `La durée est ${t.dur ?? "absente"} s au lieu de ${want.dur} s.`;
    return true;
  },
});
export const noTransitionA = (slide, label) => ({ kind: "transition", label, test: (deck) => deck.slides[slide]?.transition === undefined ? { ok: true, skip: true } : !deck.slides[slide].transition || "Cette diapositive a encore une transition." });
export const animA = (slide, want, label) => ({
  kind: "anim", label,
  test(deck) {
    const s = deck.slides[slide];
    if (!s) return `Il n'y a pas de diapositive ${slide + 1}.`;
    if (s.anims === undefined) return { ok: true, skip: true };
    const hits = s.anims.filter((a) => (want.cls ? a.cls === want.cls : true) && (want.target ? a.target === want.target : true));
    const n = want.count ?? 1;
    return hits.length >= n || (hits.length ? `Il y a ${hits.length} animation(s) de ce type, il en faut ${n}.` : "Je ne trouve pas cette animation.");
  },
});

// Étape que PowerPoint ne laisse pas lire : l'élève confirme lui-même.
export const confirmA = (id, label) => ({ kind: "confirm", id, label, test: (_d, ctx) => !!ctx?.confirmed?.[id] || "Fais-le dans PowerPoint, puis clique sur « C'est fait »." });

// ───── fabrique d'exercice ─────
export function mk(ex) {
  if (!ex.id || !ex.title || !ex.story) throw new Error("Exercice incomplet : " + (ex.id ?? "?"));
  return {
    track: "base", level: 1, xp: 15, setup: [], answers: [], steps: [], hint: "", ...ex,
  };
}

export { GEOS, hex };
