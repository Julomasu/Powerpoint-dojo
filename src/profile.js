// Profil détecté tout seul : système (Mac / Windows / PowerPoint web), version de PowerPoint, version de l'API.
export function detectOs() {
  try {
    const p = Office.context.platform; // PC | Mac | OfficeOnline | iOS | Android | Universal
    if (p === "Mac") return "mac";
    if (p === "OfficeOnline") return "web";
    if (p === "PC") return "win";
  } catch { /* hors Office */ }
  return /Mac|iPhone|iPad/i.test(navigator.platform || navigator.userAgent) ? "mac" : "win";
}
export const OS_LABEL = { mac: "Mac", win: "Windows", web: "PowerPoint sur le web" };
export function appInfo() {
  try {
    const d = Office.context.diagnostics ?? {};
    return { host: d.host ?? "", platform: d.platform ?? "", version: d.version ?? "" };
  } catch { return { host: "", platform: "", version: "" }; }
}
