import { NextResponse } from "next/server";
import { getProposalByShareToken } from "@/lib/db/repositories";

type RouteProps = { params: Promise<{ token: string }> };

export async function GET(_request: Request, { params }: RouteProps) {
  const { token } = await params;
  const proposal = await getProposalByShareToken(token);
  if (!proposal) return NextResponse.json({ error: "Proposta non trovata" }, { status: 404 });
  if (proposal.expiresAt && new Date(String(proposal.expiresAt)) < new Date()) {
    return NextResponse.json({ error: "Link scaduto" }, { status: 410 });
  }
  return NextResponse.json({
    proposal: {
      company: proposal.company,
      sector: proposal.sector,
      budget: proposal.budget,
      palette: proposal.palette,
      generatedHtml: proposal.generatedHtml,
      notes: proposal.notes,
      status: proposal.status,
      signedAt: proposal.signedAt,
      signedBy: proposal.signedBy,
      expiresAt: proposal.expiresAt
    }
  });
}
