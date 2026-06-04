import { NextRequest, NextResponse } from "next/server";
import { sendProposalExpiryReminderEmail } from "@/lib/services/email";
import { getFirestoreDb } from "@/lib/firebase/admin";
import { listWorkspaceMembers } from "@/lib/db/repositories";

export const dynamic = "force-dynamic";

// This route is called by Vercel Cron (configured in vercel.json)
// It checks proposals expiring in 3 days and sends reminder emails
export async function GET(request: NextRequest) {
  // Verify cron secret to prevent unauthorized calls
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const baseUrl = (process.env.APP_URL ?? "https://pcto-nextjs.vercel.app").replace(/\/$/, "");
  const now = new Date();
  const in3days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  const in1day = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000);

  const db = getFirestoreDb();
  const snap = await db.collection("proposals")
    .where("signedAt", "==", "")
    .where("status", "!=", "approved")
    .get();

  let sent = 0;

  for (const doc of snap.docs) {
    const data = doc.data();
    if (!data.expiresAt) continue;

    const expiresAt = new Date(data.expiresAt as string);
    const daysLeft = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    // Send reminder at 3 days and 1 day before expiry
    if (daysLeft !== 3 && daysLeft !== 1) continue;
    if (expiresAt < now) continue;

    try {
      const members = await listWorkspaceMembers(data.tenantId as string);
      const owners = members.filter((m) => m.role === "owner" || m.role === "admin");
      for (const owner of owners) {
        if (!owner.email) continue;
        await sendProposalExpiryReminderEmail({
          to: owner.email,
          company: (data.company as string) || "Cliente",
          expiresAt: data.expiresAt as string,
          shareLink: `${baseUrl}/p/${data.shareToken as string}`,
          daysLeft
        });
        sent++;
      }
    } catch {
      // Continue on individual errors
    }
  }

  return NextResponse.json({ ok: true, remindersSent: sent });
}
