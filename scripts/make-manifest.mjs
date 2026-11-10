// Génère les deux manifests à partir de src/manifest.js :
//  - manifest.local.xml : test local (https://localhost:3000, identifiant de TEST) ;
//  - manifest.prod.xml  : version en ligne (https://slidesdojo.vercel.app, identifiant définitif), prête à télécharger depuis GitHub si /install pose problème.
import fs from "node:fs";
import { buildManifest, DEV_ID, HOSTED_ID, HOSTED_URL } from "../src/manifest.js";
fs.writeFileSync("manifest.local.xml", buildManifest("https://localhost:3000/", DEV_ID));
fs.writeFileSync("manifest.prod.xml", buildManifest(HOSTED_URL, HOSTED_ID));
console.log("manifest.local.xml et manifest.prod.xml écrits.");
