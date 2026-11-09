// Mini lecteur XML (sans dépendance, marche dans le navigateur ET dans Node) : suffisant pour lire du PresentationML.
// parse(str) → { tag, attrs, kids, text }. Les préfixes d'espace de noms sont conservés ("p:sp").
const ENT = { "&lt;": "<", "&gt;": ">", "&amp;": "&", "&quot;": '"', "&apos;": "'" };
const unesc = (s) => s.replace(/&(lt|gt|amp|quot|apos);|&#(\d+);|&#x([0-9a-f]+);/gi, (m, _n, d, h) => (d ? String.fromCodePoint(+d) : h ? String.fromCodePoint(parseInt(h, 16)) : ENT[m]));

export function parse(src) {
  const root = { tag: "#root", attrs: {}, kids: [], text: "" };
  const stack = [root];
  const re = /<!--[\s\S]*?-->|<!\[CDATA\[([\s\S]*?)\]\]>|<\?[\s\S]*?\?>|<!DOCTYPE[^>]*>|<(\/)?([A-Za-z_][\w:.-]*)((?:\s+[\w:.-]+\s*=\s*(?:"[^"]*"|'[^']*'))*)\s*(\/)?>|([^<]+)/g;
  let m;
  while ((m = re.exec(src))) {
    const cur = stack[stack.length - 1];
    if (m[1] !== undefined) cur.text += m[1];
    else if (m[6] !== undefined) cur.text += unesc(m[6]);
    else if (m[3]) {
      if (m[2]) {
        if (stack.length > 1) stack.pop();
      } else {
        const attrs = {};
        for (const a of m[4].matchAll(/([\w:.-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)) attrs[a[1]] = unesc(a[2] ?? a[3]);
        const node = { tag: m[3], attrs, kids: [], text: "" };
        cur.kids.push(node);
        if (!m[5]) stack.push(node);
      }
    }
  }
  return root.kids[0];
}

export const kids = (n, tag) => (n ? n.kids.filter((k) => k.tag === tag) : []);
export const kid = (n, tag) => (n ? n.kids.find((k) => k.tag === tag) : undefined);
// descendant par chemin « a/b/c »
export const path = (n, p) => p.split("/").reduce((x, t) => (x ? kid(x, t) : undefined), n);
export const descend = (n, tag, out = []) => {
  if (!n) return out;
  for (const k of n.kids) {
    if (k.tag === tag) out.push(k);
    descend(k, tag, out);
  }
  return out;
};
export const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
