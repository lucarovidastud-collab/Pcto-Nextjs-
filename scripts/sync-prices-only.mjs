import { execSync } from "node:child_process";
import fs from "node:fs";

const keysToSync = [
  "STRIPE_PRICE_STARTER",
  "STRIPE_PRICE_GROWTH",
  "STRIPE_PRICE_ENTERPRISE"
];

function parseEnv(content) {
  const map = new Map();
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const idx = line.indexOf("=");
    if (idx <= 0) continue;
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1).replace(/\\n/g, "\n");
    }
    map.set(key, value);
  }
  return map;
}

const envMap = parseEnv(fs.readFileSync(".env", "utf8"));

for (const key of keysToSync) {
  const value = envMap.get(key);
  if (!value) {
    console.warn(`[skip] ${key} missing in .env`);
    continue;
  }
  try {
    console.log(`Removing ${key}...`);
    execSync(`npx vercel env rm ${key} production --yes`, { stdio: "ignore" });
  } catch {
    // ignore if missing
  }
  console.log(`Adding ${key}...`);
  execSync(`npx vercel env add ${key} production`, {
    input: value,
    stdio: ["pipe", "inherit", "inherit"]
  });
  console.log(`[ok] ${key}`);
}
