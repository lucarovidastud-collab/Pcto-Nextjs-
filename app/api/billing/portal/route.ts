import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/security/guard";
import { createCustomerPortalSession } from "@/lib/services/billing";

export async function POST(request: NextRequest) {
  const auth = await requireSession(request);
  if (auth.error || !auth.session) return auth.error!;

  try {
    const session = await createCustomerPortalSession(auth.session.tenantId, auth.session.email);
    return NextResponse.json({ url: session.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Portale clienti non disponibile";
    console.error("[billing.portal]", message, error);
    const status = message.includes("non configurato") ? 503 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
