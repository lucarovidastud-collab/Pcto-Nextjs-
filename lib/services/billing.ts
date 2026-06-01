import Stripe from "stripe";
import { getSubscriptionForTenant, setSubscriptionForTenant, setTenantStripeCustomer } from "@/lib/db/repositories";
import { getPlanLimits, planCatalog, type PlanName } from "@/lib/billing/plans";

export { getPlanLimits, planCatalog, type PlanName };

const stripeKey = process.env.STRIPE_SECRET_KEY || "";
export const stripe = stripeKey ? new Stripe(stripeKey) : null;

function normalizeBaseUrl(value: string) {
  let raw = value.trim();
  if (
    (raw.startsWith("`") && raw.endsWith("`")) ||
    (raw.startsWith('"') && raw.endsWith('"')) ||
    (raw.startsWith("'") && raw.endsWith("'"))
  ) {
    raw = raw.slice(1, -1).trim();
  }
  return raw || "http://localhost:3000";
}

function appUrl(fallback?: string) {
  return normalizeBaseUrl(process.env.APP_URL || fallback || "http://localhost:3000");
}

function stripeMode() {
  if (!stripeKey) return "missing";
  return stripeKey.includes("_live_") ? "live" : "test";
}

function configuredRefForPlan(plan: PlanName) {
  const map: Record<PlanName, string | undefined> = {
    starter: process.env.STRIPE_PRICE_STARTER || process.env.STRIPE_PRODUCT_STARTER,
    growth: process.env.STRIPE_PRICE_GROWTH || process.env.STRIPE_PRODUCT_GROWTH,
    enterprise: process.env.STRIPE_PRICE_ENTERPRISE || process.env.STRIPE_PRODUCT_ENTERPRISE
  };
  return map[plan]?.trim();
}

function isPriceId(value: string) {
  return /^price_[A-Za-z0-9]+$/.test(value);
}

function isProductId(value: string) {
  return /^prod_[A-Za-z0-9]+$/.test(value);
}

/** Accetta price_... oppure prod_... (crea/recupera prezzo mensile sul prodotto). */
async function resolveConfiguredRef(plan: PlanName, ref: string) {
  if (!stripe) throw new Error("Stripe non configurato");

  if (isPriceId(ref)) return ref;

  if (isProductId(ref)) {
    const listed = await stripe.prices.list({ product: ref, active: true, limit: 20 });
    const monthly = listed.data.find((p) => p.recurring?.interval === "month");
    if (monthly?.id) return monthly.id;

    const created = await stripe.prices.create({
      product: ref,
      currency: "eur",
      unit_amount: planCatalog[plan].monthly * 100,
      recurring: { interval: "month" },
      lookup_key: `quotegen_${plan}_monthly_eur`,
      metadata: { quotegen_plan: plan }
    });
    return created.id;
  }

  throw new Error(
    `STRIPE_PRICE_${plan.toUpperCase()} non valido (${ref}). Usa un ID price_... o prod_... da Stripe Dashboard.`
  );
}

/** Crea o recupera Price ID ricorrenti in Stripe (lookup_key stabile). */
export async function resolvePlanPriceId(plan: PlanName) {
  if (!stripe) throw new Error("Stripe non configurato");

  const configured = configuredRefForPlan(plan);
  if (configured) {
    try {
      return await resolveConfiguredRef(plan, configured);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Errore risoluzione prezzo";
      throw new Error(`Piano ${plan}: ${message}`);
    }
  }

  const lookupKey = `quotegen_${plan}_monthly_eur`;
  const existing = await stripe.prices.list({ lookup_keys: [lookupKey], active: true, limit: 1 });
  if (existing.data[0]?.id) return existing.data[0].id;

  const product = await stripe.products.create({
    name: `QuoteGen ${plan.charAt(0).toUpperCase()}${plan.slice(1)}`,
    metadata: { quotegen_plan: plan, app: "quotegen-engine" }
  });

  const price = await stripe.prices.create({
    currency: "eur",
    unit_amount: planCatalog[plan].monthly * 100,
    recurring: { interval: "month" },
    product: product.id,
    lookup_key: lookupKey,
    metadata: { quotegen_plan: plan }
  });

  return price.id;
}

let portalConfigReady = false;

export async function ensureBillingPortalConfiguration() {
  if (!stripe) throw new Error("Stripe non configurato");
  if (portalConfigReady) return;

  const configs = await stripe.billingPortal.configurations.list({ limit: 1 });
  if (configs.data.length > 0) {
    portalConfigReady = true;
    return;
  }

  await stripe.billingPortal.configurations.create({
    business_profile: {
      headline: "QuoteGen Engine — gestione abbonamento"
    },
    features: {
      payment_method_update: { enabled: true },
      invoice_history: { enabled: true },
      subscription_cancel: { enabled: true, mode: "at_period_end" }
    }
  });
  portalConfigReady = true;
}

