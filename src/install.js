// Page d'installation : fabrique le fichier manifest.xml pour l'adresse où le Dojo est publié, puis explique comment l'ajouter à PowerPoint.
import "./style.css";
import { buildManifest, HOSTED_ID } from "./manifest.js";

const base = new URL("./", location.href).href; // dossier qui contient cette page
// Commande PowerShell « tout-en-un » : écrit le manifest dans le profil de l'utilisateur ET le déclare dans le registre (sans droits administrateur).
// Le manifest est inclus dans la commande : on ne dépend plus du fichier téléchargé (risque de prendre un mauvais manifest.xml).
const psCommand = () => `$d = "$env:USERPROFILE\\PowerPointDojo"
New-Item -Force -ItemType Directory $d | Out-Null
$x = @'
${buildManifest(base)}'@
[IO.File]::WriteAllText("$d\\manifest.xml", $x, (New-Object System.Text.UTF8Encoding $false))
New-Item -Path "HKCU:\\Software\\Microsoft\\Office\\16.0\\WEF\\Developer" -Force | Out-Null
New-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Office\\16.0\\WEF\\Developer" -Name "${HOSTED_ID}" -Value "$d\\manifest.xml" -PropertyType String -Force | Out-Null
Select-String -Path "$d\\manifest.xml" -Pattern "<Id>|SourceLocation DefaultValue" | ForEach-Object { $_.Line.Trim() }`;

const isLocal = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
const app = document.getElementById("app");
app.innerHTML = `
  <h1>Installer PowerPoint Dojo</h1>
  <p class="sub">Une seule fois. Ensuite le Dojo s'ouvre dans PowerPoint (Mac, Windows ou PowerPoint sur le web) : plus de terminal, plus de certificat.</p>
  ${isLocal ? `<div class="result"><b>Tu es en local.</b><br>Cette page est faite pour la version en ligne : le fichier généré pointerait vers ${base}.</div>` : ""}
  <div class="row"><button class="btn primary" id="dl">⬇ Télécharger manifest.xml</button><span class="note" style="margin:0">Adresse du Dojo : ${base}</span></div>

  <details class="settings" open><summary>🍎 PowerPoint pour Mac</summary>
    <ol class="steps">
      <li>Télécharge <code>manifest.xml</code> avec le bouton ci-dessus.</li>
      <li>Dans le Finder, <b>Aller → Aller au dossier…</b> et colle <code>~/Library/Containers/com.microsoft.Powerpoint/Data/Documents/wef</code> (crée le dossier <code>wef</code> s'il n'existe pas), puis copie-y le fichier.</li>
      <li>Redémarre PowerPoint, ouvre une présentation, puis <b>Insertion → Compléments → Mes compléments → Dossier partagé</b> et choisis PowerPoint Dojo.</li>
      <li>Accueil → <b>Ouvrir le Dojo</b> (tout à droite du ruban).</li>
    </ol>
  </details>

  <details class="settings" open><summary>🪟 PowerPoint pour Windows (méthode qui marche sans droits administrateur)</summary>
    <ol class="steps">
      <li>Clique sur <b>Copier la commande PowerShell</b> : <button class="btn primary" id="copyps">Copier la commande PowerShell</button></li>
      <li>Ouvre <b>PowerShell</b> (menu Démarrer → tape « PowerShell »), colle avec clic droit, Entrée. Tu dois voir <code>&lt;Id&gt;${HOSTED_ID}&lt;/Id&gt;</code> et l'adresse <code>${base}index.html</code>.</li>
      <li>Ferme PowerPoint complètement (au besoin <code>Ctrl+Maj+Échap</code>), rouvre-le avec une présentation vide : <b>Accueil → Compléments</b> → section <b>Developer Add-ins</b> → PowerPoint Dojo.</li>
      <li>Accueil → <b>Ouvrir le Dojo</b>. Si rien ne change après une mise à jour : <code>Remove-Item -Recurse -Force "$env:LOCALAPPDATA\\Microsoft\\Office\\16.0\\Wef\\*"</code> puis redémarre PowerPoint.</li>
      <li>PowerShell ou le registre est bloqué par ton organisation ? Essaie plutôt la méthode ci-dessous, ou le mode fichier.</li>
    </ol>
    <details class="settings"><summary>Autres méthodes Windows</summary><ol class="steps">
      <li>Télécharge <code>manifest.xml</code> avec le bouton ci-dessus.</li>
      <li><b>Méthode rapide :</b> Insertion → Compléments → Mes compléments → <b>Gérer mes compléments ▾ → Charger mon complément</b>, choisis le fichier.</li>
      <li><b>Méthode durable (dossier réseau) :</b> crée un dossier (par ex. <code>C:\\Dojo</code>), mets-y <code>manifest.xml</code>, clic droit → Propriétés → Partage → Partager. Dans PowerPoint : Fichier → Options → Centre de gestion de la confidentialité → Paramètres du Centre de gestion → <b>Catalogues de compléments approuvés</b> → colle le chemin réseau (<code>\\\\NOM-PC\\Dojo</code>) → Ajouter un catalogue → coche « Afficher dans le menu ». Redémarre PowerPoint : Insertion → Mes compléments → <b>Dossier partagé</b>.</li>
      <li>Accueil → <b>Ouvrir le Dojo</b>.</li>
    </ol></details>
  </details>

  <details class="settings"><summary>🌐 PowerPoint sur le web</summary>
    <ol class="steps">
      <li>Ouvre une présentation sur powerpoint.office.com.</li>
      <li>Insertion → Compléments → Plus de compléments → <b>Mes compléments → Gérer mes compléments → Charger mon complément</b> et choisis <code>manifest.xml</code>.</li>
    </ol>
  </details>

  <details class="settings"><summary>🩺 Vérifier que tout marche</summary>
    <p class="note">Dans le Dojo, onglet <b>Moi</b> → <b>Diagnostic de ton PowerPoint</b> : il teste en quelques secondes ce que ton PowerPoint sait lire et écrire (formes, couleurs, groupes, arrière-plan…).</p>
  </details>
  <p class="note"><a href="${base}">Ouvrir le Dojo dans le navigateur</a> (mode fichier : télécharger un exercice, le faire dans PowerPoint, déposer le fichier).</p>`;

document.getElementById("copyps").addEventListener("click", async (ev) => {
  const btn = ev.currentTarget;
  try { await navigator.clipboard.writeText(psCommand()); btn.textContent = "Commande copiée ✓"; }
  catch {
    const t = Object.assign(document.createElement("textarea"), { value: psCommand(), rows: 6, style: "width:100%" });
    btn.after(t); t.select(); btn.textContent = "Copie la commande ci-dessous (Ctrl+C)";
  }
});

document.getElementById("dl").addEventListener("click", () => {
  const url = URL.createObjectURL(new Blob([buildManifest(base)], { type: "application/xml" }));
  const a = Object.assign(document.createElement("a"), { href: url, download: "manifest.xml" });
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});
