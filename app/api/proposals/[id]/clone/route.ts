import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/security/guard";
import { cloneProposal } from "@/lib/db/repositories";

type RouteProps = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: RouteProps) {
  const auth = await requireSession(request);
  if (auth.error || !auth.session) return auth.error!;
  const { id } = await params;

  const clone = await cloneProposal(id, auth.session.tenantId);
  if (!clone) return NextResponse.json({ error: "Proposta non trovata" }, { status: 404 });

  return NextResponse.json({ proposal: clone });
}
