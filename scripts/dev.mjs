// Lance Vite en gardant son entrée standard ouverte : sans ça, Vite se ferme tout seul
// quand il est lancé par un autre programme ou depuis un terminal intégré.
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const vite = fileURLToPath(new URL("../node_modules/vite/bin/vite.js", import.meta.url));
const child = spawn(process.execPath, [vite, ...process.argv.slice(2)], { stdio: ["pipe", "inherit", "inherit"] });
child.on("exit", (code) => process.exit(code ?? 0));
for (const sig of ["SIGINT", "SIGTERM"]) process.on(sig, () => child.kill(sig));
