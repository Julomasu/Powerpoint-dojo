// Pont avec le vrai PowerPoint (Office.js) : lire la présentation (readDeck) et jouer les opérations de deck.js (applyOps).
//
// ⚠ Écrit d'après la documentation officielle (learn.microsoft.com, PowerPointApi 1.1 → 1.10) mais PAS testé dans un vrai PowerPoint
// depuis l'environnement de développement : l'écran Diagnostic + le contrôle qualité (validate.js) servent à le vérifier.
// Règle : une propriété que cette version ne sait pas lire reste `undefined` dans le modèle, et le correcteur l'ignore.
import { LAYOUTS, GEOS, findShape, findShapes, blankDeck, hex } from "./deck.js";

export const hasOffice = () => typeof Office !== "undefined" && typeof PowerPoint !== "undefined";
export const supports = (v) => {
  try { return Office.context.requirements.isSetSupported("PowerPointApi", v); } catch { return false; }
};
export const run = (fn) => PowerPoint.run(fn);

// Mises en page : on retrouve la bonne par type (indépendant de la langue), sinon par nom, sinon par rang dans le masque Office
const LAYOUT_TYPES = { title: ["title", "titleslide"], content: ["object", "text", "titleandcontent"], section: ["sectionheader"], two: ["twoobjects", "twocolumntext", "twocontent"], titleOnly: ["titleonly"], blank: ["blank"] };
const LAYOUT_NAMES = { title: /diapositive de titre|title slide/i, content: /titre et contenu|title and content/i, section: /en-?t[êe]te de section|section header/i, two: /deux contenus|two content/i, titleOnly: /titre seul|title only/i, blank: /^(vide|blank)$/i };
const LAYOUT_RANK = { title: 0, content: 1, section: 2, two: 3, titleOnly: 5, blank: 6 };
const norm = (s) => String(s ?? "").toLowerCase().replace(/[^a-z]/g, "");

function layoutKeyOf(l) {
  const t = norm(l.type);
  for (const [k, list] of Object.entries(LAYOUT_TYPES)) if (list.includes(t)) return k;
  for (const [k, re] of Object.entries(LAYOUT_NAMES)) if (re.test(l.name ?? "")) return k;
  return undefined;
}

async function layoutsOf(ctx) {
  const m = ctx.presentation.slideMasters.getItemAt(0);
  m.load("id");
  m.layouts.load(supports("1.8") ? "items/id,items/name,items/type" : "items/id,items/name");
  await ctx.sync();
  return { masterId: m.id, items: m.layouts.items };
}
function pickLayout(L, key) {
  return L.items.find((l) => layoutKeyOf(l) === key) ?? L.items[LAYOUT_RANK[key]] ?? L.items[0];
}

// ───── lecture ─────
const TEXTY = new Set(["GeometricShape", "TextBox", "Placeholder", "Callout", "Freeform"]);
const ALIGN = { Left: "left", Center: "center", Right: "right", Justify: "justify", Distributed: "justify" };
const VALIGN = { Top: "top", Middle: "middle", Bottom: "bottom" };
const COARSE = { TextBox: "text", Placeholder: "text", GeometricShape: "shape", Line: "line", Table: "table", Image: "image", Group: "group", Chart: "chart", SmartArt: "smartart", Media: "media", Model3D: "model3d", Ink: "ink", Ole: "ole", Graphic: "graphic", Freeform: "shape", Callout: "shape" };
const PH_TYPE = { Title: "title", CenterTitle: "title", Subtitle: "subtitle", Body: "body", Content: "body", Object: "body" };

