// Générateurs d'épreuves, niveaux 1 à 3. `make(g)` tire contenus, couleurs, positions et consignes d'une graine et renvoie
// { story, setup, answers, sol } ; les attentes sont recalculées ici en JS (jamais tapées à la main).
import { shapeA, countA, slidesA, layoutA, bgA, sizeA, alignA, distributeA, ruleA, transitionA, animA, noOverlapA, insideA } from "../answers.js";
import { O, findShapes } from "../deck.js";
import { POOLS as P, COLORS, SIZES, cn, sum } from "./kit.js";

const T = (title, extra) => O.slide("titleOnly", { title, ...extra });
const titles = (d) => d.slides.map((s) => findShapes(s, { ph: "title" })[0]?.text);
const rect = (name, l, t, w, h, extra = {}) => O.rect(0, name, l, t, w, h, { fill: "#1F3864", ...extra });
const ledger = { left: "gauche", right: "droit", top: "haut", bottom: "bas", centerX: "centre horizontal", centerY: "milieu vertical" };

export const GEN1 = [
  // ═════ Niveau 1 : Fondamentaux
  { id: "titre", level: 1, cat: "base", title: "Écrire un titre", make(g) {
    const t = `${g.pick(P.societes)} : ${g.pick(P.mots)} ${g.int(2025, 2028)}`;
    return { story: `Écris dans le titre de la diapositive : ${t}`, setup: [O.slide("titleOnly")], answers: [shapeA(0, { ph: "title" }, { text: t }, `Le titre est « ${t} »`)], sol: [O.set(0, { ph: "title" }, { text: t })] };
  } },
  { id: "titre-sous", level: 1, cat: "base", title: "Titre et sous-titre", make(g) {
    const t = g.pick(P.societes), s = `Secteur : ${g.pick(P.secteurs)}`;
    return { story: `Titre : ${t}. Sous-titre : ${s}.`, setup: [O.slide("title")], answers: [shapeA(0, { ph: "title" }, { text: t }, `Titre « ${t} »`), shapeA(0, { ph: "subtitle" }, { text: s }, `Sous-titre « ${s} »`)], sol: [O.set(0, { ph: "title" }, { text: t }), O.set(0, { ph: "subtitle" }, { text: s })] };
  } },
  { id: "ajouter", level: 1, cat: "base", title: "Ajouter des diapositives", make(g) {
    const n = g.int(1, 3), total = 1 + n;
    return { story: `La présentation a 1 diapositive. Ajoute-en ${n} pour en avoir ${total}.`, setup: [T(g.pick(P.mots))], answers: [slidesA(total)], sol: Array.from({ length: n }, () => O.slide("blank")) };
  } },
  { id: "supprimer", level: 1, cat: "base", title: "Supprimer une diapositive", make(g) {
    const t = g.sample(P.mots, 4), k = g.int(0, 3), out = t[k], rest = t.filter((_, i) => i !== k);
    return { story: `Supprime la diapositive « ${out} » et garde les autres dans le même ordre.`, setup: t.map((x) => T(x)), answers: [ruleA(`Il reste : ${rest.join(", ")}`, (d) => titles(d).join("|") === rest.join("|") || `Il reste : ${titles(d).join(", ")}.`)], sol: [{ op: "delSlide", s: k }] };
  } },
  { id: "ordre", level: 1, cat: "base", title: "Remettre dans l'ordre", make(g) {
    const want = g.sample(P.mots, 3);
    let start = g.shuffle(want); while (start.join() === want.join()) start = g.shuffle(want);
    const sol = [], cur = [...start];
    for (let i = 0; i < 3; i++) { const j = cur.indexOf(want[i]); if (j !== i) { sol.push({ op: "moveSlide", from: j, to: i }); cur.splice(i, 0, cur.splice(j, 1)[0]); } }
    return { story: `Mets les diapositives dans l'ordre : ${want.join(", ")}.`, setup: start.map((x) => T(x)), answers: [ruleA(`Ordre : ${want.join(", ")}`, (d) => titles(d).join("|") === want.join("|") || `Ordre actuel : ${titles(d).join(", ")}.`)], sol };
  } },
  { id: "zonetexte", level: 1, cat: "base", title: "Zone de texte", make(g) {
    const t = g.pick(P.phrases);
    return { story: `Ajoute dans la moitié basse de la diapositive une zone de texte contenant : ${t}`, setup: [T(g.pick(P.mots))], answers: [shapeA(0, { kind: "text", text: t }, { text: t, top: { min: 270 } }, `Une zone de texte « ${t} » dans la moitié basse`)], sol: [O.box(0, "Texte", t, 66, g.int(300, 470), 600, 40, { fontSize: 20 })] };
  } },
  { id: "remplir", level: 1, cat: "forme", title: "Colorer une forme", make(g) {
    const c = g.pick(COLORS), other = g.pick(COLORS.filter((x) => x.h !== c.h));
    return { story: `Colorie le rectangle « Bloc » en ${cn(c)}.`, setup: [T("Forme"), rect("Bloc", 100, 200, 300, 100, { fill: other.h })], answers: [shapeA(0, "Bloc", { fill: c.h }, `Remplissage ${cn(c)}`)], sol: [O.set(0, "Bloc", { fill: c.h })] };
  } },
  { id: "gras-taille", level: 1, cat: "base", title: "Gras et taille", make(g) {
    const sz = g.pick([24, 28, 32, 36, 40]);
    return { story: `Mets le texte de « Message » en gras et en taille ${sz} pt.`, setup: [T("Message clé"), O.box(0, "Message", g.pick(P.phrases), 66, 200, 800, 60, { fontSize: 18 })], answers: [shapeA(0, "Message", { bold: true }, "Texte en gras"), shapeA(0, "Message", { fontSize: sz }, `Taille ${sz} pt`)], sol: [O.set(0, "Message", { bold: true, fontSize: sz })] };
  } },
  { id: "alignement-texte", level: 1, cat: "base", title: "Aligner le texte", make(g) {
    const a = g.pick(["left", "center", "right"]), name = { left: "à gauche", center: "centré", right: "à droite" }[a];
    const start = g.pick(["left", "center", "right"].filter((x) => x !== a));
    return { story: `Aligne le texte de « Légende » : ${name}.`, setup: [T("Légende"), O.box(0, "Légende", g.pick(P.phrases), 66, 200, 828, 40, { fontSize: 24, align: start })], answers: [shapeA(0, "Légende", { align: a }, `Texte ${name}`)], sol: [O.set(0, "Légende", { align: a })] };
  } },
  { id: "disposition", level: 1, cat: "base", title: "Choisir la mise en page", make(g) {
    const [k, nm] = g.pick([["content", "Titre et contenu"], ["two", "Deux contenus"], ["section", "En-tête de section"], ["blank", "Vide"]]);
    return { story: `Passe la diapositive en mise en page « ${nm} ».`, setup: [T(g.pick(P.mots))], answers: [layoutA(0, k, `Mise en page « ${nm} »`)], sol: [{ op: "layout", s: 0, layout: k }] };
  } },
  // ═════ Niveau 2 : Pratique courante
  { id: "position", level: 2, cat: "forme", title: "Position exacte", make(g) {
    const l = g.int(2, 30) * 10, t = g.int(2, 20) * 10;
    return { story: `Place « Logo » à ${l} pt du bord gauche et ${t} pt du haut (Format de la forme → Position).`, setup: [T("Charte"), rect("Logo", 400, 250, 120, 60, { text: "LOGO" })], answers: [shapeA(0, "Logo", { left: l, top: t }, `Position ${l} / ${t} pt`)], sol: [O.set(0, "Logo", { left: l, top: t })] };
  } },
  { id: "taille", level: 2, cat: "forme", title: "Taille exacte", make(g) {
    const w = g.int(5, 30) * 10, h = g.int(3, 20) * 10;
    return { story: `Donne à « Carte » une largeur de ${w} pt et une hauteur de ${h} pt.`, setup: [T("Cartes"), rect("Carte", 200, 200, 150, 150, { fill: "#548235" })], answers: [shapeA(0, "Carte", { width: w, height: h }, `Taille ${w} × ${h} pt`)], sol: [O.set(0, "Carte", { width: w, height: h })] };
  } },
  { id: "contour", level: 2, cat: "forme", title: "Contour et sans remplissage", make(g) {
    const c = g.pick(COLORS), w = g.pick([2, 3, 4, 5]);
    return { story: `Retire le remplissage de « Cadre » et donne-lui un contour ${cn(c)} de ${w} pt.`, setup: [T("Cadre"), rect("Cadre", 200, 180, 400, 160, { fill: "#D9D9D9" })], answers: [shapeA(0, "Cadre", { fill: null }, "Sans remplissage"), shapeA(0, "Cadre", { lineColor: c.h }, `Contour ${cn(c)}`), shapeA(0, "Cadre", { lineWeight: w }, `Épaisseur ${w} pt`)], sol: [O.set(0, "Cadre", { fill: null, lineColor: c.h, lineWeight: w })] };
  } },
  { id: "police", level: 2, cat: "base", title: "Police, taille, couleur", make(g) {
    const f = g.pick(P.polices), sz = g.int(14, 40), c = g.pick(COLORS);
    return { story: `Mets « Titre » en police ${f}, ${sz} pt, couleur ${cn(c)}.`, setup: [T("Mise en forme"), O.box(0, "Titre", g.pick(P.mots), 66, 200, 600, 70, { fontSize: 18 })], answers: [shapeA(0, "Titre", { fontName: f }, `Police ${f}`), shapeA(0, "Titre", { fontSize: sz }, `${sz} pt`), shapeA(0, "Titre", { color: c.h }, `Couleur ${cn(c)}`)], sol: [O.set(0, "Titre", { fontName: f, fontSize: sz, color: c.h })] };
  } },
  { id: "aligner", level: 2, cat: "layout", title: "Aligner des formes", make(g) {
    const edge = g.pick(["left", "right", "top", "bottom"]), n = g.int(3, 4), names = Array.from({ length: n }, (_, i) => `B${i + 1}`);
    const shapes = names.map((nm, i) => ({ nm, l: g.int(6, 40) * 10, t: 120 + i * 90 + g.int(0, 3) * 10, w: g.int(10, 22) * 10, h: 50 + g.int(0, 3) * 10 }));
    const val = { left: (s) => s.l, right: (s) => s.l + s.w, top: (s) => s.t, bottom: (s) => s.t + s.h };
    const ref = val[edge](shapes[0]);
    const sol = shapes.slice(1).map((s) => ({ left: { left: ref }, right: { left: ref - s.w }, top: { top: ref }, bottom: { top: ref - s.h } })[edge]).map((p, i) => O.set(0, names[i + 1], p));
    return { story: `Aligne les ${n} formes sur leur bord ${ledger[edge]} (la première sert de repère, elle ne bouge pas).`, setup: [T("Alignement"), ...shapes.map((s) => rect(s.nm, s.l, s.t, s.w, s.h))], answers: [alignA(0, names, edge, `Bords ${ledger[edge]} alignés`), shapeA(0, "B1", { left: shapes[0].l, top: shapes[0].t }, "La première n'a pas bougé")], sol };
  } },
  { id: "repartir", level: 2, cat: "layout", title: "Répartir", make(g) {
    const h = g.bool(), n = g.int(3, 4), names = Array.from({ length: n }, (_, i) => `R${i + 1}`);
    const size = 80, a = 80, b = h ? 800 : 440, step = (b - a) / (n - 1);
    const pos = names.map((_, i) => (i === 0 ? a : i === n - 1 ? b : a + step * i + g.pick([-25, -15, 15, 25])));
    const mk = (nm, p) => (h ? rect(nm, p, 230, size, size) : rect(nm, 400, p, size, size));
    const prop = h ? "left" : "top";
    return { story: `Répartis les ${n} formes ${h ? "horizontalement" : "verticalement"} avec des espaces égaux (les deux extrêmes restent en place).`, setup: [T("Répartition"), ...names.map((nm, i) => mk(nm, pos[i]))], answers: [distributeA(0, names, h ? "h" : "v", "Espaces égaux"), shapeA(0, "R1", { [prop]: a }, "La première n'a pas bougé"), shapeA(0, names[n - 1], { [prop]: b }, "La dernière n'a pas bougé")], sol: names.slice(1, -1).map((nm, i) => O.set(0, nm, { [prop]: a + step * (i + 1) })) };
  } },
  { id: "grouper", level: 2, cat: "layout", title: "Grouper et nommer", make(g) {
    const nm = g.pick(["Pictogramme", "Bloc", "Étiquette", "Module"]);
    return { story: `Groupe « Rond » et « Texte » puis nomme le groupe « ${nm} ».`, setup: [T("Groupe"), { op: "add", s: 0, shape: { kind: "ellipse", name: "Rond", left: 300, top: 200, width: 90, height: 90, fill: "#1F3864" } }, O.box(0, "Texte", g.pick(P.mots), 300, 300, 100, 30, { align: "center" })], answers: [ruleA(`Les deux formes sont dans le groupe « ${nm} »`, (d) => ["Rond", "Texte"].every((x) => d.slides[0].shapes.find((s) => s.name === x)?.group === nm) || "Les deux formes ne sont pas groupées sous ce nom.")], sol: [{ op: "group", s: 0, sels: ["Rond", "Texte"], name: nm }] };
  } },
  { id: "premier-plan", level: 2, cat: "layout", title: "Ordre d'empilement", make(g) {
    const front = g.bool(), names = g.shuffle(["Haut", "Milieu", "Bas"]), target = names[front ? 0 : 2];
    return { story: `Mets la forme « ${target} » ${front ? "au premier plan" : "à l'arrière-plan"} (ordre Z).`, setup: [T("Empilement"), ...names.map((nm, i) => rect(nm, 200 + i * 60, 180 + i * 40, 200, 120, { fill: COLORS[i].h }))], answers: [ruleA(`« ${target} » est ${front ? "devant toutes les autres" : "derrière toutes les autres"}`, (d) => { const s = d.slides[0].shapes.filter((x) => !x.ph).map((x) => x.name); return (front ? s.at(-1) : s[0]) === target || "Ce n'est pas la bonne forme qui est devant/derrière."; })], sol: [{ op: "z", s: 0, sel: target, to: front ? "front" : "back" }] };
  } },
  { id: "renommer", level: 2, cat: "layout", title: "Nommer les formes", make(g) {
    const nms = g.sample(["Logo", "Message", "Source", "Cible", "Légende", "Bandeau"], 3), txt = g.sample(P.mots, 3);
    return { story: `Dans le volet Sélection, renomme les formes : ${txt.map((t, i) => `celle qui contient « ${t} » → « ${nms[i]} »`).join(" ; ")}.`, setup: [T("Sélection"), ...txt.map((t, i) => O.box(0, `Forme ${i + 1}`, t, 66, 150 + i * 70, 400, 40))], answers: txt.map((t, i) => shapeA(0, { text: t }, { name: nms[i] }, `« ${t} » s'appelle « ${nms[i]} »`)), sol: txt.map((_, i) => O.set(0, `Forme ${i + 1}`, { name: nms[i] })) };
  } },
  { id: "fond-texte", level: 2, cat: "design", title: "Fond et texte lisibles", make(g) {
    const c = g.pick(COLORS.filter((x) => ["#1F3864", "#C00000", "#548235", "#7030A0", "#2B7A78"].includes(x.h)));
    return { story: `Mets un fond ${cn(c)} sur la diapositive et le titre en blanc.`, setup: [T(g.pick(P.mots))], answers: [bgA(0, c.h, `Fond ${cn(c)}`), shapeA(0, { ph: "title" }, { color: "#FFFFFF" }, "Titre en blanc")], sol: [{ op: "bg", s: 0, color: c.h }, O.set(0, { ph: "title" }, { color: "#FFFFFF" })] };
  } },
  // ═════ Niveau 3 : Avancé
  { id: "tableau", level: 3, cat: "tableaux", title: "Créer un tableau", make(g) {
    const r = g.int(3, 5), c = g.int(2, 4), head = g.sample(["Société", "CA", "Marge", "Pays", "Effectif", "Année"], c);
    const values = [head, ...Array.from({ length: r - 1 }, () => Array(c).fill(""))];
    return { story: `Insère un tableau de ${r} lignes et ${c} colonnes et écris l'en-tête : ${head.join(", ")}.`, setup: [T(g.pick(P.mots))], answers: [shapeA(0, { kind: "table" }, { rows: r, cols: c }, `Tableau ${r} × ${c}`), ruleA(`En-tête : ${head.join(" | ")}`, (d) => d.slides[0].shapes.find((s) => s.kind === "table")?.values?.[0]?.join("|") === head.join("|") || "L'en-tête n'est pas celui demandé.")], sol: [{ op: "add", s: 0, shape: { kind: "table", name: "Tableau", rows: r, cols: c, values, left: 80, top: 160, width: 700, height: r * 40 } }] };
  } },
  { id: "tableau-modifier", level: 3, cat: "tableaux", title: "Modifier un tableau", make(g) {
    const r = g.int(2, 3), c = g.int(3, 4), addR = g.int(1, 3), delC = 1;
    const base = Array.from({ length: r }, (_, i) => Array.from({ length: c }, (_, j) => `${"ABCD"[j]}${i + 1}`));
    const want = [...base.map((row) => row.slice(0, c - 1)), ...Array.from({ length: addR }, () => Array(c - 1).fill(""))];
    return { story: `Le tableau fait ${r} lignes × ${c} colonnes. Supprime la dernière colonne et ajoute ${addR} ligne${addR > 1 ? "s" : ""} à la fin.`, setup: [T("Tableau"), { op: "add", s: 0, shape: { kind: "table", name: "T", rows: r, cols: c, values: base, left: 80, top: 160, width: 600, height: r * 40 } }], answers: [shapeA(0, { kind: "table" }, { rows: r + addR, cols: c - delC }, `Tableau ${r + addR} lignes × ${c - delC} colonnes`)], sol: [O.set(0, "T", { values: want })] };
  } },
  { id: "remplacer", level: 3, cat: "base", title: "Rechercher / remplacer", make(g) {
    const [a, b] = g.sample(P.societes, 2), n = g.int(2, 4), texts = Array.from({ length: n }, (_, i) => [`${a} : ${g.pick(P.phrases)}`, `Rapport ${g.int(2023, 2025)} de ${a}`, `Contact ${a}`][i % 3]);
    return { story: `Remplace « ${a} » par « ${b} » partout dans la diapositive.`, setup: [T("Remplacement"), ...texts.map((t, i) => O.box(0, `T${i + 1}`, t, 66, 150 + i * 60, 800, 40))], answers: [ruleA(`Plus aucun « ${a} »`, (d) => !d.slides[0].shapes.some((s) => (s.text ?? "").includes(a)) || `Il reste « ${a} ».`), ruleA(`Les textes contiennent « ${b} »`, (d) => texts.every((t, i) => d.slides[0].shapes.some((s) => s.text === t.split(a).join(b))) || "Les phrases doivent être conservées, avec le nouveau nom.")], sol: texts.map((t, i) => O.set(0, `T${i + 1}`, { text: t.split(a).join(b) })) };
  } },
  { id: "majuscules", level: 3, cat: "base", title: "Casse et correction", make(g) {
    const t = g.pick(P.phrases);
    return { story: `Mets le texte de « Bandeau » en MAJUSCULES sans changer les mots.`, setup: [T("Casse"), O.box(0, "Bandeau", t, 66, 200, 800, 50, { fontSize: 28 })], answers: [shapeA(0, "Bandeau", { text: { exact: t.toUpperCase() } }, `Texte : ${t.toUpperCase()}`)], sol: [O.set(0, "Bandeau", { text: t.toUpperCase() })] };
  } },
  { id: "centrer", level: 3, cat: "layout", title: "Centrer sur la diapositive", make(g) {
    const w = g.int(10, 40) * 10, h = g.int(5, 20) * 10, both = g.bool();
    return { story: `Centre « Cible » ${both ? "horizontalement ET verticalement" : "horizontalement"} sur la diapositive.`, setup: [T("Centrage"), rect("Cible", g.int(1, 5) * 10, g.int(15, 30) * 10, w, h)], answers: [ruleA("Cible est centrée", (d) => { const s = d.slides[0].shapes.find((x) => x.name === "Cible"); const okx = Math.abs(s.left + s.width / 2 - d.slideW / 2) <= 1.5, oky = !both || Math.abs(s.top + s.height / 2 - d.slideH / 2) <= 1.5; return (okx && oky) || "Elle n'est pas centrée."; })], sol: [O.set(0, "Cible", both ? { left: (960 - w) / 2, top: (540 - h) / 2 } : { left: (960 - w) / 2 })] };
  } },
  { id: "rangee", level: 3, cat: "layout", title: "Rangée de cartes régulière", make(g) {
    const n = g.int(3, 4), w = g.pick([160, 180, 200]), gap = g.pick([20, 30, 40]), total = n * w + (n - 1) * gap, l0 = (960 - total) / 2, top = g.int(15, 25) * 10;
    const names = Array.from({ length: n }, (_, i) => `K${i + 1}`);
    return { story: `Range les ${n} cartes en une rangée centrée : mêmes tops, espace de ${gap} pt entre deux cartes, ensemble centré sur la diapositive.`, setup: [T("Cartes"), ...names.map((nm, i) => rect(nm, 60 + i * (w + 15) + g.int(0, 3) * 10, top + g.int(0, 4) * 10, w, 90))], answers: [alignA(0, names, "top", "Tops alignés"), distributeA(0, names, "h", `Espaces égaux`), ruleA(`Espace de ${gap} pt et rangée centrée`, (d) => { const s = names.map((x) => d.slides[0].shapes.find((y) => y.name === x)).sort((a, b) => a.left - b.left); return Math.abs(s[1].left - (s[0].left + s[0].width) - gap) <= 1.5 && Math.abs((s[0].left + s.at(-1).left + s.at(-1).width) / 2 - 480) <= 2 || "L'espace ou le centrage n'est pas bon."; })], sol: names.map((nm, i) => O.set(0, nm, { left: l0 + i * (w + gap), top })) };
  } },
  { id: "texte-alt", level: 3, cat: "ruban", title: "Textes de remplacement", make(g) {
    const k = g.int(2, 3), alts = g.sample(["Graphique des ventes", "Organigramme du groupe", "Carte des implantations", "Photo de l'équipe", "Logo du client"], k);
    return { story: `Ajoute un texte de remplacement à chaque image : ${alts.map((a, i) => `Image ${i + 1} → « ${a} »`).join(" ; ")}.`, setup: [T("Accessibilité"), ...alts.map((_, i) => ({ op: "add", s: 0, shape: { kind: "image", name: `Image ${i + 1}`, left: 60 + i * 280, top: 160, width: 240, height: 180 } }))], answers: alts.map((a, i) => shapeA(0, `Image ${i + 1}`, { alt: a }, `Image ${i + 1} : « ${a} »`)), sol: alts.map((a, i) => O.set(0, `Image ${i + 1}`, { alt: a })) };
  } },
  { id: "format", level: 3, cat: "ruban", title: "Format des diapositives", make(g) {
    const [nm, [w, h]] = g.pick(Object.entries(SIZES).filter(([k]) => k !== "16:9"));
    return { story: `Passe la présentation au format ${nm} (${w} × ${h} pt).`, setup: [T(g.pick(P.mots))], answers: [sizeA(w, h, `Format ${nm}`)], sol: [{ op: "size", w, h }] };
  } },
  { id: "transition", level: 3, cat: "ruban", title: "Transition sur toutes les diapositives", xml: true, make(g) {
    const [eff, nm] = g.pick([["fade", "Fondu"], ["push", "Pousser"], ["wipe", "Balayage"]]), n = g.int(2, 4);
    return { story: `Applique la transition « ${nm} » aux ${n} diapositives.`, setup: Array.from({ length: n }, (_, i) => T(P.mots[i])), answers: Array.from({ length: n }, (_, i) => transitionA(i, { effect: eff }, `Diapositive ${i + 1} : ${nm}`)), sol: Array.from({ length: n }, (_, i) => ({ op: "transition", s: i, effect: eff })) };
  } },
  { id: "animer", level: 3, cat: "ruban", title: "Animer des éléments", xml: true, make(g) {
    const n = g.int(2, 4), names = g.sample(["Idée A", "Idée B", "Idée C", "Idée D"], n);
    return { story: `Fais entrer ${names.length === 2 ? "les deux" : "les " + n} éléments (animation d'entrée) : ${names.join(", ")}.`, setup: [T("Arguments"), ...names.map((nm, i) => rect(nm, 60 + i * 220, 200, 200, 100, { text: nm }))], answers: names.map((nm) => animA(0, { cls: "entr", target: nm }, `« ${nm} » a une animation d'entrée`)), sol: names.map((nm) => ({ op: "anim", s: 0, sel: nm, cls: "entr", preset: 10 })) };
  } },
];
