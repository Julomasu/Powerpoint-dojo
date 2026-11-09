// Mode fichier : écrit le modèle de présentation dans un .pptx (writePptx) et relit un .pptx déposé par l'élève (readPptx).
// Écrit à la main (JSZip pour le zip, xml.js pour la lecture) : pas de bibliothèque PowerPoint.
// ⚠ Non testé dans un vrai PowerPoint depuis l'environnement de développement (voir CLAUDE.md) ; contrôlé par `npm run verify`
// (aller-retour écriture → lecture) et par LibreOffice.
import JSZip from "jszip";
import { LAYOUTS, GEOS, blankDeck, layoutByOoxml, hex } from "./deck.js";
import { parse, kid, kids, path, descend, esc } from "./xml.js";

const EMU = 12700;
const NS = 'xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"';
const HEAD = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
const e = (pt) => Math.round(pt * EMU);

// ───── écriture ─────
const PH_XML = { title: 'type="title"', subtitle: 'type="subTitle" idx="1"' };
const phAttr = (ph, i, layout) => (ph === "title" ? PH_XML.title : ph === "subtitle" ? PH_XML.subtitle : `idx="${layout === "two" ? i : 1}"`);

const fillXml = (c) => (c ? `<a:solidFill><a:srgbClr val="${c.slice(1)}"/></a:solidFill>` : "<a:noFill/>");

function paragraphs(s) {
  const lines = String(s.text ?? "").split("\n");
  const rpr = `<a:rPr lang="fr-FR" sz="${Math.round((s.fontSize ?? 18) * 100)}" b="${s.bold ? 1 : 0}" i="${s.italic ? 1 : 0}" u="${s.underline ? "sng" : "none"}" dirty="0">${s.color ? fillXml(s.color) : ""}<a:latin typeface="${esc(s.fontName ?? "Calibri")}"/></a:rPr>`;
  const algn = { left: "l", center: "ctr", right: "r", justify: "just" }[s.align ?? "left"] ?? "l";
  return lines.map((t) => `<a:p><a:pPr algn="${algn}"/>${t ? `<a:r>${rpr}<a:t>${esc(t)}</a:t></a:r>` : ""}<a:endParaRPr lang="fr-FR" sz="${Math.round((s.fontSize ?? 18) * 100)}"/></a:p>`).join("");
}

