import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/security/guard";
import { createWorkspaceInvite, countWorkspaceMembers, getSubscriptionForTenant } from "@/lib/db/repositories";
import { getPlanLimits, isSubscriptionActive } from "@/lib/billing/plans";
import type { Role } from "@/lib/db/types";
import { z } from "zod";

const schema = z.object({
  role: z.enum(["admin", "editor", "viewer"]).default("editor")
});

export async function POST(request: NextRequest) {
  const auth = await requireSession(request);
  if (auth.error || !auth.session) return auth.error!;

  if (auth.session.role !== "owner" && auth.session.role !== "admin") {
    return NextResponse.json({ error: "Permessi insufficienti" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Ruolo non valido" }, { status: 400 });
  }

  const { tenantId } = auth.session;

  // Check member limit
  const subscription = await getSubscriptionForTenant(tenantId);
  if (!isSubscriptionActive(subscription.status)) {
    return NextResponse.json({ error: "Serve un piano attivo per invitare membri" }, { status: 403 });
  }

  const limits = getPlanLimits(subscription.plan);
  if (limits) {
    const memberCount = await countWorkspaceMembers(tenantId);
    if (memberCount >= limits.memberLimit) {
      return NextResponse.json({
        error: `Limite membri raggiunto per il piano ${subscription.plan} (${limits.memberLimit} massimo)`
      }, { status: 403 });
    }
  }

  const invite = await createWorkspaceInvite(tenantId, auth.session.userId, parsed.data.role as Role);
  const baseUrl = request.nextUrl.origin;
  const inviteUrl = `${baseUrl}/invite/${invite.token}`;

  return NextResponse.json({ invite, url: inviteUrl });
}
