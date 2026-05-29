import { NextRequest, NextResponse } from "next/server";
import { getSubscriptionForTenant, setSubscriptionForTenant } from "@/lib/db/repositories";
import { requireSession } from "@/lib/security/guard";
import { createCheckoutSession, getPlanLimits, planCatalog, type PlanName, stripe } from "@/lib/services/billing";
import { z } from "zod";

const schema = z.object({
  plan: z.enum(["starter", "growth", "enterprise"]),
  sandbox: z.boolean().optional()
});

export async function GET(request: NextRequest) {
  const auth = await requireSession(request);
  if (auth.error || !auth.session) return auth.error!;
  const subscription = await getSubscriptionForTenant(auth.session.tenantId);
  return NextResponse.json({
    current: subscription,
    limits: getPlanLimits(subscription.plan),
    catalog: planCatalog
  });
}

export async function POST(request: NextRequest) {
  const auth = await requireSession(request);
  if (auth.error || !auth.session) return auth.error!;
  if (auth.session.role !== "owner" && auth.session.role !== "admin") {
    return NextResponse.json({ error: "Permessi insufficienti" }, { status: 403 });
  }

  const allowSandbox = process.env.NODE_ENV !== "production" || process.env.BILLING_ALLOW_SANDBOX === "1";

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Piano non valido" }, { status: 400 });
  }

  if (parsed.data.sandbox && !allowSandbox) {
    return NextResponse.json({ error: "Sandbox non disponibile" }, { status: 403 });
  }

  if (!stripe) {
    if (!allowSandbox) {
      return NextResponse.json({ error: "Stripe non configurato" }, { status: 503 });
    }
    await setSubscriptionForTenant(auth.session.tenantId, {
      plan: parsed.data.plan,
      status: "active",
      stripeCustomerId: "cus_sandbox_" + auth.session.tenantId,
      stripeSubscriptionId: "sub_sandbox_" + auth.session.tenantId
    });
    return NextResponse.json({
      url: `${process.env.APP_URL || "http://localhost:3000"}/dashboard/billing?checkout=success&plan=${parsed.data.plan}`
    });
  }

  if (parsed.data.sandbox) {
    await setSubscriptionForTenant(auth.session.tenantId, {
      plan: parsed.data.plan,
      status: "active",
      stripeCustomerId: "cus_sandbox_" + auth.session.tenantId,
      stripeSubscriptionId: "sub_sandbox_" + auth.session.tenantId
    });
    return NextResponse.json({
      url: `${process.env.APP_URL || "http://localhost:3000"}/dashboard/billing?checkout=success&plan=${parsed.data.plan}`
    });
  }

  try {
    const session = await createCheckoutSession({
      tenantId: auth.session.tenantId,
      email: auth.session.email,
      plan: parsed.data.plan as PlanName
    });
    return NextResponse.json({ url: session.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Checkout Stripe fallito";
    if (!allowSandbox) {
      console.warn("[billing.checkout] Stripe failed:", message);
      return NextResponse.json({ error: message }, { status: 502 });
    }

    console.warn("[billing.checkout] Stripe failed, falling back to sandbox:", message);
    await setSubscriptionForTenant(auth.session.tenantId, {
      plan: parsed.data.plan,
      status: "active",
      stripeCustomerId: "cus_fallback_" + auth.session.tenantId,
      stripeSubscriptionId: "sub_fallback_" + auth.session.tenantId
    });
    return NextResponse.json({
      url: `${process.env.APP_URL || "http://localhost:3000"}/dashboard/billing?checkout=success&plan=${parsed.data.plan}`
    });
  }
}
