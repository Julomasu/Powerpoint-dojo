// Outils des générateurs d'épreuves de certification : hasard à graine (mêmes graine = même épreuve, pour la correction finale),
// réserves de contenus, couleurs nommées. Les valeurs attendues sont toujours CALCULÉES dans les générateurs.
export function rnd(seed) {
  let a = seed >>> 0;
  const r = () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const g = { r };
  g.int = (lo, hi) => lo + Math.floor(r() * (hi - lo + 1));
  g.pick = (arr) => arr[Math.floor(r() * arr.length)];
  g.sample = (arr, n) => { const x = [...arr], out = []; while (out.length < n && x.length) out.push(x.splice(Math.floor(r() * x.length), 1)[0]); return out; };
  g.shuffle = (arr) => g.sample(arr, arr.length);
  g.bool = () => r() < 0.5;
  return g;
}

export const POOLS = {
  societes: ["Alpha Industries", "Boréal Santé", "Cèdre Logistique", "Delta Énergie", "Éole Mobilité", "Fjord Foods", "Gaïa Retail", "Helios Capital", "Iris Software", "Jade Pharma", "Kappa Média", "Lumen Tech"],
  secteurs: ["Industrie", "Santé", "Logistique", "Énergie", "Mobilité", "Agroalimentaire", "Distribution", "Services financiers", "Logiciels", "Médias"],
  mots: ["Synthèse", "Contexte", "Marché", "Stratégie", "Risques", "Calendrier", "Budget", "Équipe", "Résultats", "Perspectives", "Concurrence", "Offre", "Valorisation", "Process", "Annexes"],
  phrases: ["Croissance organique de 8 %", "Marge d'EBITDA en hausse", "Carnet de commandes record", "Trésorerie nette positive", "Nouveau site en 2026", "Réseau de 120 points de vente"],
  polices: ["Arial", "Georgia", "Verdana", "Calibri", "Times New Roman", "Tahoma"],
};
export const COLORS = [
  { n: "bleu marine", h: "#1F3864" }, { n: "rouge foncé", h: "#C00000" }, { n: "vert", h: "#548235" }, { n: "orange", h: "#ED7D31" },
  { n: "gris", h: "#7F7F7F" }, { n: "violet", h: "#7030A0" }, { n: "turquoise", h: "#2B7A78" }, { n: "jaune doré", h: "#BF9000" },
];
export const SIZES = { "4:3": [720, 540], "16:9": [960, 540], "A4 paysage": [841.89, 595.28], "16:10": [864, 540] };
export const sum = (a) => a.reduce((x, y) => x + y, 0);
export const r1 = (x) => Math.round(x * 10) / 10;
export const cn = (c) => `${c.n} (${c.h})`;
