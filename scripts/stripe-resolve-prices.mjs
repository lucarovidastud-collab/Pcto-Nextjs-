/**
 * Risolve STRIPE_PRICE_* (price_ o prod_) in Price ID ricorrenti mensili.
 * Uso: node scripts/stripe-resolve-prices.mjs
 */
import fs from "node:fs";
import Stripe from "stripe";

function loadEnv() {
  const map = new Map();
  for (const line of fs.readFileSync(".env", "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i > 0) map.set(t.slice(0, i).trim(), t.slice(i + 1).trim());
  }
  return map;
}

async function resolvePrice(stripe, plan, ref, monthlyEur) {
  if (!ref) return null;
  if (ref.startsWith("price_")) return ref;
  if (!ref.startsWith("prod_")) {
    console.warn(`[${plan}] valore non valido: ${ref}`);
    return null;
  }
  const listed = await stripe.prices.list({ product: ref, active: true, limit: 20 });
  const monthly = listed.data.find((p) => p.recurring?.interval === "month" && p.active);
  if (monthly) return monthly.id;
  const created = await stripe.prices.create({
    product: ref,
    currency: "eur",
    unit_amount: monthlyEur * 100,
    recurring: { interval: "month" },
    lookup_key: `quotegen_${plan}_monthly_eur`,
    metadata: { quotegen_plan: plan }
  });
  return created.id;
}

const env = loadEnv();
const secret = env.get("STRIPE_SECRET_KEY");
if (!secret?.startsWith("sk_")) {
  console.error("STRIPE_SECRET_KEY mancante in .env");
  process.exit(1);
}

const stripe = new Stripe(secret);
const plans = [
  ["starter", env.get("STRIPE_PRICE_STARTER"), 10],
  ["growth", env.get("STRIPE_PRICE_GROWTH"), 29],
  ["enterprise", env.get("STRIPE_PRICE_ENTERPRISE"), 99]
];

console.log("# Copia questi valori in .env e Vercel (devono iniziare con price_):\n");
for (const [plan, ref, amount] of plans) {
  const priceId = await resolvePrice(stripe, plan, ref, amount);
  console.log(`STRIPE_PRICE_${plan.toUpperCase()}=${priceId || "(risoluzione fallita)"}`);
}
