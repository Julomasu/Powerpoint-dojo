import { defineConfig } from "vite";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

// PowerPoint exige du HTTPS, même en local. Les certificats viennent de `npm run certs`.
const certDir = path.join(os.homedir(), ".office-addin-dev-certs");
const keyFile = path.join(certDir, "localhost.key");
const certFile = path.join(certDir, "localhost.crt");
const https =
  fs.existsSync(keyFile) && fs.existsSync(certFile)
    ? { key: fs.readFileSync(keyFile), cert: fs.readFileSync(certFile) }
    : undefined;

if (!https) {
  console.warn("\n⚠  Pas de certificat HTTPS : lance `npm run certs` pour utiliser le site dans PowerPoint.\n");
}

// Réservé au serveur de développement : permet de piloter l'add-in sans cliquer (contrôle qualité lancé par Claude).
//   GET  /__dojo/cmd     rend (une fois) le contenu de .dojo-cmd.json s'il existe
//   POST /__dojo/report  écrit le corps reçu dans .dojo-report.txt
const devBridge = {
  name: "dojo-dev-bridge",
  apply: "serve",
  configureServer(server) {
    const cmd = path.resolve(".dojo-cmd.json");
    const report = path.resolve(".dojo-report.txt");
    server.middlewares.use("/__dojo/cmd", (_req, res) => {
      res.setHeader("Content-Type", "application/json");
      if (fs.existsSync(cmd)) {
        res.end(fs.readFileSync(cmd, "utf8"));
        fs.unlinkSync(cmd);
      } else res.end("{}");
    });
    server.middlewares.use("/__dojo/report", (req, res) => {
      let body = "";
      req.on("data", (c) => (body += c));
      req.on("end", () => {
        fs.writeFileSync(report, body);
        res.end("ok");
      });
    });
  },
};

export default defineConfig({
  plugins: [devBridge],
  // DOJO_HTTP=1 : serveur HTTP simple (pour tester dans un navigateur sans certificat)
  server: { port: Number(process.env.PORT || 3000), strictPort: true, https: process.env.DOJO_HTTP ? undefined : https },
  base: "./",
  build: { target: "es2019", rollupOptions: { input: { main: "index.html", install: "install.html" } } },
});
