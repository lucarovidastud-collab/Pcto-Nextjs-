import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/security/guard";
import { listTenantProposals } from "@/lib/db/repositories";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await requireSession(request);
  if (auth.error || !auth.session) return auth.error!;

  const proposals = await listTenantProposals(auth.session.tenantId);

  const header = ["ID", "Azienda", "Settore", "Budget (€)", "Stato", "Token", "Visualizzazioni", "Creato", "Scade", "Firmato da", "Data firma"];
  const rows = proposals.map((p) => [
    p.id,
    `"${(p.company || "").replace(/"/g, '""')}"`,
    `"${(p.sector || "").replace(/"/g, '""')}"`,
    String(p.budget || 0),
    p.status || "",
    p.shareToken || "",
    String(p.viewCount || 0),
    p.createdAt ? new Date(p.createdAt).toLocaleDateString("it-IT") : "",
    p.expiresAt ? new Date(p.expiresAt).toLocaleDateString("it-IT") : "",
    `"${(p.signedBy || "").replace(/"/g, '""')}"`,
    p.signedAt ? new Date(p.signedAt).toLocaleDateString("it-IT") : ""
  ]);

  const csv = [header.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const filename = `proposte_${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store"
    }
  });
}
