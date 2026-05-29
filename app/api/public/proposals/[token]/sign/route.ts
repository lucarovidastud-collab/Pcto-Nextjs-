import { NextResponse } from "next/server";
import { signProposalByToken } from "@/lib/db/repositories";
import { z } from "zod";

const schema = z.object({ signedBy: z.string().min(2).max(120) });
type RouteProps = { params: Promise<{ token: string }> };

export async function POST(request: Request, { params }: RouteProps) {
  const { token } = await params;
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Nome firma non valido" }, { status: 400 });

  const result = await signProposalByToken(token, parsed.data.signedBy);
  if (!result) return NextResponse.json({ error: "Proposta non trovata" }, { status: 404 });
  if ("expired" in result) return NextResponse.json({ error: "Link scaduto" }, { status: 410 });
  return NextResponse.json({ ok: true });
}
