import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/security/guard";
import { getBillingDiagnostics } from "@/lib/services/billing";

export async function GET(request: NextRequest) {
  const auth = await requireSession(request);
  if (auth.error || !auth.session) return auth.error!;
  if (auth.session.role !== "owner" && auth.session.role !== "admin") {
    return NextResponse.json({ error: "Permessi insufficienti" }, { status: 403 });
  }

  const diagnostics = await getBillingDiagnostics();
  return NextResponse.json(diagnostics);
}
