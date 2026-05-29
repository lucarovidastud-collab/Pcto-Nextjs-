import { NextRequest, NextResponse } from "next/server";
import { createWorkspaceForUser, listWorkspacesForUser } from "@/lib/db/repositories";
import { requireSession } from "@/lib/security/guard";
import { createWorkspaceSchema } from "@/lib/validators";

export async function GET(request: NextRequest) {
  const auth = await requireSession(request);
  if (auth.error || !auth.session) return auth.error!;
  const workspaces = await listWorkspacesForUser(auth.session.userId);
  return NextResponse.json({ workspaces });
}

export async function POST(request: NextRequest) {
  const auth = await requireSession(request);
  if (auth.error || !auth.session) return auth.error!;
  const body = await request.json().catch(() => null);
  const parsed = createWorkspaceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Nome workspace non valido" }, { status: 400 });
  }
  const workspace = await createWorkspaceForUser(auth.session.userId, parsed.data.name);
  return NextResponse.json({ workspace }, { status: 201 });
}
