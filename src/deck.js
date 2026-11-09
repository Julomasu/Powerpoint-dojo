// Modèle de présentation « virtuel » + simulateur d'opérations.
//
// Un exercice décrit son état de départ (`setup`) et sa solution (`sol`) avec une petite liste d'opérations JSON.
// Les mêmes opérations sont :
//   - jouées ici, en JS pur, par `npm run verify` (solution => le correcteur doit être satisfait) ;
//   - jouées dans le vrai PowerPoint par src/ppt.js (écriture de l'exercice et bouton « Solution ») ;
//   - écrites dans un .pptx par src/pptx.js (mode fichier).
// Le correcteur ne voit jamais que ce modèle : `readDeck()` (PowerPoint) et `readPptx()` (mode fichier) le produisent.
//
// Unités : points (1 pt = 1/72 pouce). Une diapositive 16:9 fait 960 × 540 pt (13,333 × 7,5 pouces).

export const SLIDE_W = 960;
export const SLIDE_H = 540;

// Mises en page : clé interne → nom affiché, type OOXML, espaces réservés (position par défaut)
export const LAYOUTS = {
  title: { name: "Diapositive de titre", ooxml: "title", ph: [["title", 120, 88.4, 720, 188], ["subtitle", 120, 283.7, 720, 130.5]] },
  content: { name: "Titre et contenu", ooxml: "obj", ph: [["title", 66, 28.75, 828, 104.4], ["body", 66, 143.75, 828, 343.1]] },
  section: { name: "En-tête de section", ooxml: "secHead", ph: [["title", 68, 134.7, 828, 224.6], ["body", 68, 361.4, 828, 118.1]] },
  two: { name: "Deux contenus", ooxml: "twoObj", ph: [["title", 66, 28.75, 828, 104.4], ["body", 66, 143.75, 406, 343.1], ["body", 488, 143.75, 406, 343.1]] },
  titleOnly: { name: "Titre seul", ooxml: "titleOnly", ph: [["title", 66, 28.75, 828, 104.4]] },
  blank: { name: "Vide", ooxml: "blank", ph: [] },
};
export const layoutByOoxml = (t) => Object.keys(LAYOUTS).find((k) => LAYOUTS[k].ooxml === t) ?? "blank";

const PH_NAMES = { title: "Titre", subtitle: "Sous-titre", body: "Espace réservé du contenu" };

// Formes géométriques connues (clé → préréglage OOXML)
export const GEOS = { rect: "rect", roundRect: "roundRect", ellipse: "ellipse", triangle: "triangle", diamond: "diamond", arrowRight: "rightArrow", chevron: "chevron", star: "star5", line: "line", text: "rect" };

// ───── couleurs ─────
export const hex = (c) => {
  if (c == null || c === "") return null;
  let s = String(c).trim().replace(/^#/, "");
  if (/^[0-9a-f]{3}$/i.test(s)) s = s.split("").map((x) => x + x).join("");
  return /^[0-9a-f]{6}$/i.test(s) ? "#" + s.toUpperCase() : null;
};
export const rgb = (c) => {
  const h = hex(c);
  return h ? [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)) : null;
};
export const colorDist = (a, b) => {
  const x = rgb(a), y = rgb(b);
  return x && y ? Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2]) : Infinity;
};
const lin = (v) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
export const luminance = (c) => {
  const [r, g, b] = rgb(c) ?? [0, 0, 0];
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
};
// rapport de contraste WCAG (1 à 21)
export const contrast = (a, b) => {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
};

// ───── présentation vide ─────
export const blankDeck = () => ({ slideW: SLIDE_W, slideH: SLIDE_H, slides: [], nextId: 2 });

let uid = 0;
const newSlide = (layout = "blank") => ({ id: ++uid, layout, shapes: [], notes: "", bg: null, hidden: false, transition: null, anims: [] });

const SHAPE_DEFAULTS = { text: "", fill: null, lineColor: null, lineWeight: null, fontName: "Calibri", fontSize: 18, bold: false, italic: false, underline: false, color: "#000000", align: "left", valign: "top", alt: "", rot: 0, group: null, link: null, visible: true, z: 0 };

