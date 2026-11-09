// Mode fichier (hors PowerPoint) : télécharger l'exercice en .pptx, le faire dans PowerPoint, déposer le fichier pour le corriger.
import { runOps } from "./deck.js";
import { writePptx, readPptx } from "./pptx.js";

export async function downloadExercise(ex) {
  const bytes = await writePptx(runOps(ex.setup));
  const url = URL.createObjectURL(new Blob([bytes], { type: "application/vnd.openxmlformats-officedocument.presentationml.presentation" }));
  const a = Object.assign(document.createElement("a"), { href: url, download: `${ex.id}.pptx` });
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export async function readUpload(file) {
  return readPptx(await file.arrayBuffer());
}
