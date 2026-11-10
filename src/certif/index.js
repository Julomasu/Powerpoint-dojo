// Certification PowerPoint : un grand examen noté sur 100 (100 = champion du monde de PowerPoint), composé d'épreuves générées au hasard.
// Aucune banque fixe d'énoncés : chaque épreuve est fabriquée à partir d'une graine (contenus, couleurs, nombres, positions, consignes)
// et ses attentes sont recalculées en JS. `generate(genId, seed)` rend un exercice ordinaire, rejouable pour la correction finale.
import { mk } from "../answers.js";
import { requirementsOf, compatible } from "../caps.js";
import { rnd } from "./kit.js";
import { GEN1 } from "./gen1.js";
import { GEN2 } from "./gen2.js";

export const GENERATORS = [...GEN1, ...GEN2];
const BY_ID = Object.fromEntries(GENERATORS.map((x) => [x.id, x]));

export const CATS = { base: "Diapositives et texte", forme: "Formes et couleurs", layout: "Mise en page et alignement", design: "Design et lisibilité", tableaux: "Tableaux et objets", ruban: "Ruban et réglages", metier: "Cas de métier" };
export const LEVEL_NAMES = ["", "Fondamentaux", "Pratique courante", "Avancé", "Expert", "Champion"];
export const WEIGHTS = [0, 1, 2, 3, 4, 5];
export const FORMATS = {
  full: { name: "Certification complète", counts: [0, 5, 5, 4, 3, 3], minutes: 90, blurb: "20 épreuves, 90 minutes : le score officiel." },
  express: { name: "Express", counts: [0, 3, 3, 2, 1, 1], minutes: 40, blurb: "10 épreuves, 40 minutes : une estimation rapide." },
};

export function generate(genId, seed) {
  const gen = BY_ID[genId];
  if (!gen) throw new Error("Épreuve inconnue : " + genId);
  const made = gen.make(rnd(seed));
  const ex = mk({ id: `cx~${genId}~${seed}`, track: "certif", skill: "certif", level: gen.level, cat: gen.cat, title: gen.title, xp: 0, story: made.story, setup: made.setup, answers: made.answers, sol: made.sol, steps: [], hint: "", gen: genId, seed });
  return { ...ex, ...requirementsOf(ex), xml: !!gen.xml || requirementsOf(ex).xml };
}
export const fromId = (id) => { const [, g, s] = id.split("~"); return generate(g, Number(s)); };

// Tire les épreuves : par niveau, en variant les domaines (le moins utilisé d'abord) ; `ok(ex)` écarte celles que ce PowerPoint ne sait pas corriger
export function drawExam(kind, { ok = () => true, rand = Math.random } = {}) {
  const f = FORMATS[kind], items = [], used = {};
  for (let lvl = 1; lvl <= 5; lvl++) {
    const pool = GENERATORS.filter((x) => x.level === lvl && ok(generate(x.id, 1))).sort(() => rand() - 0.5);
    for (let k = 0; k < f.counts[lvl]; k++) {
      pool.sort((a, b) => (used[a.cat] ?? 0) - (used[b.cat] ?? 0) || rand() - 0.5);
      const gen = pool.shift();
      if (!gen) break;
      used[gen.cat] = (used[gen.cat] ?? 0) + 1;
      items.push({ gen: gen.id, seed: 1 + Math.floor(rand() * 1e9), level: lvl, cat: gen.cat, f: null });
    }
  }
  return items;
}

// Score sur 100 : chaque épreuve rapporte (part de contrôles réussis) × (poids de son niveau)
export function scoreOf(items) {
  const total = items.reduce((n, it) => n + WEIGHTS[it.level], 0);
  const got = items.reduce((n, it) => n + WEIGHTS[it.level] * (it.f ?? 0), 0);
  return total ? (100 * got) / total : 0;
}
export function breakdown(items) {
  const out = {};
  for (const it of items) {
    const c = (out[it.cat] ??= { got: 0, total: 0, n: 0 });
    c.got += WEIGHTS[it.level] * (it.f ?? 0);
    c.total += WEIGHTS[it.level];
    c.n++;
  }
  return Object.entries(out).map(([cat, v]) => ({ cat, name: CATS[cat], pct: v.total ? Math.round((100 * v.got) / v.total) : 0, n: v.n })).sort((a, b) => b.pct - a.pct);
}
export const BANDS = [
  [98, "Champion du monde de PowerPoint", "Pratiquement parfait : tout est maîtrisé, y compris les cas de métier."],
  [90, "Expert", "Une maîtrise rare : seules quelques subtilités t'échappent."],
  [75, "Avancé", "Tu es très à l'aise, y compris sur la mise en page et le design."],
  [60, "Confirmé", "Tu te débrouilles bien au quotidien ; les épreuves expertes restent à travailler."],
  [40, "Intermédiaire", "Les bases sont là ; l'alignement, les tableaux et le design demandent de la pratique."],
  [20, "Débutant", "Tu connais les fondamentaux ; continue la formation pour gagner en vitesse et en méthode."],
  [0, "Découverte", "Tu démarres : la formation te fera progresser vite."],
];
export const bandOf = (score) => BANDS.find(([min]) => Math.round(score) >= min);
export const certSamples = (n = 3) => GENERATORS.flatMap((g) => Array.from({ length: n }, (_, i) => generate(g.id, 11 + i * 977)));
