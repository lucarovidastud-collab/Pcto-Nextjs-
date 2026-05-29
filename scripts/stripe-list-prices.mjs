/**
 * Script: stripe-list-prices.mjs
 * Lista tutti i prodotti e i loro price ID da Stripe,
 * per identificare i price_xxx da aggiungere al .env
 */
import fs from "node:fs";
import Stripe from "stripe";

function loadEnv() {
  const map = new Map();
  for (const line of fs.readFileSync(".env", "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx <= 0) continue;
    let value = trimmed.slice(idx + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1).replace(/\\n/g, "\n");
    }
    map.set(trimmed.slice(0, idx).trim(), value);
  }
  return map;
}

const env = loadEnv();
const secret = env.get("STRIPE_SECRET_KEY") || "";

if (!secret.startsWith("sk_")) {
  console.error("STRIPE_SECRET_KEY mancante o non valida nel file .env");
  process.exit(1);
}

const stripe = new Stripe(secret);
const mode = secret.includes("_live_") ? "LIVE" : "TEST";
console.log(`\n=== Stripe ${mode} Mode ===\n`);

// Lista tutti i prodotti attivi
const products = await stripe.products.list({ active: true, limit: 20 });
console.log(`Prodotti trovati: ${products.data.length}\n`);

const result = {};

for (const product of products.data) {
  console.log(`Prodotto: "${product.name}" (${product.id})`);
  
  // Lista i prezzi di ogni prodotto
  const prices = await stripe.prices.list({ product: product.id, active: true, limit: 10 });
  
  for (const price of prices.data) {
    const amount = price.unit_amount ? `€${price.unit_amount / 100}` : "N/A";
    const interval = price.recurring?.interval || "one-time";
    console.log(`  ↳ Price ID: ${price.id}  |  ${amount}/${interval}  |  ${price.currency.toUpperCase()}`);
    
    if (price.recurring?.interval === "month") {
      result[product.name] = { productId: product.id, priceId: price.id, amount };
    }
  }
  console.log();
}

console.log("=== RISULTATO: Aggiungi queste righe al .env ===\n");

// Tenta di mappare automaticamente ai piani
const planMapping = {
  starter: null,
  growth: null,
  enterprise: null,
};

for (const [name, info] of Object.entries(result)) {
  const lower = name.toLowerCase();
  if (lower.includes("starter")) {
    planMapping.starter = info.priceId;
    console.log(`STRIPE_PRICE_STARTER=${info.priceId}   # ${name} ${info.amount}/mese`);
  } else if (lower.includes("growth")) {
    planMapping.growth = info.priceId;
    console.log(`STRIPE_PRICE_GROWTH=${info.priceId}   # ${name} ${info.amount}/mese`);
  } else if (lower.includes("enterprise")) {
    planMapping.enterprise = info.priceId;
    console.log(`STRIPE_PRICE_ENTERPRISE=${info.priceId}   # ${name} ${info.amount}/mese`);
  } else if (lower.includes("price_starter")) {
    planMapping.starter = info.priceId;
    console.log(`STRIPE_PRICE_STARTER=${info.priceId}   # ${name} ${info.amount}/mese`);
  } else if (lower.includes("price_growth")) {
    planMapping.growth = info.priceId;
    console.log(`STRIPE_PRICE_GROWTH=${info.priceId}   # ${name} ${info.amount}/mese`);
  } else if (lower.includes("price_enterprise")) {
    planMapping.enterprise = info.priceId;
    console.log(`STRIPE_PRICE_ENTERPRISE=${info.priceId}   # ${name} ${info.amount}/mese`);
  } else {
    console.log(`# NON RICONOSCIUTO: ${name} -> ${info.priceId} (${info.amount}/mese) -- assegnalo manualmente`);
  }
}

console.log("\n=== FINE ===\n");
