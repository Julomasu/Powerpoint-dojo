// Correcteur : compare la présentation lue (modèle de deck.js) aux contrôles de l'exercice.
export function grade(ex, deck, ctx = {}) {
  const items = ex.answers.map((a) => {
    let r;
    try { r = a.test(deck, ctx); } catch (e) { r = "Erreur de lecture : " + e.message; }
    if (r === true) return { label: a.label, ok: true };
    if (r && typeof r === "object") return { label: a.label, ok: !!r.ok, msg: r.msg, skip: !!r.skip, confirm: a.kind === "confirm" };
    return { label: a.label, ok: false, msg: typeof r === "string" ? r : undefined, confirm: a.kind === "confirm" };
  });
  const okCount = items.filter((i) => i.ok).length;
  return { pass: okCount === items.length && items.length > 0, items, ok: okCount, total: items.length, fraction: items.length ? okCount / items.length : 0 };
}
