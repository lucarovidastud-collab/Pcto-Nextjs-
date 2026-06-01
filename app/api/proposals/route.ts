import { NextRequest, NextResponse } from "next/server";
import { createProposal, listTenantProposals, getSubscriptionForTenant } from "@/lib/db/repositories";
import { requireSession } from "@/lib/security/guard";
import { analyzeWebsitePalette } from "@/lib/services/brand";
import { buildFallbackProposalHtml } from "@/lib/proposals/fallback-html";
import { estimateBudgetFromNotes } from "@/lib/services/proposal-estimate";
import { generateProposalHtmlWithAI } from "@/lib/services/proposal-ai";

import { resolveNotesFromUploadedFile } from "@/lib/services/source-notes";
import { formatReadableText } from "@/lib/utils/text";
import { createProposalSchema } from "@/lib/validators";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const auth = await requireSession(request);
  if (auth.error || !auth.session) return auth.error!;
  const proposals = await listTenantProposals(auth.session.tenantId);
  return NextResponse.json({ proposals });
}

export async function POST(request: NextRequest) {
  const auth = await requireSession(request);
  if (auth.error || !auth.session) return auth.error!;

  const sub = await getSubscriptionForTenant(auth.session.tenantId);
  if (sub.plan === "none" || (sub.status !== "active" && sub.status !== "trialing")) {
    return NextResponse.json({ error: "subscription_required" }, { status: 403 });
  }

  const contentType = request.headers.get("content-type") || "";

  let company = "";
  let website = "";
  let sector = "";
  let palette: string[] = [];
  let notes = "";

  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    company = String(form.get("company") || "").trim();
    website = String(form.get("website") || "").trim();
    sector = String(form.get("sector") || "").trim();
    palette = parsePalette(String(form.get("palette") || "[]"));

    const files = [...form.getAll("files"), form.get("file")].filter((entry): entry is File => entry instanceof File);
    if (files.length === 0) {
      return NextResponse.json({ error: "File mancante" }, { status: 400 });
    }
    try {
      const parts: string[] = [];
      for (const file of files) {
        const extracted = await resolveNotesFromUploadedFile(file);
        if (extracted.trim()) parts.push(extracted);
      }
      notes = parts.join("\n");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Impossibile leggere il file";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    if (!company || company.length < 2) return NextResponse.json({ error: "Payload non valido" }, { status: 400 });
    if (!sector || sector.length < 2) return NextResponse.json({ error: "Payload non valido" }, { status: 400 });
    if (!Array.isArray(palette) || palette.length < 1 || palette.length > 10) {
      return NextResponse.json({ error: "Payload non valido" }, { status: 400 });
    }
    if (!palette.every((c) => /^#[0-9a-fA-F]{6}$/.test(c))) {
      return NextResponse.json({ error: "Payload non valido" }, { status: 400 });
    }
    if (website) {
      try {
        new URL(website);
      } catch {
        return NextResponse.json({ error: "Payload non valido" }, { status: 400 });
      }
    }
  } else {
    const body = await request.json().catch(() => null);
    const parsed = createProposalSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Payload non valido" }, { status: 400 });
    }
    company = parsed.data.company;
    website = parsed.data.website;
    sector = parsed.data.sector;
    palette = parsed.data.palette;
    notes = parsed.data.notes.trim();
  }

  if (notes.trim().length < 10) {
    return NextResponse.json({ error: "Documento troppo corto o non leggibile" }, { status: 400 });
  }

  const brand = website ? await analyzeWebsitePalette(website) : null;
  const resolvedPalette = brand?.palette?.length ? brand.palette : palette;
  const estimate = await estimateBudgetFromNotes({
    notes,
    company,
    sector,
    website
  });
  const budget = estimate.budget;
  const resolvedSector = formatReadableText(estimate.sectorSummary || sector);

  const generatedHtml =
    (await generateProposalHtmlWithAI({
      company,
      sector: resolvedSector,
      notes,
      budget,
      palette: resolvedPalette,
      styleDirection: brand?.styleDirection
    })) ||
    buildFallbackProposalHtml({
      company,
      sector: resolvedSector,
      notes,
      budget,
      palette: resolvedPalette
    });

  const proposal = await createProposal({
    tenantId: auth.session.tenantId,
    company,
    website,
    sector: resolvedSector,
    notes,
    budget,
    palette: resolvedPalette,
    generatedHtml: generatedHtml || "",
    styleDirection: brand?.styleDirection || ""
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

function parsePalette(value: string) {
  try {
    const parsed = JSON.parse(value) as unknown;
    if (Array.isArray(parsed)) {
      return parsed.map((v) => String(v).toUpperCase());
    }
  } catch {
    // ignore
  }
  return [];
}
