import fs from "node:fs";
import Stripe from "stripe";

function loadEnv() {
  const map = new Map();
  for (const line of fs.readFileSync(".env", "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx <= 0) continue;
    map.set(trimmed.slice(0, idx), trimmed.slice(idx + 1));
  }
  return map;
}

const env = loadEnv();
const secret = env.get("STRIPE_SECRET_KEY") || "";
const appUrl = env.get("APP_URL") || "http://localhost:3000";

if (!secret.startsWith("sk_")) {
  console.error("STRIPE_SECRET_KEY mancante o non valida");
  process.exit(1);
}

const stripe = new Stripe(secret);
const mode = secret.includes("_live_") ? "live" : "test";

console.log(`Stripe mode: ${mode}`);
console.log(`APP_URL: ${appUrl}`);

try {
  const account = await stripe.accounts.retrieve();
  console.log(`Account: ${account.id}`);
  console.log(`Charges enabled: ${account.charges_enabled}`);
  console.log(`Payouts enabled: ${account.payouts_enabled}`);
} catch (error) {
  console.error("Account retrieve failed:", error.message);
}

try {
  const customer = await stripe.customers.create({
    email: "stripe-diagnose@quotegen.local",
    metadata: { diagnose: "true" }
  });
  console.log(`Test customer: ${customer.id}`);

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customer.id,
    line_items: [
      {
        price_data: {
          currency: "eur",
          unit_amount: 2900,
          recurring: { interval: "month" },
          product_data: { name: "QuoteGen starter (diagnose)" }
        },
        quantity: 1
      }
    ],
    success_url: `${appUrl}/dashboard/billing?checkout=success`,
    cancel_url: `${appUrl}/dashboard/billing?checkout=cancel`
  });
  console.log(`Checkout session OK: ${session.id}`);
  console.log(`Checkout URL: ${session.url ? "yes" : "no"}`);
} catch (error) {
  console.error("Checkout session FAILED:", error.message);
  if (error.raw) console.error("Code:", error.raw.code, "Type:", error.raw.type);
  process.exit(1);
}

try {
  let portal = await stripe.billingPortal.configurations.list({ limit: 1 });
  if (!portal.data.length) {
    await stripe.billingPortal.configurations.create({
      business_profile: { headline: "QuoteGen Engine — gestione abbonamento" },
      features: {
        payment_method_update: { enabled: true },
        invoice_history: { enabled: true },
        subscription_cancel: { enabled: true, mode: "at_period_end" }
      }
    });
    portal = await stripe.billingPortal.configurations.list({ limit: 1 });
    console.log("Customer portal: CREATED automatically");
  } else {
    console.log("Customer portal: configured");
  }
} catch (error) {
  console.warn("Portal check:", error.message);
}

console.log("Diagnose complete.");
