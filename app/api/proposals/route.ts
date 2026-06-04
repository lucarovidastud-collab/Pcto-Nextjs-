import { NextRequest, NextResponse } from "next/server";
import { listTenantProposals } from "@/lib/db/repositories";
import { assertCanCreateProposal } from "@/lib/billing/entitlements";
import { requireSession } from "@/lib/security/guard";
import { parseProposalRequest } from "@/lib/services/proposal-form";
import { buildAndSaveProposal } from "@/lib/services/proposal-pipeline";
import { proposalSlugError, slugifyProposalLink } from "@/lib/proposals/slug";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const auth = await requireSession(request);
  if (auth.error || !auth.session) return auth.error!;
  const proposals = await listTenantProposals(auth.session.tenantId);
  const summary = proposals.map((p) => ({
    id: p.id,
    company: p.company,
    sector: p.sector,
    budget: p.budget,
    status: p.status,
    shareToken: p.shareToken,
    website: p.website,
    createdAt: p.createdAt,
    expiresAt: p.expiresAt,
    signedAt: p.signedAt,
    signedBy: p.signedBy
  }));
  return NextResponse.json({ proposals: summary });
}

export async function POST(request: NextRequest) {
  const auth = await requireSession(request);
  if (auth.error || !auth.session) return auth.error!;

  const access = await assertCanCreateProposal(auth.session.tenantId);
  if (!access.allowed) {
    if (access.error.code === "proposal_limit_reached") {
      return NextResponse.json(
        {
          error: "proposal_limit_reached",
          used: access.error.used,
          limit: access.error.limit,
          plan: access.error.plan
        },
        { status: 403 }
      );
    }
    return NextResponse.json({ error: "subscription_required" }, { status: 403 });
  }

  const parsed = await parseProposalRequest(request);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: parsed.status });
  }

  const { company, website, sector, palette, notes, linkSlug, style } = parsed.data;

  if (notes.trim().length < 10) {
    return NextResponse.json({ error: "Documento troppo corto o non leggibile" }, { status: 400 });
  }

  if (linkSlug) {
    const slugErr = proposalSlugError(slugifyProposalLink(linkSlug));
    if (slugErr) {
      return NextResponse.json({ error: slugErr }, { status: 400 });
    }
  }

  try {
    const result = await buildAndSaveProposal({
      tenantId: auth.session.tenantId,
      company,
      website,
      sector,
      palette,
      notes,
      linkSlug,
      style
    });

    return NextResponse.json(
      {
        id: result.id,
        link: `/p/${result.shareToken}`,
        workspaceLink: `/workspace/proposals/${result.id}`,
        shareToken: result.shareToken,
        expiresAt: result.expiresAt,
        budget: result.budget,
        palette: result.palette,
        deployMessage: `Proposta creata. Budget stimato: € ${result.budget.toLocaleString("it-IT")}.`
      },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Errore generazione";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
