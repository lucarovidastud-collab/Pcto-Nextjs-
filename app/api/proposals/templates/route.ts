import { NextRequest, NextResponse } from "next/server";
import { listProposalTemplates } from "@/lib/db/repositories";
import { requireSession } from "@/lib/security/guard";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const auth = await requireSession(request);
  if (auth.error || !auth.session) return auth.error!;

  const templates = await listProposalTemplates(auth.session.tenantId);
  const summary = templates.map((tpl) => ({
    id: tpl.id,
    company: tpl.company,
    sector: tpl.sector,
    website: tpl.website,
    budget: tpl.budget,
    palette: tpl.palette,
    style: tpl.style || "moderno",
    templateName: tpl.templateName || tpl.company
  }));

  return NextResponse.json({ templates: summary });
}