function spXml(s, i, layout) {
  const xfrm = `<a:xfrm${s.rot ? ` rot="${Math.round(s.rot * 60000)}"` : ""}><a:off x="${e(s.left)}" y="${e(s.top)}"/><a:ext cx="${e(s.width)}" cy="${e(s.height)}"/></a:xfrm>`;
  const nv = (cNvSp) => `<p:cNvPr id="${s.id}" name="${esc(s.name)}"${s.alt ? ` descr="${esc(s.alt)}"` : ""}${s.visible === false ? ' hidden="1"' : ""}/>${cNvSp}`;
  if (s.kind === "line") {
    return `<p:cxnSp><p:nvCxnSpPr>${nv("<p:cNvCxnSpPr/>")}<p:nvPr/></p:nvCxnSpPr><p:spPr>${xfrm}<a:prstGeom prst="line"><a:avLst/></a:prstGeom><a:ln w="${e(s.lineWeight ?? 1.5)}">${fillXml(s.lineColor ?? "#4472C4")}</a:ln></p:spPr></p:cxnSp>`;
  }
  if (s.kind === "table") {
    const cw = Math.round(e(s.width) / s.cols), rh = Math.round(e(s.height) / s.rows);
    const rows = s.values.map((r) => `<a:tr h="${rh}">${r.map((v) => `<a:tc><a:txBody><a:bodyPr/><a:lstStyle/>${paragraphs({ ...s, text: v, fontSize: s.fontSize ?? 18 })}</a:txBody><a:tcPr/></a:tc>`).join("")}</a:tr>`).join("");
    return `<p:graphicFrame><p:nvGraphicFramePr>${nv('<p:cNvGraphicFramePr><a:graphicFrameLocks noGrp="1"/></p:cNvGraphicFramePr>')}<p:nvPr/></p:nvGraphicFramePr><p:xfrm><a:off x="${e(s.left)}" y="${e(s.top)}"/><a:ext cx="${e(s.width)}" cy="${e(s.height)}"/></p:xfrm><a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/table"><a:tbl><a:tblPr firstRow="1" bandRow="1"/><a:tblGrid>${Array.from({ length: s.cols }, () => `<a:gridCol w="${cw}"/>`).join("")}</a:tblGrid>${rows}</a:tbl></a:graphicData></a:graphic></p:graphicFrame>`;
  }
  if (["chart", "smartart", "graphic", "media", "model3d", "image"].includes(s.kind)) {
    // simples repères (non ouvrables dans PowerPoint) : seul `npm run verify` les utilise ; l'élève n'en reçoit jamais dans un départ
    const uri = { chart: "http://schemas.openxmlformats.org/drawingml/2006/chart", smartart: "http://schemas.openxmlformats.org/drawingml/2006/diagram" }[s.kind] ?? "urn:dojo:" + s.kind;
    return `<p:graphicFrame><p:nvGraphicFramePr>${nv("<p:cNvGraphicFramePr/>")}<p:nvPr/></p:nvGraphicFramePr><p:xfrm><a:off x="${e(s.left)}" y="${e(s.top)}"/><a:ext cx="${e(s.width)}" cy="${e(s.height)}"/></p:xfrm><a:graphic><a:graphicData uri="${uri}"/></a:graphic></p:graphicFrame>`;
  }
  const ph = s.ph ? `<p:ph ${phAttr(s.ph, i, layout)}/>` : "";
  const anchor = { top: "t", middle: "ctr", bottom: "b" }[s.valign ?? "top"] ?? "t";
  const geo = GEOS[s.kind] ?? "rect";
  const sp = s.ph
    ? `<p:spPr>${xfrm}</p:spPr>`
    : `<p:spPr>${xfrm}<a:prstGeom prst="${geo}"><a:avLst/></a:prstGeom>${fillXml(s.fill)}${s.lineColor ? `<a:ln w="${e(s.lineWeight ?? 1)}">${fillXml(s.lineColor)}</a:ln>` : "<a:ln><a:noFill/></a:ln>"}</p:spPr>`;
  return `<p:sp><p:nvSpPr>${nv(`<p:cNvSpPr${s.kind === "text" && !s.ph ? ' txBox="1"' : ""}/>`)}<p:nvPr>${ph}</p:nvPr></p:nvSpPr>${sp}<p:txBody><a:bodyPr wrap="square" lIns="91440" tIns="45720" rIns="91440" bIns="45720" rtlCol="0" anchor="${anchor}"><a:noAutofit/></a:bodyPr><a:lstStyle/>${paragraphs(s)}</p:txBody></p:sp>`;
}

function grpXml(name, members, id, i, layout) {
  const l = Math.min(...members.map((m) => m.left)), t = Math.min(...members.map((m) => m.top));
  const r = Math.max(...members.map((m) => m.left + m.width)), b = Math.max(...members.map((m) => m.top + m.height));
  const x = `<a:off x="${e(l)}" y="${e(t)}"/><a:ext cx="${e(r - l)}" cy="${e(b - t)}"/><a:chOff x="${e(l)}" y="${e(t)}"/><a:chExt cx="${e(r - l)}" cy="${e(b - t)}"/>`;
  return `<p:grpSp><p:nvGrpSpPr><p:cNvPr id="${id}" name="${esc(name)}"/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm>${x}</a:xfrm></p:grpSpPr>${members.map((m) => spXml(m, i, layout)).join("")}</p:grpSp>`;
}

const TREE_HEAD = '<p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>';

function transitionXml(t) {
  if (!t) return "";
  const attrs = `${t.advClick === false ? ' advClick="0"' : ""}${t.advTime != null ? ` advTm="${Math.round(t.advTime * 1000)}"` : ""}`;
  return `<p:transition spd="med"${attrs}><p:${t.effect}/></p:transition>`;
}

