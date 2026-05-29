import { NextRequest, NextResponse } from "next/server";
import { getProposalById } from "@/lib/db/repositories";
import { requireSession } from "@/lib/security/guard";
import { jsPDF } from "jspdf";

type RouteProps = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteProps) {
  const auth = await requireSession(request);
  if (auth.error || !auth.session) return auth.error!;
  const { id } = await params;
  const proposal = await getProposalById(id, auth.session.tenantId);
  if (!proposal) return NextResponse.json({ error: "Proposta non trovata" }, { status: 404 });

  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text(`Preventivo - ${String(proposal.company)}`, 14, 20);
  doc.setFontSize(11);
  doc.text(`Settore: ${String(proposal.sector)}`, 14, 30);
  doc.text(`Budget: EUR ${String(proposal.budget)}`, 14, 38);
  doc.text(`Stato: ${String(proposal.status)}`, 14, 46);
  doc.text(`Scadenza link: ${String(proposal.expiresAt)}`, 14, 54);
  const notes = String(proposal.notes || "").slice(0, 4000);
  const splitNotes = doc.splitTextToSize(notes, 180);
  let y = 66;
  for (const line of splitNotes) {
    if (y > 280) {
      doc.addPage();
      y = 20;
    }
    doc.text(line, 14, y);
    y += 7;
  }

  const buffer = Buffer.from(doc.output("arraybuffer"));
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="preventivo-${id}.pdf"`
    }
  });
}
