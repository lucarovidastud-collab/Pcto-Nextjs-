import { loadStripe, type Stripe } from "@stripe/stripe-js";

let stripePromise: Promise<Stripe | null> | null = null;

export function getStripePublishable() {
  const key = (process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "").trim();
  if (!key.startsWith("pk_")) return null;
  if (!stripePromise) {
    stripePromise = loadStripe(key);
  }
  return stripePromise;
}

export function canUseEmbeddedCheckout() {
  return Boolean((process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "").trim().startsWith("pk_"));
}