function slideXml(sl) {
  const out = [];
  const done = new Set();
  let bodyIdx = 0;
  let gid = 9000;
  for (const s of sl.shapes) {
    if (done.has(s.id)) continue;
    if (s.group) {
      const members = sl.shapes.filter((x) => x.group === s.group);
      members.forEach((m) => done.add(m.id));
      out.push(grpXml(s.group, members, ++gid, 1, sl.layout));
    } else {
      done.add(s.id);
      out.push(spXml(s, s.ph === "body" ? ++bodyIdx : 1, sl.layout));
    }
  }
  const bg = sl.bg ? `<p:bg><p:bgPr>${fillXml(sl.bg)}<a:effectLst/></p:bgPr></p:bg>` : "";
  return `${HEAD}<p:sld ${NS}${sl.hidden ? ' show="0"' : ""}><p:cSld>${bg}<p:spTree>${TREE_HEAD}${out.join("")}</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>${transitionXml(sl.transition)}</p:sld>`;
}

const THEME = `${HEAD}<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="Dojo"><a:themeElements><a:clrScheme name="Dojo"><a:dk1><a:sysClr val="windowText" lastClr="000000"/></a:dk1><a:lt1><a:sysClr val="window" lastClr="FFFFFF"/></a:lt1><a:dk2><a:srgbClr val="44546A"/></a:dk2><a:lt2><a:srgbClr val="E7E6E6"/></a:lt2><a:accent1><a:srgbClr val="4472C4"/></a:accent1><a:accent2><a:srgbClr val="ED7D31"/></a:accent2><a:accent3><a:srgbClr val="A5A5A5"/></a:accent3><a:accent4><a:srgbClr val="FFC000"/></a:accent4><a:accent5><a:srgbClr val="5B9BD5"/></a:accent5><a:accent6><a:srgbClr val="70AD47"/></a:accent6><a:hlink><a:srgbClr val="0563C1"/></a:hlink><a:folHlink><a:srgbClr val="954F72"/></a:folHlink></a:clrScheme><a:fontScheme name="Dojo"><a:majorFont><a:latin typeface="Calibri Light"/><a:ea typeface=""/><a:cs typeface=""/></a:majorFont><a:minorFont><a:latin typeface="Calibri"/><a:ea typeface=""/><a:cs typeface=""/></a:minorFont></a:fontScheme><a:fmtScheme name="Dojo"><a:fillStyleLst>${'<a:solidFill><a:schemeClr val="phClr"/></a:solidFill>'.repeat(3)}</a:fillStyleLst><a:lnStyleLst>${'<a:ln w="6350"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln>'.repeat(3)}</a:lnStyleLst><a:effectStyleLst>${"<a:effectStyle><a:effectLst/></a:effectStyle>".repeat(3)}</a:effectStyleLst><a:bgFillStyleLst>${'<a:solidFill><a:schemeClr val="phClr"/></a:solidFill>'.repeat(3)}</a:bgFillStyleLst></a:fmtScheme></a:themeElements></a:theme>`;

const phShape = (id, name, attr, [l, t, w, h], extra = "") =>
  `<p:sp><p:nvSpPr><p:cNvPr id="${id}" name="${name}"/><p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr><p:nvPr><p:ph ${attr}/></p:nvPr></p:nvSpPr><p:spPr><a:xfrm><a:off x="${e(l)}" y="${e(t)}"/><a:ext cx="${e(w)}" cy="${e(h)}"/></a:xfrm></p:spPr><p:txBody><a:bodyPr/><a:lstStyle/><a:p><a:endParaRPr lang="fr-FR"/></a:p></p:txBody></p:sp>`;

const REL = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";
const rels = (list) => `${HEAD}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${list.map(([id, type, target]) => `<Relationship Id="${id}" Type="${REL}/${type}" Target="${target}"/>`).join("")}</Relationships>`;

