import { NextRequest } from "next/server";
import { assertCanCreateProposal } from "@/lib/billing/entitlements";
import { requireSession } from "@/lib/security/guard";
import { parseProposalRequest } from "@/lib/services/proposal-form";
import { buildAndSaveProposal } from "@/lib/services/proposal-pipeline";
import { proposalSlugError, slugifyProposalLink } from "@/lib/proposals/slug";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function ndjsonLine(payload: unknown) {
  return `${JSON.stringify(payload)}\n`;
}

export async function POST(request: NextRequest) {
  const auth = await requireSession(request);
  if (auth.error || !auth.session) return auth.error!;

  const access = await assertCanCreateProposal(auth.session.tenantId);
  if (!access.allowed) {
    const code = access.error.code;
    if (code === "proposal_limit_reached") {
      return Response.json(
        {
          type: "error",
          error: code,
          used: access.error.used,
          limit: access.error.limit,
          plan: access.error.plan
        },
        { status: 403 }
      );
    }
    return Response.json({ type: "error", error: "subscription_required" }, { status: 403 });
  }

  const parsed = await parseProposalRequest(request);
  if (!parsed.ok) {
    return Response.json({ type: "error", error: parsed.error }, { status: parsed.status });
  }

  const { company, website, sector, palette, notes, linkSlug } = parsed.data;

  if (notes.trim().length < 10) {
    return Response.json({ type: "error", error: "Documento troppo corto o non leggibile" }, { status: 400 });
  }

  if (linkSlug) {
    const slugErr = proposalSlugError(slugifyProposalLink(linkSlug));
    if (slugErr) {
      return Response.json({ type: "error", error: slugErr }, { status: 400 });
    }
  }

  const encoder = new TextEncoder();
  const tenantId = auth.session.tenantId;

  const stream = new ReadableStream({
    async start(controller) {
      const send = (payload: unknown) => controller.enqueue(encoder.encode(ndjsonLine(payload)));

      try {
        const result = await buildAndSaveProposal(
          { tenantId, company, website, sector, palette, notes, linkSlug },
          (percent, label) => send({ type: "progress", percent, label })
        );

        send({
          type: "complete",
          id: result.id,
          link: `/p/${result.shareToken}`,
          workspaceLink: `/workspace/proposals/${result.id}`,
          shareToken: result.shareToken,
          expiresAt: result.expiresAt,
          budget: result.budget,
          palette: result.palette,
          deployMessage: `Proposta creata. Budget stimato: € ${result.budget.toLocaleString("it-IT")}.`
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Generazione fallita";
        send({ type: "error", error: message });
      } finally {
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}
