import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/security/guard";
import { analyzeWebsitePalette } from "@/lib/services/brand";
import { estimateBudgetFromNotes } from "@/lib/services/proposal-estimate";
import { resolveNotesFromSourceUrl } from "@/lib/services/source-notes";
import { analyzeSiteSchema } from "@/lib/validators";

export async function POST(request: NextRequest) {
  const auth = await requireSession(request);
  if (auth.error) return auth.error;

  const body = await request.json().catch(() => null);
  const parsed = analyzeSiteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Payload non valido" }, { status: 400 });
  }
  const result = await analyzeWebsitePalette(parsed.data.website);
  let notes = (parsed.data.notes || "").trim();
  if (notes.length < 10 && parsed.data.sourceUrl) {
    try {
      notes = await resolveNotesFromSourceUrl(parsed.data.sourceUrl);
    } catch {
      notes = "";
    }
  }

  const estimate =
    notes.length >= 10
      ? await estimateBudgetFromNotes({
          notes,
          company: parsed.data.company || "Cliente",
          sector: parsed.data.sector || "Business",
          website: parsed.data.website
        })
      : null;

  return NextResponse.json({
    ...result,
    estimatedBudget: estimate?.budget,
    sectorSummary: estimate?.sectorSummary,
    budgetRationale: estimate?.rationale
  });
}
