import { NextRequest, NextResponse } from "next/server";
import { assertCanCreateProposal } from "@/lib/billing/entitlements";
import { requireSession } from "@/lib/security/guard";
import { analyzeWebsitePalette } from "@/lib/services/brand";
import { estimateBudgetFromNotes } from "@/lib/services/proposal-estimate";
import { resolveNotesFromUploadedFile } from "@/lib/services/source-notes";
import { analyzeSiteSchema } from "@/lib/validators";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const auth = await requireSession(request);
  if (auth.error || !auth.session) return auth.error!;

  const access = await assertCanCreateProposal(auth.session.tenantId);
  if (!access.allowed) {
    const code = access.error.code;
    return NextResponse.json(
      code === "proposal_limit_reached"
        ? {
            error: code,
            used: access.error.used,
            limit: access.error.limit,
            plan: access.error.plan
          }
        : { error: "subscription_required" },
      { status: 403 }
    );
  }

  const contentType = request.headers.get("content-type") || "";

  let website = "";
  let company = "Cliente";
  let sector = "Business";
  let notes = "";

  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    website = String(form.get("website") || "").trim();
    company = String(form.get("company") || "Cliente").trim() || "Cliente";
    sector = String(form.get("sector") || "Business").trim() || "Business";
    const files = [...form.getAll("files"), form.get("file")].filter((entry): entry is File => entry instanceof File);
    if (files.length) {
      try {
        const parts: string[] = [];
        for (const file of files) {
          const extracted = await resolveNotesFromUploadedFile(file);
          if (extracted.trim()) parts.push(extracted);
        }
        notes = parts.join("\n");
      } catch {
        notes = "";
      }
    }
    if (!website) return NextResponse.json({ error: "Payload non valido" }, { status: 400 });
    try {
      new URL(website);
    } catch {
      return NextResponse.json({ error: "Payload non valido" }, { status: 400 });
    }
  } else {
    const body = await request.json().catch(() => null);
    const parsed = analyzeSiteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Payload non valido" }, { status: 400 });
    }
    website = parsed.data.website;
    company = parsed.data.company || "Cliente";
    sector = parsed.data.sector || "Business";
    notes = (parsed.data.notes || "").trim();
  }

  const result = await analyzeWebsitePalette(website);

  const estimate =
    notes.length >= 10
      ? await estimateBudgetFromNotes({
          notes,
          company,
          sector,
          website
        })
      : null;

  return NextResponse.json({
    ...result,
    estimatedBudget: estimate?.budget,
    sectorSummary: estimate?.sectorSummary,
    budgetRationale: estimate?.rationale
  });
}
