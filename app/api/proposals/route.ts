import { NextRequest, NextResponse } from "next/server";
import { createProposal, listTenantProposals } from "@/lib/db/repositories";
import { requireSession } from "@/lib/security/guard";
import { analyzeWebsitePalette } from "@/lib/services/brand";
import { buildFallbackProposalHtml } from "@/lib/proposals/fallback-html";
import { estimateBudgetFromNotes } from "@/lib/services/proposal-estimate";
import { generateProposalHtmlWithAI } from "@/lib/services/proposal-ai";
import { resolveNotesFromSourceUrl } from "@/lib/services/source-notes";
import { formatReadableText } from "@/lib/utils/text";
import { createProposalSchema } from "@/lib/validators";

export async function GET(request: NextRequest) {
  const auth = await requireSession(request);
  if (auth.error || !auth.session) return auth.error!;
  const proposals = await listTenantProposals(auth.session.tenantId);
  return NextResponse.json({ proposals });
}

export async function POST(request: NextRequest) {
  const auth = await requireSession(request);
  if (auth.error || !auth.session) return auth.error!;
  const body = await request.json().catch(() => null);
  const parsed = createProposalSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Payload non valido" }, { status: 400 });
  }

  let notes = (parsed.data.notes || "").trim();
  const sourceUrl = parsed.data.sourceUrl;
  if (notes.length < 10 && sourceUrl) {
    try {
      notes = await resolveNotesFromSourceUrl(sourceUrl);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Impossibile leggere il contenuto dal link";
      return NextResponse.json({ error: message }, { status: 400 });
    }
  }
  if (notes.length < 10) {
    return NextResponse.json({ error: "Inserisci un link valido oppure appunti (minimo 10 caratteri)." }, { status: 400 });
  }

  const brand = parsed.data.website ? await analyzeWebsitePalette(parsed.data.website) : null;
  const palette = brand?.palette?.length ? brand.palette : parsed.data.palette;
  const estimate = await estimateBudgetFromNotes({
    notes,
    company: parsed.data.company,
    sector: parsed.data.sector,
    website: parsed.data.website
  });
  const budget = estimate.budget;
  const sector = formatReadableText(estimate.sectorSummary || parsed.data.sector);

  const generatedHtml =
    (await generateProposalHtmlWithAI({
      company: parsed.data.company,
      sector,
      notes,
      budget,
      palette,
      styleDirection: brand?.styleDirection
    })) ||
    buildFallbackProposalHtml({
      company: parsed.data.company,
      sector,
      notes,
      budget,
      palette
    });

  const proposal = await createProposal({
    tenantId: auth.session.tenantId,
    company: parsed.data.company,
    website: parsed.data.website,
    sector,
    notes,
    budget,
    palette,
    generatedHtml: generatedHtml || "",
    styleDirection: brand?.styleDirection || "",
    sourceUrl: sourceUrl || ""
  });

  return NextResponse.json(
    {
      id: proposal.id,
      link: `/p/${proposal.shareToken}`,
      workspaceLink: `/workspace/proposals/${proposal.id}`,
      expiresAt: proposal.expiresAt,
      budget,
      palette,
      deployMessage: `Proposta creata. Budget stimato: € ${budget.toLocaleString("it-IT")}.`
    },
    { status: 201 }
  );
}