function makeShape(deck, o) {
  const kind = o.kind ?? "rect";
  const isText = kind === "text";
  const s = {
    ...SHAPE_DEFAULTS,
    ...(isText ? {} : { fill: "#4472C4", color: "#FFFFFF", align: "center", valign: "middle" }),
    ...(kind === "line" ? { lineColor: "#4472C4", lineWeight: 1.5, color: "#000000" } : {}),
    ...(kind === "table" ? { rows: 2, cols: 2, values: [["", ""], ["", ""]], color: "#000000", fill: null } : {}),
    ...o,
    kind,
    id: deck.nextId++,
  };
  if (!o.name) s.name = defaultName(kind, s.id);
  for (const k of ["fill", "lineColor", "color"]) if (s[k] !== null && s[k] !== undefined) s[k] = hex(s[k]);
  if (kind === "table") {
    s.values = Array.from({ length: s.rows }, (_, r) => Array.from({ length: s.cols }, (_, c) => String(s.values?.[r]?.[c] ?? "")));
  }
  return s;
}
const KIND_NAMES = { rect: "Rectangle", roundRect: "Rectangle : coins arrondis", ellipse: "Ellipse", triangle: "Triangle isocèle", diamond: "Losange", arrowRight: "Flèche : droite", chevron: "Chevron", star: "Étoile : 5 branches", line: "Connecteur droit", text: "ZoneTexte", table: "Tableau", image: "Image", chart: "Graphique", smartart: "Diagramme", graphic: "Graphique SVG", media: "Média", model3d: "Modèle 3D" };
const defaultName = (kind, id) => `${KIND_NAMES[kind] ?? "Forme"} ${id}`;

function addPlaceholders(deck, slide, layout) {
  const L = LAYOUTS[layout];
  let n = 0;
  for (const [ph, left, top, width, height] of L.ph) {
    const s = makeShape(deck, { kind: "text", ph, name: `${PH_NAMES[ph]} ${++n}`, left, top, width, height, fontSize: ph === "title" ? 44 : ph === "subtitle" ? 24 : 28, align: layout === "title" || layout === "section" ? (ph === "title" ? "center" : "center") : "left", valign: ph === "title" ? "middle" : "top" });
    slide.shapes.push(s);
  }
}

// ───── sélection d'une forme ─────
// sel : "Nom" | { name } | { ph } | { text } | { kind } | { nth } ; `nth` compte les formes hors espaces réservés
export function findShapes(slide, sel) {
  if (typeof sel === "string") sel = { name: sel };
  let list = slide.shapes;
  if (sel.name != null) list = list.filter((s) => s.name === sel.name);
  if (sel.ph != null) list = list.filter((s) => s.ph === sel.ph);
  if (sel.text != null) list = list.filter((s) => (sel.text instanceof RegExp ? sel.text.test(s.text) : s.text === sel.text));
  // PowerPoint ne dit pas la géométrie d'une forme (rectangle, ellipse…) : une forme lue « shape » vaut pour toutes
  if (sel.kind != null) list = list.filter((s) => s.kind === sel.kind || (s.kind === "shape" && sel.kind in GEOS && sel.kind !== "text" && sel.kind !== "line"));
  if (sel.group != null) list = list.filter((s) => s.group === sel.group);
  if (sel.idx != null) list = [list[sel.idx]].filter(Boolean); // n-ième parmi celles qui répondent aux autres critères (0 = première)
  if (sel.nth != null) list = [slide.shapes.filter((s) => !s.ph)[sel.nth]].filter(Boolean);
  return list;
}
export const findShape = (slide, sel) => findShapes(slide, sel)[0];

const PROP_KEYS = ["name", "text", "left", "top", "width", "height", "fill", "lineColor", "lineWeight", "fontName", "fontSize", "bold", "italic", "underline", "color", "align", "valign", "alt", "rot", "link", "values", "visible", "rows", "cols"];

function applyProps(s, props) {
  for (const [k, v] of Object.entries(props)) {
    if (!PROP_KEYS.includes(k)) throw new Error("Propriété inconnue : " + k);
    s[k] = ["fill", "lineColor", "color"].includes(k) ? hex(v) : v;
  }
  if (props.values) {
    s.rows = props.values.length;
    s.cols = props.values[0].length;
  }
}

function reindexZ(slide) {
  slide.shapes.forEach((s, i) => (s.z = i));
}

