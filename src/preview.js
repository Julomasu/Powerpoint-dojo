// Aperçu simplifié d'une diapositive (SVG) : sert au mode fichier et à « voir la diapositive de départ ». Ce n'est pas un rendu PowerPoint.
import { esc } from "./xml.js";
const sansNull = (c, d) => (c === null ? "none" : c ?? d);
export function slideSvg(deck, i, { width = 320 } = {}) {
  const s = deck.slides[i];
  if (!s) return "";
  const H = Math.round((width * deck.slideH) / deck.slideW);
  const k = width / deck.slideW;
  const parts = s.shapes.map((x) => {
    if (x.kind === "table") return `<rect x="${x.left * k}" y="${x.top * k}" width="${x.width * k}" height="${x.height * k}" fill="#fff" stroke="#999"/>`;
    const rot = x.rot ? ` transform="rotate(${x.rot} ${(x.left + x.width / 2) * k} ${(x.top + x.height / 2) * k})"` : "";
    const geo = x.kind === "line" ? `<line x1="${x.left * k}" y1="${x.top * k}" x2="${(x.left + x.width) * k}" y2="${(x.top + x.height) * k}" stroke="${x.lineColor ?? "#4472C4"}" stroke-width="${Math.max(1, (x.lineWeight ?? 1.5) * k)}"/>`
      : x.kind === "ellipse" ? `<ellipse cx="${(x.left + x.width / 2) * k}" cy="${(x.top + x.height / 2) * k}" rx="${(x.width / 2) * k}" ry="${(x.height / 2) * k}" fill="${sansNull(x.fill, "#4472C4")}" stroke="${sansNull(x.lineColor, "none")}"/>`
      : `<rect x="${x.left * k}" y="${x.top * k}" width="${x.width * k}" height="${x.height * k}" fill="${x.ph || x.kind === "text" ? sansNull(x.fill, "none") : sansNull(x.fill, "#4472C4")}" stroke="${sansNull(x.lineColor, x.ph || x.kind === "text" ? "#ccc" : "none")}" stroke-width="${Math.max(0.5, (x.lineWeight ?? 1) * k)}" stroke-dasharray="${x.ph && !x.text ? "3 2" : ""}"/>`;
    const fs = Math.max(5, (x.fontSize ?? 18) * k);
    const anchor = { left: "start", center: "middle", right: "end" }[x.align ?? "left"] ?? "start";
    const tx = x.align === "center" ? x.left + x.width / 2 : x.align === "right" ? x.left + x.width - 4 : x.left + 4;
    const lines = String(x.text ?? "").split("\n");
    const total = lines.length * fs * 1.2;
    const y0 = x.valign === "middle" ? (x.top + x.height / 2) * k - total / 2 : x.valign === "bottom" ? (x.top + x.height) * k - total : x.top * k + 2;
    const text = x.text ? `<text font-family="${esc(x.fontName ?? "Calibri")}" font-size="${fs}" font-weight="${x.bold ? 700 : 400}" font-style="${x.italic ? "italic" : "normal"}" text-decoration="${x.underline ? "underline" : "none"}" fill="${x.color ?? "#000"}" text-anchor="${anchor}">${lines.map((l, n) => `<tspan x="${tx * k}" y="${y0 + fs * (1 + 1.2 * n) - fs * 0.15}">${esc(l)}</tspan>`).join("")}</text>` : "";
    return `<g${rot}>${geo}${text}</g>`;
  });
  return `<svg class="slide-svg" viewBox="0 0 ${width} ${H}" width="${width}" height="${H}" role="img" aria-label="Aperçu de la diapositive ${i + 1}"><rect width="${width}" height="${H}" fill="${s.bg ?? "#fff"}"/>${parts.join("")}</svg>`;
}