export async function writePptx(deck, { format = "uint8array" } = {}) {
  const zip = new JSZip();
  const keys = Object.keys(LAYOUTS);
  const ct = [
    '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>',
    '<Default Extension="xml" ContentType="application/xml"/>',
    '<Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>',
    '<Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/>',
    '<Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>',
    ...keys.map((_, i) => `<Override PartName="/ppt/slideLayouts/slideLayout${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/>`),
    ...deck.slides.map((_, i) => `<Override PartName="/ppt/slides/slide${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>`),
  ];
  zip.file("[Content_Types].xml", `${HEAD}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">${ct.join("")}</Types>`);
  zip.file("_rels/.rels", rels([["rId1", "officeDocument", "ppt/presentation.xml"]]));
  zip.file("ppt/presentation.xml", `${HEAD}<p:presentation ${NS} saveSubsetFonts="1"><p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rId1"/></p:sldMasterIdLst><p:sldIdLst>${deck.slides.map((_, i) => `<p:sldId id="${256 + i}" r:id="rId${i + 3}"/>`).join("")}</p:sldIdLst><p:sldSz cx="${e(deck.slideW)}" cy="${e(deck.slideH)}"/><p:notesSz cx="6858000" cy="9144000"/></p:presentation>`);
  zip.file("ppt/_rels/presentation.xml.rels", rels([["rId1", "slideMaster", "slideMasters/slideMaster1.xml"], ["rId2", "theme", "theme/theme1.xml"], ...deck.slides.map((_, i) => [`rId${i + 3}`, "slide", `slides/slide${i + 1}.xml`])]));
  zip.file("ppt/theme/theme1.xml", THEME);
  // masque
  const masterTree = phShape(2, "Titre 1", 'type="title"', [66, 28.75, 828, 104.4]) + phShape(3, "Espace réservé du texte 2", 'type="body" idx="1"', [66, 143.75, 828, 343.1]);
  zip.file("ppt/slideMasters/slideMaster1.xml", `${HEAD}<p:sldMaster ${NS}><p:cSld><p:bg><p:bgRef idx="1001"><a:schemeClr val="bg1"/></p:bgRef></p:bg><p:spTree>${TREE_HEAD}${masterTree}</p:spTree></p:cSld><p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/><p:sldLayoutIdLst>${keys.map((_, i) => `<p:sldLayoutId id="${2147483649 + i}" r:id="rId${i + 1}"/>`).join("")}</p:sldLayoutIdLst><p:txStyles><p:titleStyle><a:lvl1pPr algn="l"><a:defRPr sz="4400"><a:solidFill><a:schemeClr val="tx1"/></a:solidFill><a:latin typeface="+mj-lt"/></a:defRPr></a:lvl1pPr></p:titleStyle><p:bodyStyle><a:lvl1pPr marL="342900" indent="-342900"><a:buFont typeface="Arial"/><a:buChar char="•"/><a:defRPr sz="2800"><a:solidFill><a:schemeClr val="tx1"/></a:solidFill><a:latin typeface="+mn-lt"/></a:defRPr></a:lvl1pPr></p:bodyStyle><p:otherStyle><a:defPPr><a:defRPr lang="fr-FR"/></a:defPPr></p:otherStyle></p:txStyles></p:sldMaster>`);
  zip.file("ppt/slideMasters/_rels/slideMaster1.xml.rels", rels([...keys.map((_, i) => [`rId${i + 1}`, "slideLayout", `../slideLayouts/slideLayout${i + 1}.xml`]), [`rId${keys.length + 1}`, "theme", "../theme/theme1.xml"]]));
  keys.forEach((k, i) => {
    const L = LAYOUTS[k];
    let bodyN = 0;
    const tree = L.ph.map(([ph, l, t, w, h], j) => phShape(j + 2, `${ph} ${j + 1}`, phAttr(ph, ph === "body" ? ++bodyN : 1, k), [l, t, w, h])).join("");
    zip.file(`ppt/slideLayouts/slideLayout${i + 1}.xml`, `${HEAD}<p:sldLayout ${NS} type="${L.ooxml}" preserve="1"><p:cSld name="${esc(L.name)}"><p:spTree>${TREE_HEAD}${tree}</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sldLayout>`);
    zip.file(`ppt/slideLayouts/_rels/slideLayout${i + 1}.xml.rels`, rels([["rId1", "slideMaster", "../slideMasters/slideMaster1.xml"]]));
  });
  deck.slides.forEach((sl, i) => {
    zip.file(`ppt/slides/slide${i + 1}.xml`, slideXml(sl));
    zip.file(`ppt/slides/_rels/slide${i + 1}.xml.rels`, rels([["rId1", "slideLayout", `../slideLayouts/slideLayout${keys.indexOf(sl.layout) + 1 || keys.length}.xml`]]));
  });
  return zip.generateAsync({ type: format, mimeType: "application/vnd.openxmlformats-officedocument.presentationml.presentation", compression: "DEFLATE" });
}

// ───── lecture ─────
const SCHEME_ALIAS = { tx1: "dk1", bg1: "lt1", tx2: "dk2", bg2: "lt2" };