export async function getBillingDiagnostics() {
  const webhookSecret = (process.env.STRIPE_WEBHOOK_SECRET || "").trim();
  const publishableKey = (process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "").trim();
  const allowSandbox = process.env.NODE_ENV !== "production" || process.env.BILLING_ALLOW_SANDBOX === "1";

  if (!stripe) {
    return {
      configured: false,
      mode: "missing" as const,
      webhookConfigured: webhookSecret.startsWith("whsec_"),
      publishableConfigured: publishableKey.startsWith("pk_"),
      allowSandbox,
      message: "STRIPE_SECRET_KEY non impostata"
    };
  }

  try {
    let chargesEnabled: boolean | undefined;
    let accountId: string | undefined;
    try {
      const account = await (stripe.accounts as any).retrieve();
      accountId = account.id;
      chargesEnabled = account.charges_enabled;
    } catch {
      chargesEnabled = undefined;
      accountId = undefined;
    }

    const portal = await stripe.billingPortal.configurations.list({ limit: 1 });
    const resolved: Record<string, string> = {};

    for (const plan of ["starter", "growth", "enterprise"] as PlanName[]) {
      const ref = configuredRefForPlan(plan);
      if (!ref) {
        resolved[plan] = "auto (lookup_key)";
        continue;
      }
      try {
        const priceId = await resolvePlanPriceId(plan);
        resolved[plan] = priceId;
      } catch (error) {
        resolved[plan] = error instanceof Error ? error.message : "errore";
      }
    }

    return {
      configured: true,
      mode: stripeMode(),
      accountId: accountId || null,
      chargesEnabled,
      portalConfigured: portal.data.length > 0,
      webhookConfigured: webhookSecret.startsWith("whsec_"),
      publishableConfigured: publishableKey.startsWith("pk_"),
      allowSandbox,
      configuredRefs: {
        starter: configuredRefForPlan("starter") || null,
        growth: configuredRefForPlan("growth") || null,
        enterprise: configuredRefForPlan("enterprise") || null
      },
      resolvedPriceIds: resolved,
      appUrl: appUrl()
    };
  } catch (error) {
    return {
      configured: true,
      mode: stripeMode(),
      webhookConfigured: webhookSecret.startsWith("whsec_"),
      publishableConfigured: publishableKey.startsWith("pk_"),
      allowSandbox,
      message: error instanceof Error ? error.message : "Errore diagnostica Stripe"
    };
  }
}

function isSimulatedStripeCustomerId(customerId: string) {
  return /^(cus|sub)_(sandbox|fallback)_/i.test(customerId);
}

export async function getOrCreateStripeCustomer(tenantId: string, email: string) {
  if (!stripe) throw new Error("Stripe non configurato");
  if (!email) throw new Error("Email utente mancante per Stripe");

  try {
    const sub = await getSubscriptionForTenant(tenantId);
    if (sub.stripeCustomerId && !isSimulatedStripeCustomerId(sub.stripeCustomerId)) {
      return sub.stripeCustomerId;
    }

    const customer = await stripe.customers.create({
      email,
      metadata: { tenantId }
    });
    await setTenantStripeCustomer(tenantId, customer.id);
    return customer.id;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Errore creazione cliente";
    if (message.includes("Firestore") || message.includes("Firebase")) {
      throw new Error(`Database non disponibile per billing: ${message}`);
    }
    throw error;
  }
}

export async function createCheckoutSession(input: {
  tenantId: string;
  email: string;
  plan: PlanName;
  baseUrl?: string;
}) {
  if (!stripe) throw new Error("Stripe non configurato");

  const customerId = await getOrCreateStripeCustomer(input.tenantId, input.email);
  const priceId = await resolvePlanPriceId(input.plan);
  const baseUrl = appUrl(input.baseUrl);

  try {
    return await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${baseUrl}/dashboard/billing?checkout=success&plan=${input.plan}`,
      cancel_url: `${baseUrl}/dashboard/billing?checkout=cancel`,
      metadata: { tenantId: input.tenantId, plan: input.plan },
      subscription_data: { metadata: { tenantId: input.tenantId, plan: input.plan } },
      allow_promotion_codes: true,
      billing_address_collection: "auto"
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Errore Stripe checkout";
    throw new Error(`Checkout non disponibile: ${message}`);
  }
}

export async function createCustomerPortalSession(tenantId: string, email: string, baseUrl?: string) {
  if (!stripe) throw new Error("Stripe non configurato");

  await ensureBillingPortalConfiguration();
  const customerId = await getOrCreateStripeCustomer(tenantId, email);
  const resolvedBase = appUrl(baseUrl);

  try {
    return await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${resolvedBase}/dashboard?billing=portal`
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Errore portale Stripe";
    throw new Error(`Portale abbonamento: ${message}`);
  }
}

export async function syncStripeSubscription(input: {
  tenantId: string;
  plan?: string;
  status?: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
}) {
  const current = await getSubscriptionForTenant(input.tenantId);
  await setSubscriptionForTenant(input.tenantId, {
    plan: input.plan || current.plan,
    status: input.status || current.status,
    stripeCustomerId: input.stripeCustomerId || current.stripeCustomerId,
    stripeSubscriptionId: input.stripeSubscriptionId || current.stripeSubscriptionId
  });
}

export async function planFromStripePrice(priceId?: string | null) {
  if (!priceId) return "starter";

  for (const plan of ["starter", "growth", "enterprise"] as PlanName[]) {
    const ref = configuredRefForPlan(plan);
    if (!ref) continue;
    if (ref === priceId) return plan;
    if (isProductId(ref)) {
      try {
        const resolved = await resolveConfiguredRef(plan, ref);
        if (resolved === priceId) return plan;
      } catch {
        // ignore
      }
    }
  }

  if (stripe) {
    try {
      const price = await stripe.prices.retrieve(priceId);
      const fromMeta = price.metadata?.quotegen_plan;
      if (fromMeta && fromMeta in planCatalog) return fromMeta as PlanName;
      const lookup = price.lookup_key || "";
      if (lookup.includes("growth")) return "growth";
      if (lookup.includes("enterprise")) return "enterprise";
      if (lookup.includes("starter")) return "starter";
      const productId = typeof price.product === "string" ? price.product : price.product?.id;
      if (productId === configuredRefForPlan("growth")) return "growth";
      if (productId === configuredRefForPlan("enterprise")) return "enterprise";
      if (productId === configuredRefForPlan("starter")) return "starter";
    } catch {
      // ignore
    }
  }
  return "starter";
}
