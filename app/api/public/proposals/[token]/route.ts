import { NextRequest, NextResponse } from "next/server";
import { getProposalByShareToken, incrementProposalViewCount } from "@/lib/db/repositories";

type RouteProps = { params: Promise<{ token: string }> };

export async function GET(request: NextRequest, { params }: RouteProps) {
  const { token } = await params;
  const proposal = await getProposalByShareToken(token);
  if (!proposal) return NextResponse.json({ error: "Proposta non trovata" }, { status: 404 });
  if (proposal.expiresAt && new Date(String(proposal.expiresAt)) < new Date()) {
    return NextResponse.json({ error: "Link scaduto" }, { status: 410 });
  }

  // Password-protected: require password query param
  if (proposal.password) {
    const suppliedPwd = request.nextUrl.searchParams.get("pwd");
    if (suppliedPwd !== proposal.password) {
      return NextResponse.json({ error: "password_required", passwordRequired: true }, { status: 401 });
    }
  }

  // Increment view count (fire-and-forget)
  void incrementProposalViewCount(token);

  return NextResponse.json({
    proposal: {
      company: proposal.company,
      sector: proposal.sector,
      budget: proposal.budget,
      palette: proposal.palette,
      style: proposal.style || "moderno",
      generatedHtml: proposal.generatedHtml,
      generatedDocument: proposal.generatedDocument || "",
      status: proposal.status,
      signedAt: proposal.signedAt,
      signedBy: proposal.signedBy,
      expiresAt: proposal.expiresAt,
      passwordRequired: false,
      clientComment: proposal.clientComment || ""
    }
  });
}
