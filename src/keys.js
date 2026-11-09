// Raccourcis clavier : {{Windows|Mac}} est remplacé selon le système de l'élève.
export const withKeys = (text, os) => String(text).replace(/\{\{([^|}]+)\|([^}]+)\}\}/g, (_, win, mac) => (os === "mac" ? mac : win));
export const hasKeys = (text) => /\{\{[^|}]+\|[^}]+\}\}/.test(text);
export const K = {
  newSlide: "{{Ctrl+M|⌘⇧N}}",
  dup: "{{Ctrl+D|⌘D}}",
  bold: "{{Ctrl+G|⌘B}}",
  italic: "{{Ctrl+I|⌘I}}",
  underline: "{{Ctrl+U|⌘U}}",
  selectAll: "{{Ctrl+A|⌘A}}",
  center: "{{Ctrl+E|⌘E}}",
  left: "{{Ctrl+L|⌘L}}",
  right: "{{Ctrl+R|⌘R}}",
  group: "{{Ctrl+Maj+G|⌘⌥G}}",
  ungroup: "{{Ctrl+Maj+H|⌘⌥⇧G}}",
  selection: "{{Alt+F10|⌥F10}}",
  present: "{{F5|⌘⇧Retour}}",
  copyFormat: "{{Ctrl+Maj+C|⌘⌥C}}",
  pasteFormat: "{{Ctrl+Maj+V|⌘⌥V}}",
  bigger: "{{Ctrl+Maj+>|⌘⇧>}}",
  smaller: "{{Ctrl+Maj+<|⌘⇧<}}",
  nudge: "{{Ctrl+Flèche|⌘Flèche}}",
};
export const ESSENTIALS = [
  ["Nouvelle diapositive", K.newSlide],
  ["Dupliquer la forme ou la diapositive", K.dup],
  ["Gras · italique · souligné", `${K.bold} · ${K.italic} · ${K.underline}`],
  ["Centrer · aligner à gauche · à droite", `${K.center} · ${K.left} · ${K.right}`],
  ["Grouper · dissocier", `${K.group} · ${K.ungroup}`],
  ["Volet Sélection (liste des formes)", K.selection],
  ["Copier / coller la mise en forme", `${K.copyFormat} · ${K.pasteFormat}`],
  ["Agrandir · réduire la police", `${K.bigger} · ${K.smaller}`],
  ["Déplacer une forme au pixel près", `${K.nudge}`],
  ["Lancer le diaporama", K.present],
];
