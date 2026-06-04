import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/security/guard";
import { listTenantProposals } from "@/lib/db/repositories";
import {
  buildCsvTable,
  formatCsvBudget,
  formatCsvDate,
  truncateForCsv
} from "@/lib/export/csv";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<string, string> = {
  draft: "Bozza",
  review: "In revisione",
  approved: "Approvato",
  sent: "Inviato"
};

export async function GET(request: NextRequest) {
  const auth = await requireSession(request);
  if (auth.error || !auth.session) return auth.error!;

  const proposals = await listTenantProposals(auth.session.tenantId);

  const header = [
    "ID",
    "Azienda",
    "Settore",
    "Budget EUR",
    "Stato",
    "Link token",
    "Visualizzazioni",
    "Creato",
    "Scadenza link",
    "Firmato da",
    "Data firma"
  ];

  const rows = proposals.map((p) => [
    p.id,
    p.company || "",
    truncateForCsv(p.sector || "", 100),
    formatCsvBudget(Number(p.budget) || 0),
    STATUS_LABELS[p.status || ""] || p.status || "",
    p.shareToken || "",
    String(p.viewCount || 0),
    formatCsvDate(p.createdAt),
    formatCsvDate(p.expiresAt),
    p.signedBy || "",
    formatCsvDate(p.signedAt)
  ]);

  const csv = buildCsvTable([header, ...rows]);
  const filename = `proposte_${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store"
    }
  });
}