function colorOf(fillNode, theme) {
  // renvoie "#RRGGBB", null (aucun remplissage) ou undefined (illisible : dégradé, couleur transformée…)
  if (!fillNode) return undefined;
  if (fillNode.tag === "a:noFill") return null;
  if (fillNode.tag !== "a:solidFill") return undefined;
  const c = fillNode.kids[0];
  if (!c) return undefined;
  if (c.kids.length) return undefined; // lumMod, tint… : on ne sait pas calculer
  if (c.tag === "a:srgbClr") return hex(c.attrs.val);
  if (c.tag === "a:schemeClr") return theme[SCHEME_ALIAS[c.attrs.val] ?? c.attrs.val];
  if (c.tag === "a:sysClr") return hex(c.attrs.lastClr);
  return undefined;
}

function themeColors(root) {
  const out = {};
  const scheme = path(root, "a:themeElements/a:clrScheme");
  for (const c of scheme?.kids ?? []) {
    const v = c.kids[0];
    if (v) out[c.tag.replace("a:", "")] = hex(v.attrs.val ?? v.attrs.lastClr);
  }
  return out;
}

function textOf(tx) {
  if (!tx) return { text: "" };
  const ps = kids(tx, "a:p");
  const lines = ps.map((p) => p.kids.filter((k) => k.tag === "a:r" || k.tag === "a:br" || k.tag === "a:fld").map((r) => (r.tag === "a:br" ? "\n" : kid(r, "a:t")?.text ?? "")).join(""));
  return { text: lines.join("\n"), ps };
}

function fontOf(tx, theme) {
  const run = descend(tx, "a:r")[0];
  const rpr = run ? kid(run, "a:rPr") : undefined;
  const ppr = tx && kid(kids(tx, "a:p")[0], "a:pPr");
  const out = {};
  if (rpr) {
    if (rpr.attrs.sz) out.fontSize = +rpr.attrs.sz / 100;
    out.bold = rpr.attrs.b === "1" || rpr.attrs.b === "true";
    out.italic = rpr.attrs.i === "1" || rpr.attrs.i === "true";
    out.underline = !!rpr.attrs.u && rpr.attrs.u !== "none";
    const lat = kid(rpr, "a:latin");
    if (lat && !lat.attrs.typeface.startsWith("+")) out.fontName = lat.attrs.typeface;
    const fill = rpr.kids.find((k) => k.tag === "a:solidFill" || k.tag === "a:noFill");
    if (fill) out.color = colorOf(fill, theme);
  }
  if (ppr?.attrs.algn) out.align = { l: "left", ctr: "center", r: "right", just: "justify" }[ppr.attrs.algn] ?? undefined;
  return out;
}

function xfrmOf(x) {
  if (!x) return {};
  const off = kid(x, "a:off"), ext = kid(x, "a:ext");
  if (!off || !ext) return {};
  return { left: +off.attrs.x / EMU, top: +off.attrs.y / EMU, width: +ext.attrs.cx / EMU, height: +ext.attrs.cy / EMU, rot: x.attrs.rot ? +x.attrs.rot / 60000 : 0 };
}

