import { NextRequest, NextResponse } from "next/server";
import { getProposalById, updateProposal, type ProposalStatus } from "@/lib/db/repositories";
import { logger } from "@/lib/logger";
import { requireSession } from "@/lib/security/guard";
import { z } from "zod";

const patchSchema = z.object({
  status: z.enum(["draft", "review", "approved", "sent"]).optional(),
  expiresAt: z.string().optional(),
  internalNotes: z.string().max(4000).optional()
});

type RouteProps = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteProps) {
  const auth = await requireSession(request);
  if (auth.error || !auth.session) return auth.error!;
  const { id } = await params;
  const proposal = await getProposalById(id, auth.session.tenantId);
  if (!proposal) return NextResponse.json({ error: "Proposta non trovata" }, { status: 404 });
  return NextResponse.json({ proposal });
}

export async function PATCH(request: NextRequest, { params }: RouteProps) {
  const auth = await requireSession(request);
  if (auth.error || !auth.session) return auth.error!;
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Payload non valido" }, { status: 400 });

  if (!parsed.data.status && !parsed.data.expiresAt && parsed.data.internalNotes === undefined) {
    return NextResponse.json({ error: "Nessun campo da aggiornare" }, { status: 400 });
  }

  try {
    const updated = await updateProposal(id, auth.session.tenantId, {
      status: parsed.data.status as ProposalStatus | undefined,
      expiresAt: parsed.data.expiresAt,
      internalNotes: parsed.data.internalNotes
    });
    if (!updated) return NextResponse.json({ error: "Proposta non trovata" }, { status: 404 });
    return NextResponse.json({ proposal: updated });
  } catch (error) {
    logger.error({ error, proposalId: id }, "proposals.patch.failed");
    const message = error instanceof Error ? error.message : "Aggiornamento fallito";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
