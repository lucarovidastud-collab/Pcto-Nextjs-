import { NextResponse } from "next/server";
import { signProposalByToken, getProposalByShareToken, getWorkspaceWebhookUrl, updateProposal, listWorkspaceMembers } from "@/lib/db/repositories";
import { sendProposalSignedEmail } from "@/lib/services/email";
import { z } from "zod";

const schema = z.object({
  signedBy: z.string().min(2).max(120),
  clientComment: z.string().max(2000).optional()
});
type RouteProps = { params: Promise<{ token: string }> };

export async function POST(request: Request, { params }: RouteProps) {
  const { token } = await params;
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Nome firma non valido" }, { status: 400 });

  // Save client comment before signing
  if (parsed.data.clientComment) {
    const proposal = await getProposalByShareToken(token);
    if (proposal) {
      await updateProposal(proposal.id, proposal.tenantId, { clientComment: parsed.data.clientComment });
    }
  }

  const result = await signProposalByToken(token, parsed.data.signedBy);
  if (!result) return NextResponse.json({ error: "Proposta non trovata" }, { status: 404 });
  if ("expired" in result) return NextResponse.json({ error: "Link scaduto" }, { status: 410 });
  if ("alreadySigned" in result) return NextResponse.json({ error: "Proposta già firmata" }, { status: 409 });

  // Fire webhook + email (fire-and-forget, non-blocking)
  if ("ok" in result && result.id) {
    void (async () => {
      try {
        const proposal = await getProposalByShareToken(token);
        if (!proposal) return;
        const baseUrl = (process.env.APP_URL ?? "https://pcto-nextjs.vercel.app").replace(/\/$/, "");
        const shareLink = `${baseUrl}/p/${token}`;
        const signedAt = new Date().toISOString();

        // Webhook
        const webhookUrl = await getWorkspaceWebhookUrl(proposal.tenantId);
        if (webhookUrl) {
          await fetch(webhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              event: "proposal.signed",
              proposalId: result.id,
              company: proposal.company,
              signedBy: parsed.data.signedBy,
              signedAt,
              shareLink,
              budget: proposal.budget
            }),
            signal: AbortSignal.timeout(5000)
          }).catch(() => {});
        }

        // Email notification to workspace owner(s)
        const members = await listWorkspaceMembers(proposal.tenantId);
        const owners = members.filter((m) => m.role === "owner" || m.role === "admin");
        for (const owner of owners) {
          if (owner.email) {
            await sendProposalSignedEmail({
              to: owner.email,
              company: proposal.company,
              signedBy: parsed.data.signedBy,
              signedAt,
              shareLink,
              budget: proposal.budget
            }).catch(() => {});
          }
        }
      } catch {
        // Failures are silent
      }
    })();
  }

  return NextResponse.json({ ok: true });
}
