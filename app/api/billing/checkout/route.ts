import { NextRequest, NextResponse } from "next/server";
import { getSubscriptionForTenant, setSubscriptionForTenant } from "@/lib/db/repositories";
import { requireSession } from "@/lib/security/guard";
import { isBillingSandboxEnabled } from "@/lib/billing/sandbox";
import { getProposalUsage } from "@/lib/billing/entitlements";
import { getPlanLimits, isSubscriptionActive } from "@/lib/billing/plans";
import { createCheckoutSession, planCatalog, type PlanName, stripe } from "@/lib/services/billing";
import { z } from "zod";

const schema = z.object({
  plan: z.enum(["starter", "growth", "enterprise"]),
  sandbox: z.boolean().optional(),
  embedded: z.boolean().optional()
});

export async function GET(request: NextRequest) {
  const auth = await requireSession(request);
  if (auth.error || !auth.session) return auth.error!;
  const subscription = await getSubscriptionForTenant(auth.session.tenantId);
  const limits = getPlanLimits(subscription.plan);
  const usage = await getProposalUsage(auth.session.tenantId);
  return NextResponse.json({
    current: subscription,
    limits,
    usage: {
      proposalsThisMonth: usage.used,
      periodStart: usage.periodStart
    },
    catalog: planCatalog,
    allowSandbox: isBillingSandboxEnabled(),
    hasActiveSubscription: limits !== null && isSubscriptionActive(subscription.status)
  });
}

export async function POST(request: NextRequest) {
  const auth = await requireSession(request);
  if (auth.error || !auth.session) return auth.error!;
  if (auth.session.role !== "owner" && auth.session.role !== "admin") {
    return NextResponse.json({ error: "Permessi insufficienti" }, { status: 403 });
  }

  const allowSandbox = isBillingSandboxEnabled();
  const baseUrl = request.nextUrl.origin;

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
      url: `${baseUrl}/dashboard/billing?checkout=success&plan=${parsed.data.plan}`
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
      url: `${baseUrl}/dashboard/billing?checkout=success&plan=${parsed.data.plan}`
    });
  }

  const acceptLang = request.headers.get("accept-language") ?? "";
  const primaryLang = acceptLang.split(",")[0]?.split(";")[0]?.split("-")[0]?.toLowerCase();
  const stripeLocales = new Set(["auto","bg","cs","da","de","el","en","en-GB","es","es-419","et","fi","fil","fr","fr-CA","hr","hu","id","it","ja","ko","lt","lv","ms","mt","nb","nl","pl","pt","pt-BR","ro","ru","sk","sl","sv","th","tr","vi","zh","zh-HK","zh-TW"]);
  const locale = stripeLocales.has(primaryLang) ? primaryLang : "auto";

  try {
    const session = await createCheckoutSession({
      tenantId: auth.session.tenantId,
      email: auth.session.email,
      plan: parsed.data.plan as PlanName,
      baseUrl,
      embedded: parsed.data.embedded,
      locale
    });

    if (parsed.data.embedded) {
      if (!session.client_secret) {
        return NextResponse.json({ error: "Sessione checkout non valida" }, { status: 502 });
      }
      return NextResponse.json({ clientSecret: session.client_secret });
    }

    if (!session.url) {
      return NextResponse.json({ error: "URL checkout non disponibile" }, { status: 502 });
    }
    return NextResponse.json({ url: session.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Checkout Stripe fallito";
    console.error("[billing.checkout] Stripe failed:", message, error);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
