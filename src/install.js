// Page d'installation : fabrique le fichier manifest.xml pour l'adresse où le Dojo est publié, puis explique comment l'ajouter à PowerPoint.
import "./style.css";
import { buildManifest } from "./manifest.js";

const base = new URL("./", location.href).href; // dossier qui contient cette page
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

  <details class="settings"><summary>🪟 PowerPoint pour Windows</summary>
    <ol class="steps">
      <li>Télécharge <code>manifest.xml</code> avec le bouton ci-dessus.</li>
      <li><b>Méthode rapide :</b> Insertion → Compléments → Mes compléments → <b>Gérer mes compléments ▾ → Charger mon complément</b>, choisis le fichier.</li>
      <li><b>Méthode durable (dossier réseau) :</b> crée un dossier (par ex. <code>C:\\Dojo</code>), mets-y <code>manifest.xml</code>, clic droit → Propriétés → Partage → Partager. Dans PowerPoint : Fichier → Options → Centre de gestion de la confidentialité → Paramètres du Centre de gestion → <b>Catalogues de compléments approuvés</b> → colle le chemin réseau (<code>\\\\NOM-PC\\Dojo</code>) → Ajouter un catalogue → coche « Afficher dans le menu ». Redémarre PowerPoint : Insertion → Mes compléments → <b>Dossier partagé</b>.</li>
      <li>Accueil → <b>Ouvrir le Dojo</b>.</li>
    </ol>
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

document.getElementById("dl").addEventListener("click", () => {
  const url = URL.createObjectURL(new Blob([buildManifest(base)], { type: "application/xml" }));
  const a = Object.assign(document.createElement("a"), { href: url, download: "manifest.xml" });
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});