// ───── opérations ─────
// Chaque opération vise une diapositive par son rang (0 = première) : `s`.
export function applyOp(deck, op) {
  const sl = () => {
    const x = deck.slides[op.s];
    if (!x) throw new Error(`Diapositive ${op.s} introuvable (opération ${op.op})`);
    return x;
  };
  const target = () => {
    const x = findShape(sl(), op.sel);
    if (!x) throw new Error(`Forme introuvable : ${JSON.stringify(op.sel)} (diapositive ${op.s})`);
    return x;
  };
  switch (op.op) {
    case "size":
      deck.slideW = op.w;
      deck.slideH = op.h;
      break;
    case "slide": {
      const s = newSlide(op.layout ?? "blank");
      if (op.bg) s.bg = hex(op.bg);
      if (op.notes) s.notes = op.notes;
      deck.slides.splice(op.at ?? deck.slides.length, 0, s);
      addPlaceholders(deck, s, s.layout);
      if (op.title != null) findShape(s, { ph: "title" }).text = op.title;
      if (op.body != null) {
        const b = findShapes(s, { ph: "body" })[0] ?? findShape(s, { ph: "subtitle" });
        if (b) b.text = Array.isArray(op.body) ? op.body.join("\n") : op.body;
      }
      reindexZ(s);
      break;
    }
    case "add": {
      const s = sl();
      const shape = makeShape(deck, op.shape);
      s.shapes.push(shape);
      reindexZ(s);
      break;
    }
    case "set":
      applyProps(target(), op.props);
      break;
    case "del": {
      const s = sl(), t = target();
      s.shapes.splice(s.shapes.indexOf(t), 1);
      reindexZ(s);
      break;
    }
    case "delSlide":
      sl();
      deck.slides.splice(op.s, 1);
      break;
    case "dupSlide": {
      const src = sl();
      const copy = JSON.parse(JSON.stringify(src));
      copy.id = ++uid;
      for (const x of copy.shapes) x.id = deck.nextId++;
      deck.slides.splice(op.s + 1, 0, copy);
      break;
    }
    case "moveSlide": {
      const [x] = deck.slides.splice(op.from, 1);
      deck.slides.splice(op.to, 0, x);
      break;
    }
    case "layout": {
      const s = sl();
      s.layout = op.layout;
      // les espaces réservés sans texte disparaissent, les autres sont conservés (comme PowerPoint)
      s.shapes = s.shapes.filter((x) => !x.ph || x.text);
      const have = new Set(s.shapes.filter((x) => x.ph).map((x) => x.ph));
      const tmp = { ...deck, nextId: deck.nextId };
      const probe = { shapes: [] };
      addPlaceholders(tmp, probe, op.layout);
      deck.nextId = tmp.nextId;
      s.shapes = [...probe.shapes.filter((x) => !have.has(x.ph)), ...s.shapes];
      reindexZ(s);
      break;
    }
    case "transition":
      sl().transition = op.effect ? { effect: op.effect, advClick: op.advClick !== false, advTime: op.advTime ?? null, dur: op.dur ?? null } : null;
      break;
    case "anim": {
      const s = sl(), t = target();
      s.anims.push({ cls: op.cls, preset: op.preset ?? 0, target: t.name });
      break;
    }
    case "notes":
      sl().notes = op.text;
      break;
    case "bg":
      sl().bg = hex(op.color);
      break;
    case "hide":
      sl().hidden = op.hidden !== false;
      break;
    case "group": {
      const s = sl();
      const members = op.sels.map((q) => {
        const x = findShape(s, q);
        if (!x) throw new Error("Forme à grouper introuvable : " + JSON.stringify(q));
        return x;
      });
      for (const m of members) m.group = op.name;
      break;
    }
    case "ungroup":
      for (const m of sl().shapes) if (m.group === op.name) m.group = null;
      break;
    case "z": {
      const s = sl(), t = target();
      s.shapes.splice(s.shapes.indexOf(t), 1);
      if (op.to === "front") s.shapes.push(t);
      else if (op.to === "back") s.shapes.unshift(t);
      else if (op.to === "forward") s.shapes.splice(Math.min(s.shapes.length, op.index), 0, t); // op.index = rang final voulu
      reindexZ(s);
      break;
    }
    default:
      throw new Error("Opération inconnue : " + op.op);
  }
  return deck;
}

export function runOps(ops, deck = blankDeck()) {
  for (const op of ops) applyOp(deck, op);
  return deck;
}

// copie profonde (le simulateur modifie en place)
export const cloneDeck = (d) => JSON.parse(JSON.stringify(d));

// ───── géométrie utilitaire (réutilisée par les exercices et les générateurs) ─────
export const bounds = (s) => ({ l: s.left, t: s.top, r: s.left + s.width, b: s.top + s.height, cx: s.left + s.width / 2, cy: s.top + s.height / 2 });
export const overlaps = (a, b) => {
  const x = bounds(a), y = bounds(b);
  return x.l < y.r - 0.5 && y.l < x.r - 0.5 && x.t < y.b - 0.5 && y.t < x.b - 0.5;
};
export const inside = (s, deck) => s.left >= -0.5 && s.top >= -0.5 && s.left + s.width <= deck.slideW + 0.5 && s.top + s.height <= deck.slideH + 0.5;

// Raccourcis pour écrire des opérations lisibles
export const O = {
  slide: (layout = "blank", extra = {}) => ({ op: "slide", layout, ...extra }),
  add: (s, shape) => ({ op: "add", s, shape }),
  set: (s, sel, props) => ({ op: "set", s, sel, props }),
  del: (s, sel) => ({ op: "del", s, sel }),
  box: (s, name, text, l, t, w, h, extra = {}) => ({ op: "add", s, shape: { kind: "text", name, text, left: l, top: t, width: w, height: h, ...extra } }),
  rect: (s, name, l, t, w, h, extra = {}) => ({ op: "add", s, shape: { kind: "rect", name, left: l, top: t, width: w, height: h, ...extra } }),
};
