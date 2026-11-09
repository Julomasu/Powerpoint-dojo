// Génère de petites icônes PNG (sans dépendance) : un carré orange PowerPoint avec une diapositive blanche.
import fs from "node:fs";
import zlib from "node:zlib";

function crc32(buf) {
  let c, crc = ~0;
  for (let n = 0; n < buf.length; n++) {
    c = (crc ^ buf[n]) & 0xff;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crc = (crc >>> 8) ^ c;
  }
  return ~crc >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function png(size) {
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    for (let x = 0; x < size; x++) {
      const i = y * (size * 4 + 1) + 1 + x * 4;
      const u = x / size, v = y / size;
      // fond orange, cadre de diapositive blanc avec deux lignes de texte
      const inside = u > 0.15 && u < 0.85 && v > 0.22 && v < 0.78;
      const border = inside && (Math.abs(u - 0.15) < 0.04 || Math.abs(u - 0.85) < 0.04 || Math.abs(v - 0.22) < 0.04 || Math.abs(v - 0.78) < 0.04);
      const bar = (u > 0.27 && u < 0.73 && Math.abs(v - 0.42) < 0.035) || (u > 0.27 && u < 0.55 && Math.abs(v - 0.58) < 0.035);
      const white = border || bar;
      const [r, g, b] = white ? [255, 255, 255] : [196, 62, 28];
      raw.set([r, g, b, 255], i);
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

fs.mkdirSync("public/assets", { recursive: true });
for (const s of [16, 32, 64, 80, 128]) fs.writeFileSync(`public/assets/icon-${s}.png`, png(s));
console.log("Icônes générées dans public/assets");
