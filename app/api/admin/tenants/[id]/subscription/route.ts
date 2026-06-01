import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/security/admin-guard";
import { setSubscriptionForTenant, getSubscriptionForTenant } from "@/lib/db/repositories";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    // 1. Authenticate Admin
    await requireAdminSession();
    const { id } = await params;
    
    // 2. Parse payload
    const body = await req.json().catch(() => null);
    const { plan, status } = body || {};

    if (!plan || !status) {
      return NextResponse.json({ error: "Piano e stato sono obbligatori." }, { status: 400 });
    }

    const tenantId = id;
    
    // 3. Update subscription
    const current = await getSubscriptionForTenant(tenantId);
    
    await setSubscriptionForTenant(tenantId, {
      plan,
      status,
      stripeCustomerId: current.stripeCustomerId,
      stripeSubscriptionId: current.stripeSubscriptionId
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: "Unauthorized or failed." }, { status: 401 });
  }
}