export async function readDeck() {
  return run(async (ctx) => {
    const v8 = supports("1.8"), v10 = supports("1.10");
    const deck = blankDeck();
    if (v10) {
      ctx.presentation.pageSetup.load("slideWidth,slideHeight");
    }
    const slides = ctx.presentation.slides;
    slides.load("items/id");
    await ctx.sync();
    if (v10) { deck.slideW = ctx.presentation.pageSetup.slideWidth; deck.slideH = ctx.presentation.pageSetup.slideHeight; }
    const lay = slides.items.map((s) => { s.layout.load(v8 ? "name,type" : "name"); return s.layout; });
    const bgs = v10 ? slides.items.map((s) => { s.background.load("areBackgroundGraphicsHidden,isMasterBackgroundFollowed"); s.background.fill.load("type"); return s.background; }) : [];
    slides.items.forEach((s) => s.shapes.load("items/id,items/name,items/type,items/left,items/top,items/width,items/height" + (v10 ? ",items/rotation,items/altTextDescription,items/visible" : "")));
    await ctx.sync();
    // second passage : le détail des formes qui portent du texte
    const jobs = [];
    slides.items.forEach((s, si) => {
      s.shapes.items.forEach((sh) => {
        const j = { si, sh };
        if (TEXTY.has(sh.type)) {
          sh.textFrame.load("verticalAlignment");
          sh.textFrame.textRange.load("text");
          sh.textFrame.textRange.font.load("name,size,bold,italic,underline,color");
          sh.textFrame.textRange.paragraphFormat.load("horizontalAlignment");
          sh.fill.load("type,foregroundColor");
          sh.lineFormat.load("color,weight,visible");
        }
        if (sh.type === "Line") sh.lineFormat.load("color,weight,visible");
        if (sh.type === "Placeholder" && v8) sh.placeholderFormat.load("type");
        if (sh.type === "Table" && v8) { const t = sh.getTable(); t.load("rowCount,columnCount,values"); j.t = t; }
        if (sh.type === "Group" && v8) { sh.group.shapes.load("items/id,items/name,items/type,items/left,items/top,items/width,items/height"); }
        jobs.push(j);
      });
    });
    const solid = [];
    bgs.forEach((b, i) => { if (b.fill.type === "Solid") { const f = b.fill.getSolidFillOrNullObject(); f.load("color"); solid[i] = f; } });
    await ctx.sync();
    slides.items.forEach((s, si) => {
      const sl = { id: s.id, layout: layoutKeyOf(lay[si]), shapes: [], notes: undefined, bg: undefined, hidden: undefined };
      if (v10) {
        const b = bgs[si];
        sl.bg = b.isMasterBackgroundFollowed ? null : solid[si] && !solid[si].isNullObject ? hex(solid[si].color) : undefined;
      }
      deck.slides.push(sl);
    });
    for (const { si, sh, t } of jobs) {
      const o = { id: Number(String(sh.id).replace(/\D/g, "")) || sh.id, name: sh.name, kind: COARSE[sh.type] ?? "shape", left: sh.left, top: sh.top, width: sh.width, height: sh.height, ps: sh.id };
      if (v10) { o.rot = sh.rotation; o.alt = sh.altTextDescription; }
      if (TEXTY.has(sh.type)) {
        const tr = sh.textFrame.textRange, f = tr.font;
        Object.assign(o, { text: tr.text, fontName: f.name, fontSize: f.size, bold: f.bold, italic: f.italic, underline: f.underline && f.underline !== "None", color: hex(f.color), align: ALIGN[tr.paragraphFormat.horizontalAlignment], valign: VALIGN[sh.textFrame.verticalAlignment] });
        o.fill = sh.fill.type === "NoFill" ? null : sh.fill.type === "Solid" ? hex(sh.fill.foregroundColor) : undefined;
        o.lineColor = sh.lineFormat.visible === false ? null : hex(sh.lineFormat.color);
        o.lineWeight = sh.lineFormat.visible === false ? null : sh.lineFormat.weight;
        if (sh.type === "Placeholder" && v8) o.ph = PH_TYPE[sh.placeholderFormat.type] ?? "other";
      } else if (sh.type === "Line") {
        o.lineColor = hex(sh.lineFormat.color);
        o.lineWeight = sh.lineFormat.weight;
      }
      if (t) { o.rows = t.rowCount; o.cols = t.columnCount; o.values = t.values; }
      const sl = deck.slides[si];
      if (sh.type === "Group" && v8) {
        for (const c of sh.group.shapes.items) {
          sl.shapes.push({ id: Number(String(c.id).replace(/\D/g, "")) || c.id, name: c.name, kind: COARSE[c.type] ?? "shape", left: c.left, top: c.top, width: c.width, height: c.height, ps: c.id, group: sh.name });
        }
      } else sl.shapes.push(o);
    }
    deck.slides.forEach((s) => s.shapes.forEach((x, i) => (x.z = i)));
    deck.nextId = 9999;
    return deck;
  });
}