function readShape(node, ctx, group = null) {
  const tag = node.tag;
  const nv = kid(node, tag === "p:sp" ? "p:nvSpPr" : tag === "p:cxnSp" ? "p:nvCxnSpPr" : tag === "p:pic" ? "p:nvPicPr" : "p:nvGraphicFramePr");
  const c = kid(nv, "p:cNvPr");
  const ph = path(nv, "p:nvPr/p:ph");
  const s = { id: +c.attrs.id, name: c.attrs.name, alt: c.attrs.descr ?? "", group, visible: c.attrs.hidden !== "1" };
  if (tag === "p:cxnSp") {
    const sp = kid(node, "p:spPr");
    Object.assign(s, { kind: "line" }, xfrmOf(kid(sp, "a:xfrm")));
    const ln = kid(sp, "a:ln");
    s.lineColor = ln ? colorOf(ln.kids.find((k) => k.tag === "a:solidFill" || k.tag === "a:noFill"), ctx.theme) : undefined;
    s.lineWeight = ln?.attrs.w ? +ln.attrs.w / EMU : undefined;
    return s;
  }
  if (tag === "p:pic") {
    return Object.assign(s, { kind: descend(node, "a:videoFile").length || descend(node, "a:audioFile").length ? "media" : "image" }, xfrmOf(path(node, "p:spPr/a:xfrm")));
  }
  if (tag === "p:graphicFrame") {
    const x = kid(node, "p:xfrm");
    const tbl = descend(node, "a:tbl")[0];
    if (!tbl) {
      const uri = path(node, "a:graphic/a:graphicData")?.attrs.uri ?? "";
      const kind = /chart/.test(uri) ? "chart" : /diagram/.test(uri) ? "smartart" : /^urn:dojo:/.test(uri) ? uri.slice(9) : "graphic";
      return Object.assign(s, { kind }, xfrmOf(x));
    }
    const values = kids(tbl, "a:tr").map((tr) => kids(tr, "a:tc").map((tc) => textOf(kid(tc, "a:txBody")).text));
    const f0 = fontOf(descend(tbl, "a:txBody")[0], ctx.theme);
    return Object.assign(s, { kind: "table", values, rows: values.length, cols: values[0]?.length ?? 0, ...f0 }, xfrmOf(x));
  }
  // p:sp
  const sp = kid(node, "p:spPr");
  const tx = kid(node, "p:txBody");
  let geom = xfrmOf(kid(sp, "a:xfrm"));
  if (ph) {
    s.ph = { title: "title", ctrTitle: "title", subTitle: "subtitle", body: "body", obj: "body" }[ph.attrs.type] ?? (ph.attrs.type ? "other" : "body");
    if (geom.left === undefined) geom = ctx.inherit(ph);
  }
  const prst = path(sp, "a:prstGeom")?.attrs.prst;
  const isTxBox = path(nv, "p:cNvSpPr")?.attrs.txBox === "1";
  s.kind = ph || isTxBox ? "text" : Object.keys(GEOS).find((k) => GEOS[k] === prst && k !== "text") ?? "shape";
  Object.assign(s, geom);
  const fillNode = sp?.kids.find((k) => ["a:solidFill", "a:noFill", "a:gradFill", "a:blipFill", "a:pattFill"].includes(k.tag));
  s.fill = fillNode ? colorOf(fillNode, ctx.theme) : isTxBox ? null : undefined;
  const ln = kid(sp, "a:ln");
  if (ln) {
    const lf = ln.kids.find((k) => k.tag === "a:solidFill" || k.tag === "a:noFill");
    s.lineColor = lf ? colorOf(lf, ctx.theme) : undefined;
    s.lineWeight = ln.attrs.w ? +ln.attrs.w / EMU : undefined;
  } else s.lineColor = isTxBox ? null : undefined;
  const { text } = textOf(tx);
  s.text = text;
  Object.assign(s, fontOf(tx, ctx.theme));
  const anchor = path(tx, "a:bodyPr")?.attrs.anchor;
  if (anchor) s.valign = { t: "top", ctr: "middle", b: "bottom" }[anchor];
  return s;
}

function readTree(tree, ctx, group = null, out = []) {
  for (const n of tree.kids) {
    if (n.tag === "p:grpSp") {
      const nm = path(n, "p:nvGrpSpPr/p:cNvPr")?.attrs.name ?? "Groupe";
      readTree(n, ctx, nm, out);
    } else if (["p:sp", "p:cxnSp", "p:pic", "p:graphicFrame"].includes(n.tag)) out.push(readShape(n, ctx, group));
  }
  return out;
}

// Transition et animations d'une diapositive, lues dans son XML (celui d'un .pptx ou d'`exportAsBase64`). Les cibles d'animation sont
// retrouvées par NOM de forme (les numéros peuvent changer à l'export).
export function slideExtras(root) {
  const tr = descend(root, "p:transition")[0];
  let transition = null;
  if (tr) {
    const eff = tr.kids.find((k) => !/:(sndAc|extLst)$/.test(k.tag));
    const dur = tr.attrs["p14:dur"];
    transition = { effect: eff ? eff.tag.replace(/^[a-z0-9]+:/i, "") : "none", advClick: tr.attrs.advClick !== "0", advTime: tr.attrs.advTm != null ? +tr.attrs.advTm / 1000 : null, dur: dur != null ? +dur / 1000 : null };
  }
  const names = {};
  for (const c of descend(root, "p:cNvPr")) names[c.attrs.id] = c.attrs.name;
  const anims = descend(root, "p:cTn").filter((n) => n.attrs.presetClass).map((n) => ({ cls: n.attrs.presetClass, preset: +n.attrs.presetID, target: names[descend(n, "p:spTgt")[0]?.attrs.spid] }));
  return { transition, anims };
}

