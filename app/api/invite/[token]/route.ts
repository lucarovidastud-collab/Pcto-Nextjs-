import { NextRequest, NextResponse } from "next/server";
import { getWorkspaceInvite, acceptWorkspaceInvite } from "@/lib/db/repositories";
import { readSession, createSessionToken, setSessionCookie } from "@/lib/security/session";

type RouteProps = { params: Promise<{ token: string }> };

export async function GET(_request: NextRequest, { params }: RouteProps) {
  const { token } = await params;
  const invite = await getWorkspaceInvite(token);
  if (!invite) return NextResponse.json({ error: "Invito non trovato o scaduto" }, { status: 404 });
  if (invite.usedAt) return NextResponse.json({ error: "Invito già utilizzato" }, { status: 410 });
  if (new Date(invite.expiresAt) < new Date()) {
    return NextResponse.json({ error: "Invito scaduto" }, { status: 410 });
  }
  return NextResponse.json({
    valid: true,
    tenantId: invite.tenantId,
    role: invite.role,
    expiresAt: invite.expiresAt
  });
}

export async function POST(request: NextRequest, { params }: RouteProps) {
  const { token } = await params;

  const session = await readSession();
  if (!session) {
    return NextResponse.json({ error: "Devi essere autenticato per accettare un invito" }, { status: 401 });
  }

  const result = await acceptWorkspaceInvite(token, session.userId, session.email);

  if ("error" in result) {
    const messages: Record<string, string> = {
      expired: "Invito scaduto o non trovato",
      already_used: "Invito già utilizzato",
      member_limit: "Limite membri del workspace raggiunto"
    };
    return NextResponse.json({ error: messages[result.error] ?? "Errore invito" }, { status: 400 });
  }

  // Update session to new workspace
  const newToken = await createSessionToken({
    userId: result.userId,
    tenantId: result.tenantId,
    role: result.role,
    email: result.email
  });

  const response = NextResponse.json({ ok: true, tenantId: result.tenantId });
  setSessionCookie(response, newToken);
  return response;
}