// ───── écriture ─────
const GEO_TYPE = { rect: "Rectangle", roundRect: "RoundRectangle", ellipse: "Ellipse", triangle: "Triangle", diamond: "Diamond", arrowRight: "RightArrow", chevron: "Chevron", star: "Star5" };
const ALIGN_OUT = { left: "Left", center: "Center", right: "Right", justify: "Justify" };
const VALIGN_OUT = { top: "Top", middle: "Middle", bottom: "Bottom" };

function styleShape(sh, o) {
  const has = (k) => k in o && o[k] !== undefined;
  if (has("name")) sh.name = o.name;
  for (const k of ["left", "top", "width", "height"]) if (has(k)) sh[k] = o[k];
  if (has("rot") && supports("1.10")) sh.rotation = o.rot;
  if (has("alt") && supports("1.10")) sh.altTextDescription = o.alt;
  if (has("fill")) o.fill ? sh.fill.setSolidColor(o.fill) : sh.fill.clear();
  if (has("lineColor")) {
    if (o.lineColor === null) sh.lineFormat.visible = false;
    else { sh.lineFormat.visible = true; sh.lineFormat.color = o.lineColor; }
  }
  if (has("lineWeight") && o.lineWeight !== null) sh.lineFormat.weight = o.lineWeight;
  if (sh.type === "Line" || o.kind === "line" || o.kind === "table") return;
  const tr = sh.textFrame.textRange, f = tr.font;
  if (has("text")) tr.text = o.text;
  if (has("fontName")) f.name = o.fontName;
  if (has("fontSize")) f.size = o.fontSize;
  if (has("bold")) f.bold = o.bold;
  if (has("italic")) f.italic = o.italic;
  if (has("underline")) f.underline = o.underline ? "Single" : "None";
  if (has("color")) f.color = o.color;
  if (has("align")) tr.paragraphFormat.horizontalAlignment = ALIGN_OUT[o.align];
  if (has("valign")) sh.textFrame.verticalAlignment = VALIGN_OUT[o.valign];
}

// Joue des opérations. `off` = nombre de diapositives déjà présentes avant (le rang `s` d'une opération s'y ajoute).
export async function applyOps(ops, { off = 0 } = {}) {
  for (const op of ops) await applyOne(op, off);
}

