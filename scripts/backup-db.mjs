import fs from "node:fs";
import path from "node:path";

const source = path.join(process.cwd(), "data", "app.db");
const backupDir = path.join(process.cwd(), "data", "backups");
const target = path.join(backupDir, `app-${Date.now()}.db`);

if (!fs.existsSync(source)) {
  console.error("Database non trovato:", source);
  process.exit(1);
}

fs.mkdirSync(backupDir, { recursive: true });
fs.copyFileSync(source, target);
console.log("Backup creato:", target);