export async function readPptx(data) {
  const zip = await JSZip.loadAsync(data);
  const text = async (p) => {
    const f = zip.file(p);
    return f ? f.async("string") : null;
  };
  const relsOf = async (p) => {
    const dir = p.replace(/[^/]+$/, ""), name = p.split("/").pop();
    const x = await text(`${dir}_rels/${name}.rels`);
    const map = {};
    if (x) for (const r of kids(parse(x), "Relationship")) map[r.attrs.Id] = { type: r.attrs.Type.split("/").pop(), target: resolve(dir, r.attrs.Target) };
    return map;
  };
  const resolve = (dir, t) => {
    if (t.startsWith("/")) return t.slice(1);
    const parts = (dir + t).split("/");
    const out = [];
    for (const p of parts) p === ".." ? out.pop() : p !== "." && p && out.push(p);
    return out.join("/");
  };
  const pres = parse(await text("ppt/presentation.xml"));
  const prels = await relsOf("ppt/presentation.xml");
  const deck = blankDeck();
  const sz = kid(pres, "p:sldSz");
  if (sz) { deck.slideW = +sz.attrs.cx / EMU; deck.slideH = +sz.attrs.cy / EMU; }
  const themePath = Object.values(prels).find((r) => r.type === "theme")?.target;
  const theme = themePath ? themeColors(parse(await text(themePath))) : {};
  const layoutCache = {}, masterCache = {};
  const loadTree = async (p) => (masterCache[p] ??= path(parse(await text(p)), "p:cSld/p:spTree"));
  for (const id of kids(kid(pres, "p:sldIdLst"), "p:sldId")) {
    const sp = prels[id.attrs["r:id"]]?.target;
    if (!sp) continue;
    const root = parse(await text(sp));
    const srels = await relsOf(sp);
    const layoutPath = Object.values(srels).find((r) => r.type === "slideLayout")?.target;
    const lroot = layoutPath ? (layoutCache[layoutPath] ??= parse(await text(layoutPath))) : null;
    const lrels = layoutPath ? await relsOf(layoutPath) : {};
    const masterPath = Object.values(lrels).find((r) => r.type === "slideMaster")?.target;
    const ltree = lroot && path(lroot, "p:cSld/p:spTree");
    const mtree = masterPath ? await loadTree(masterPath) : null;
    const inherit = (ph) => {
      for (const tree of [ltree, mtree]) {
        if (!tree) continue;
        for (const n of kids(tree, "p:sp")) {
          const p2 = path(n, "p:nvSpPr/p:nvPr/p:ph");
          if (p2 && ((ph.attrs.idx && p2.attrs.idx === ph.attrs.idx) || (!ph.attrs.idx && p2.attrs.type === ph.attrs.type))) {
            const g = xfrmOf(path(n, "p:spPr/a:xfrm"));
            if (g.left !== undefined) return g;
          }
        }
      }
      return {};
    };
    const tree = path(root, "p:cSld/p:spTree");
    const bgNode = path(root, "p:cSld/p:bg/p:bgPr");
    const sl = {
      id: deck.slides.length + 1,
      layout: lroot ? layoutByOoxml(lroot.attrs.type) : "blank",
      shapes: readTree(tree, { theme, inherit }),
      notes: undefined, // les notes ne sont pas dans le fichier simplifié : illisibles ici
      bg: bgNode ? colorOf(bgNode.kids.find((k) => k.tag === "a:solidFill" || k.tag === "a:noFill"), theme) : null, // pas de fond propre = celui du masque
      hidden: root.attrs.show === "0",
      ...slideExtras(root),
    };
    sl.shapes.forEach((s, i) => (s.z = i));
    deck.slides.push(sl);
  }
  deck.nextId = Math.max(2, ...deck.slides.flatMap((s) => s.shapes.map((x) => x.id + 1)));
  return deck;
}