async function applyOne(op, off) {
  return run(async (ctx) => {
    const slides = ctx.presentation.slides;
    slides.load("items/id");
    await ctx.sync();
    const slideAt = (i) => {
      const s = slides.items[i + off];
      if (!s) throw new Error(`Diapositive ${i} introuvable`);
      return s;
    };
    // retrouve une forme par sélecteur : on relit les formes de la diapositive (nom, type, texte)
    const find = async (sl, sel) => {
      sl.shapes.load("items/id,items/name,items/type");
      await ctx.sync();
      const model = { shapes: [] };
      const texty = sl.shapes.items.filter((x) => TEXTY.has(x.type));
      texty.forEach((x) => x.textFrame.textRange.load("text"));
      const phs = sl.shapes.items.filter((x) => x.type === "Placeholder" && supports("1.8"));
      phs.forEach((x) => x.placeholderFormat.load("type"));
      await ctx.sync();
      sl.shapes.items.forEach((x) => model.shapes.push({ name: x.name, kind: COARSE[x.type] ?? "shape", text: TEXTY.has(x.type) ? x.textFrame.textRange.text : "", ph: x.type === "Placeholder" && supports("1.8") ? PH_TYPE[x.placeholderFormat.type] : undefined, _s: x }));
      const hit = findShape(model, sel);
      if (!hit) throw new Error("Forme introuvable : " + JSON.stringify(sel));
      return hit._s;
    };
    switch (op.op) {
      case "size":
        if (supports("1.10")) { ctx.presentation.pageSetup.slideWidth = op.w; ctx.presentation.pageSetup.slideHeight = op.h; }
        break;
      case "slide": {
        const L = await layoutsOf(ctx);
        const lay = pickLayout(L, op.layout ?? "blank");
        const before = slides.items.length;
        slides.add({ layoutId: lay.id, slideMasterId: L.masterId });
        await ctx.sync();
        slides.load("items/id");
        await ctx.sync();
        const sl = slides.items[slides.items.length - 1];
        if (op.at != null && op.at < before && supports("1.8")) { sl.moveTo(op.at + off); await ctx.sync(); }
        if (op.bg && supports("1.10")) sl.background.fill.setSolidFill({ color: op.bg });
        if (op.title != null || op.body != null) {
          sl.shapes.load("items/name,items/type");
          await ctx.sync();
          const phs = sl.shapes.items.filter((x) => x.type === "Placeholder");
          phs.forEach((x) => x.placeholderFormat.load("type"));
          await ctx.sync();
          const by = (t) => phs.filter((x) => (PH_TYPE[x.placeholderFormat.type] ?? "") === t);
          if (op.title != null && by("title")[0]) by("title")[0].textFrame.textRange.text = op.title;
          const b = by("body")[0] ?? by("subtitle")[0];
          if (op.body != null && b) b.textFrame.textRange.text = Array.isArray(op.body) ? op.body.join("\n") : op.body;
        }
        break;
      }
      case "add": {
        const sl = slideAt(op.s), o = op.shape, k = o.kind ?? "rect";
        const box = { left: o.left, top: o.top, width: o.width, height: o.height };
        let sh;
        if (k === "text") sh = sl.shapes.addTextBox(o.text ?? "", box);
        else if (k === "line") sh = sl.shapes.addLine("Straight", box);
        else if (k === "table") sh = sl.shapes.addTable(o.rows, o.cols, { ...box, values: o.values });
        else sh = sl.shapes.addGeometricShape(GEO_TYPE[k] ?? "Rectangle", box);
        // pas de texte pour une table (déjà dans les valeurs) ; pour les autres on applique tout
        const { text, ...rest } = o;
        styleShape(sh, k === "table" ? { name: o.name } : k === "text" ? rest : { ...rest, text });
        if (k === "line") { if (o.lineColor) sh.lineFormat.color = o.lineColor; }
        if (k === "text" && o.fill === undefined) { /* zone de texte : sans remplissage par défaut */ }
        break;
      }
      case "set": {
        const sh = await find(slideAt(op.s), op.sel);
        styleShape(sh, op.props);
        break;
      }
      case "del":
        (await find(slideAt(op.s), op.sel)).delete();
        break;
      case "delSlide":
        slideAt(op.s).delete();
        break;
      case "dupSlide": {
        const sl = slideAt(op.s);
        const b64 = sl.exportAsBase64();
        await ctx.sync();
        ctx.presentation.insertSlidesFromBase64(b64.value, { formatting: "UseDestinationTheme", targetSlideId: sl.id });
        break;
      }
      case "moveSlide":
        slideAt(op.from).moveTo(op.to + off);
        break;
      case "layout": {
        const L = await layoutsOf(ctx);
        slideAt(op.s).applyLayout(pickLayout(L, op.layout));
        break;
      }
      case "bg":
        if (supports("1.10")) slideAt(op.s).background.fill.setSolidFill({ color: op.color });
        break;
      case "notes":
      case "hide":
        break; // pas d'API : l'élève confirme (confirmA) ; la Solution ne peut pas l'écrire
      case "group": {
        const sl = slideAt(op.s);
        const items = [];
        for (const q of op.sels) items.push(await find(sl, q));
        const g = sl.shapes.addGroup(items);
        g.name = op.name;
        break;
      }
      case "ungroup": {
        const sl = slideAt(op.s);
        sl.shapes.load("items/name,items/type");
        await ctx.sync();
        const g = sl.shapes.items.find((x) => x.name === op.name && x.type === "Group");
        if (g) g.group.ungroup();
        break;
      }
      case "z": {
        const sh = await find(slideAt(op.s), op.sel);
        sh.setZOrder(op.to === "front" ? "BringToFront" : "SendToBack");
        break;
      }
      default:
        throw new Error("Opération inconnue : " + op.op);
    }
    await ctx.sync();
  });
}

