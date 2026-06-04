import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminSession } from "@/lib/security/admin-guard";
import {
  isAdminAssignablePlan,
  statusForAdminPlan
} from "@/lib/admin/subscription-plans";
import { setSubscriptionForTenant, getSubscriptionForTenant } from "@/lib/db/repositories";

const schema = z.object({
  plan: z.string().min(1)
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminSession();
    const { id: tenantId } = await params;

    const body = await req.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Piano non valido." }, { status: 400 });
    }

    const plan = parsed.data.plan.trim().toLowerCase();
    if (!isAdminAssignablePlan(plan)) {
      return NextResponse.json({ error: "Piano non supportato." }, { status: 400 });
    }

    const status = statusForAdminPlan(plan);
    const current = await getSubscriptionForTenant(tenantId);

    await setSubscriptionForTenant(tenantId, {
      plan,
      status,
      stripeCustomerId: current.stripeCustomerId,
      stripeSubscriptionId: current.stripeSubscriptionId
    });

    return NextResponse.json({ ok: true, plan, status });
  } catch {
    return NextResponse.json({ error: "Unauthorized or failed." }, { status: 401 });
  }
}
