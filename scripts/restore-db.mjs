import fs from "node:fs";
import path from "node:path";

const source = process.argv[2];
if (!source) {
  console.error("Uso: npm run restore:db -- <path_backup>");
  process.exit(1);
}

const target = path.join(process.cwd(), "data", "app.db");
if (!fs.existsSync(source)) {
  console.error("Backup non trovato:", source);
  process.exit(1);
}

fs.mkdirSync(path.dirname(target), { recursive: true });
fs.copyFileSync(source, target);
console.log("Database ripristinato da:", source);