// Remet la présentation à zéro puis joue le départ de l'exercice. On crée d'abord une diapositive tampon (une présentation ne peut
// pas rester sans diapositive), on supprime toutes les autres, on joue `setup` avec un décalage de 1, puis on supprime le tampon.
export async function loadSetup(ops) {
  await run(async (ctx) => {
    const L = await layoutsOf(ctx);
    ctx.presentation.slides.add({ layoutId: pickLayout(L, "blank").id, slideMasterId: L.masterId });
    await ctx.sync();
    const slides = ctx.presentation.slides;
    slides.load("items/id");
    await ctx.sync();
    const keep = slides.items[slides.items.length - 1].id;
    slides.items.forEach((s) => s.id !== keep && s.delete());
    await ctx.sync();
  });
  await applyOps(ops, { off: 1 });
  await run(async (ctx) => {
    ctx.presentation.slides.getItemAt(0).delete();
    await ctx.sync();
    try { ctx.presentation.slides.getItemAt(0).exportAsBase64; } catch { /* rien */ }
  });
}
export { LAYOUTS, GEOS, findShapes };

// ───── sécurité : ne pas écraser la présentation de travail de l'élève ─────
// Le Dojo REMPLACE le contenu de la présentation ouverte à chaque exercice. On marque donc « sa » présentation avec une balise ;
// si la présentation ouverte n'est pas marquée et contient déjà du travail, l'interface demande confirmation (une seule fois).
const TAG = "PPTDOJO";
export async function isDojoDeck() {
  if (!supports("1.3")) return false;
  return run(async (ctx) => {
    const t = ctx.presentation.tags.getItemOrNullObject(TAG);
    t.load("key");
    await ctx.sync();
    return !t.isNullObject;
  });
}
export async function markDojoDeck() {
  if (!supports("1.3")) return;
  await run(async (ctx) => {
    ctx.presentation.tags.add(TAG, "1");
    await ctx.sync();
  });
}
export async function deckHasWork() {
  return run(async (ctx) => {
    const slides = ctx.presentation.slides;
    slides.load("items/id");
    await ctx.sync();
    if (slides.items.length > 1) return true;
    if (!slides.items.length) return false;
    const sh = slides.items[0].shapes;
    sh.load("items/type,items/name");
    await ctx.sync();
    const texts = sh.items.filter((x) => x.type === "Placeholder" || x.type === "TextBox" || x.type === "GeometricShape");
    texts.forEach((x) => x.textFrame.textRange.load("text"));
    await ctx.sync();
    return sh.items.some((x) => !["Placeholder", "TextBox", "GeometricShape"].includes(x.type)) || texts.some((x) => x.textFrame.textRange.text.trim());
  });
}
