import { NextRequest, NextResponse } from "next/server";
import { getSubscriptionForTenant } from "@/lib/db/repositories";
import { requireSession } from "@/lib/security/guard";
import { createCustomerPortalSession } from "@/lib/services/billing";

export async function POST(request: NextRequest) {
  const auth = await requireSession(request);
  if (auth.error || !auth.session) return auth.error!;

  const subscription = await getSubscriptionForTenant(auth.session.tenantId);
  const customerId = subscription.stripeCustomerId || "";
  if (/^(cus|sub)_(sandbox|fallback)_/i.test(customerId)) {
    return NextResponse.json(
      {
        error:
          "Il portale Stripe è disponibile dopo un abbonamento reale. Scegli un piano con checkout Stripe (non in modalità demo)."
      },
      { status: 400 }
    );
  }

  try {
    const session = await createCustomerPortalSession(auth.session.tenantId, auth.session.email, request.nextUrl.origin);
    return NextResponse.json({ url: session.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Portale clienti non disponibile";
    console.error("[billing.portal]", message, error);
    const status = message.includes("non configurato") ? 503 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
