import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/security/guard";
import { listWorkspaceMembers, removeWorkspaceMember } from "@/lib/db/repositories";
import { z } from "zod";

export async function GET(request: NextRequest) {
  const auth = await requireSession(request);
  if (auth.error || !auth.session) return auth.error!;

  const members = await listWorkspaceMembers(auth.session.tenantId);
  return NextResponse.json({ members });
}

const removeSchema = z.object({ userId: z.string().min(1) });

export async function DELETE(request: NextRequest) {
  const auth = await requireSession(request);
  if (auth.error || !auth.session) return auth.error!;

  if (auth.session.role !== "owner" && auth.session.role !== "admin") {
    return NextResponse.json({ error: "Permessi insufficienti" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = removeSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "userId mancante" }, { status: 400 });

  // Cannot remove owner
  if (parsed.data.userId === auth.session.userId && auth.session.role === "owner") {
    return NextResponse.json({ error: "Il proprietario non può essere rimosso" }, { status: 403 });
  }

  await removeWorkspaceMember(auth.session.tenantId, parsed.data.userId);
  return NextResponse.json({ ok: true });
}
