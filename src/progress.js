// Progression : { v, done: { id: { xp, bestMs, at } }, last, updated }
// Elle vit d'abord dans le navigateur (localStorage) et, si tu es connecté, elle est synchronisée avec ton compte (cloud.js).
const KEY = "powerpoint-dojo.v1";
const listeners = new Set();

const empty = () => ({ v: 3, done: {}, last: null, updated: 0, days: [], exams: {}, skips: {}, certs: [] });

function read() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY));
    return s && s.done ? { ...empty(), ...s } : empty();
  } catch {
    return empty();
  }
}

function write(state, notify = true) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* stockage indisponible : la progression ne sera pas conservée */
  }
  if (notify) listeners.forEach((fn) => fn(state));
}

export const getProgress = () => read();
export const onProgressChange = (fn) => listeners.add(fn);

// Révision espacée : intervalles (en jours) entre deux révisions réussies
export const INTERVALS = [1, 3, 7, 16, 35, 90];
export const dueOf = (d) => d.due ?? (d.at ?? 0) + INTERVALS[Math.min(d.stage ?? 0, INTERVALS.length - 1)] * 864e5;

export function recordWin(id, xp, ms, { review = false } = {}) {
  const s = read();
  const prev = s.done[id];
  const now = Date.now();
  // une révision réussie fait passer à l'intervalle suivant ; un premier succès démarre à l'étape 0
  const stage = prev ? Math.min((prev.stage ?? 0) + (review || dueOf(prev) <= now ? 1 : 0), INTERVALS.length) : 0;
  s.done[id] = { xp: Math.max(xp, prev?.xp ?? 0), bestMs: prev ? Math.min(prev.bestMs, ms) : ms, at: now, stage, due: now + INTERVALS[Math.min(stage, INTERVALS.length - 1)] * 864e5 };
  s.last = id;
  s.updated = now;
  const day = dayKey(new Date(now));
  s.days = [...new Set([...(s.days ?? []), day])].sort().slice(-90);
  write(s);
}

const dayKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

// Série : nombre de jours consécutifs avec au moins un exercice réussi (aujourd'hui ou hier compte)
export function getStreak() {
  const days = new Set(read().days ?? []);
  const d = new Date();
  if (!days.has(dayKey(d))) d.setDate(d.getDate() - 1);
  let n = 0;
  while (days.has(dayKey(d))) {
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}
export const activeToday = () => (read().days ?? []).includes(dayKey(new Date()));

export const totalXp = () => Object.values(read().done).reduce((n, d) => n + d.xp, 0);

const pickLatest = (p, d) => {
  const n = (d.at ?? 0) > (p.at ?? 0) ? d : p; // la révision la plus récente décide de l'étape
  return { at: Math.max(p.at ?? 0, d.at ?? 0), stage: n.stage ?? 0, due: n.due };
};

// Examens de ceinture : { blanche: { best, total, passed, at } }
export const getExams = () => read().exams ?? {};
export function recordExam(belt, score, total, passed) {
  const s = read();
  const prev = s.exams?.[belt];
  s.exams = { ...(s.exams ?? {}), [belt]: { best: Math.max(score, prev?.best ?? 0), total, passed: passed || !!prev?.passed, at: Date.now() } };
  s.updated = Date.now();
  write(s);
}

// Certifications passées : [{ at, kind, score, ms, parts: [{ cat, pct }] }], les 40 dernières
export const getCerts = () => read().certs ?? [];
export function recordCert(entry) {
  const s = read();
  s.certs = [...(s.certs ?? []), entry].slice(-40);
  s.updated = Date.now();
  write(s);
}

// Tests pour sauter : { "belt:orange": at, "grp:bases": at }. Réussir le test valide d'un coup tous les exercices de la ceinture ou du chapitre.
export const getSkips = () => read().skips ?? {};
export function recordSkip(unit) {
  const s = read();
  s.skips = { ...(s.skips ?? {}), [unit]: Date.now() };
  s.updated = Date.now();
  write(s);
}

// Fusion de deux progressions (appareils différents) : on garde le meilleur de chaque exercice.
export function mergeProgress(a, b) {
  const out = empty();
  for (const src of [a, b]) {
    for (const [id, d] of Object.entries(src?.done ?? {})) {
      const p = out.done[id];
      out.done[id] = p
        ? { xp: Math.max(p.xp, d.xp), bestMs: Math.min(p.bestMs ?? Infinity, d.bestMs ?? Infinity), ...pickLatest(p, d) }
        : { xp: d.xp, bestMs: d.bestMs, at: d.at ?? 0, stage: d.stage ?? 0, due: d.due };
    }
  }
  const newest = [a, b].filter(Boolean).sort((x, y) => (y.updated ?? 0) - (x.updated ?? 0))[0];
  out.last = newest?.last ?? a?.last ?? b?.last ?? null;
  out.updated = Math.max(a?.updated ?? 0, b?.updated ?? 0);
  for (const src of [a, b]) for (const [k, x] of Object.entries(src?.exams ?? {})) {
    const p = out.exams[k];
    out.exams[k] = p ? { best: Math.max(p.best, x.best), total: x.total, passed: p.passed || x.passed, at: Math.max(p.at, x.at) } : { ...x };
  }
  for (const src of [a, b]) for (const [k, at] of Object.entries(src?.skips ?? {})) out.skips[k] = Math.min(out.skips[k] ?? Infinity, at ?? 0);
  const seen = new Set();
  out.certs = [...(a?.certs ?? []), ...(b?.certs ?? [])].filter((c) => !seen.has(c.at) && seen.add(c.at)).sort((x, y) => x.at - y.at).slice(-40);
  out.days = [...new Set([...(a?.days ?? []), ...(b?.days ?? [])])].sort().slice(-90);
  return out;
}

export function replaceProgress(state, notify = false) {
  write({ ...empty(), ...state }, notify);
}

export const exportProgress = () => JSON.stringify(read());

// Restauration à partir d'une sauvegarde collée (fusionnée avec l'existant, rien n'est écrasé)
export function importProgress(text) {
  const incoming = JSON.parse(text);
  if (!incoming || typeof incoming.done !== "object") throw new Error("Ce texte n'est pas une sauvegarde du Dojo.");
  const merged = mergeProgress(read(), incoming);
  merged.updated = Date.now();
  write(merged);
  return Object.keys(merged.done).length;
}
