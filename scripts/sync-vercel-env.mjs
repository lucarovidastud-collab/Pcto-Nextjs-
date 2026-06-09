import { execSync } from "node:child_process";
import fs from "node:fs";

const keysToSync = [
  "APP_URL",
  "JWT_SECRET",
  "GOOGLE_API_KEY",
  "VERTEX_API_KEY",
  "VERTEX_PROJECT_ID",
  "VERTEX_LOCATION",
  "VERTEX_AUTH_MODE",
  "VERTEX_SERVICE_ACCOUNT_JSON",
  "GEMINI_MODEL",
  "GEMINI_FAST_MODEL",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
  "STRIPE_PRICE_STARTER",
  "STRIPE_PRICE_GROWTH",
  "STRIPE_PRICE_ENTERPRISE",
  "NEXT_PUBLIC_FIREBASE_API_KEY",
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
  "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  "NEXT_PUBLIC_FIREBASE_APP_ID",
  "NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID",
  "FIREBASE_PROJECT_ID",
  "FIREBASE_CLIENT_EMAIL",
  "FIREBASE_PRIVATE_KEY",
  "SENTRY_AUTH_TOKEN",
  "NEXT_PUBLIC_SENTRY_DSN",
  "SENTRY_DSN"
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
    execSync(`npx vercel env rm ${key} production --yes`, { stdio: "ignore" });
  } catch {
    // ignore if missing
  }
  execSync(`npx vercel env add ${key} production`, {
    input: value,
    stdio: ["pipe", "inherit", "inherit"]
  });
  console.log(`[ok] ${key}`);
}
