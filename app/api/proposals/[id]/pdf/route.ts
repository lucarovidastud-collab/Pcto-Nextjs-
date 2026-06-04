import { NextRequest, NextResponse } from "next/server";
import { getProposalById } from "@/lib/db/repositories";
import { requireSession } from "@/lib/security/guard";
import { buildProposalPdfBuffer } from "@/lib/proposals/pdf-export";

type RouteProps = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteProps) {
  const auth = await requireSession(request);
  if (auth.error || !auth.session) return auth.error!;
  const { id } = await params;
  const proposal = await getProposalById(id, auth.session.tenantId);
  if (!proposal) return NextResponse.json({ error: "Proposta non trovata" }, { status: 404 });

  const buffer = buildProposalPdfBuffer({
    id,
    company: proposal.company,
    sector: proposal.sector,
    budget: proposal.budget,
    status: proposal.status,
    expiresAt: proposal.expiresAt,
    notes: proposal.notes,
    generatedHtml: proposal.generatedHtml
  });

  const safeName = proposal.company.replace(/[^\w.-]+/g, "_").slice(0, 60) || id;

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="preventivo-${safeName}.pdf"`
    }
  });
}
