// Génère manifest.xml (test local, https://localhost:3000) à partir de src/manifest.js.
import fs from "node:fs";
import { buildManifest, DEV_ID } from "../src/manifest.js";
fs.writeFileSync("manifest.xml", buildManifest("https://localhost:3000/", DEV_ID));
console.log("manifest.xml (local) écrit.");
