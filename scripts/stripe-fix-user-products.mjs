import fs from "node:fs";
import Stripe from "stripe";

const env = new Map();
for (const line of fs.readFileSync(".env", "utf8").split(/\r?\n/)) {
  const t = line.trim();
  if (!t || t.startsWith("#")) continue;
  const i = t.indexOf("=");
  if (i > 0) env.set(t.slice(0, i), t.slice(i + 1));
}

const stripe = new Stripe(env.get("STRIPE_SECRET_KEY"));
const products = {
  starter: "prod_UbJaGspnmcORH3",
  growth: "prod_UbKy4zojWfYsG9",
  enterprise: "prod_UbJbWRAAsdOpWp"
};
const amounts = { starter: 29, growth: 99, enterprise: 399 };

for (const [plan, productId] of Object.entries(products)) {
  const listed = await stripe.prices.list({ product: productId, active: true, limit: 20 });
  let priceId = listed.data.find((p) => p.recurring?.interval === "month")?.id;
  if (!priceId) {
    const created = await stripe.prices.create({
      product: productId,
      currency: "eur",
      unit_amount: amounts[plan] * 100,
      recurring: { interval: "month" },
      lookup_key: `quotegen_${plan}_monthly_eur`
    });
    priceId = created.id;
    console.log(`[created] ${plan} ${priceId} on ${productId}`);
  } else {
    console.log(`[found] ${plan} ${priceId} on ${productId}`);
  }
}
