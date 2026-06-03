"use client";

import { Link } from "@/i18n/navigation";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

type Proposal = {
  id: string;
  company: string;
  status: string;
  shareToken?: string;
  expiresAt?: string;
};

export default function WorkspaceProposalPage() {
  const t = useTranslations("workspace");
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [message, setMessage] = useState("");

  const load = async () => {
    const response = await fetch(`/api/proposals/${id}`, { credentials: "include" });
    if (!response.ok) {
      setMessage(t("notFound"));
      return;
    }
    const payload = (await response.json()) as { proposal: Proposal };
    setProposal(payload.proposal);
  };

  useEffect(() => {
    void load();
  }, [id]);

  async function setStatus(status: "draft" | "review" | "approved" | "sent") {
    const response = await fetch(`/api/proposals/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ status })
    });
    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      setMessage(payload.error || t("updateFailed"));
      return;
    }
    setMessage(`${t("statusUpdated")}: ${status}`);
    await load();
  }

  if (!proposal) {
    return <main className="mx-auto max-w-3xl p-6">{message || t("loading")}</main>;
  }

  return (
    <main className="mx-auto min-h-screen max-w-4xl px-4 py-8 text-[var(--foreground)]">
      <section className="glass rounded-lg p-6">
        <p className="text-sm text-[var(--muted)]">{t("workflow")}</p>
        <h1 className="text-3xl font-black">{proposal.company}</h1>
        <p className="mt-2 text-sm">{t("currentStatus")}: <strong>{proposal.status}</strong></p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button className="focus-ring rounded-lg border px-3 py-2 text-sm font-bold" onClick={() => setStatus("draft")}>Draft</button>
          <button className="focus-ring rounded-lg border px-3 py-2 text-sm font-bold" onClick={() => setStatus("review")}>Review</button>
          <button className="focus-ring rounded-lg border px-3 py-2 text-sm font-bold" onClick={() => setStatus("approved")}>Approved</button>
          <button className="focus-ring rounded-lg border px-3 py-2 text-sm font-bold" onClick={() => setStatus("sent")}>Sent</button>
          <a className="focus-ring rounded-lg border px-3 py-2 text-sm font-bold" href={`/api/proposals/${id}/pdf`}>
            {t("exportPdf")}
          </a>
          {proposal.shareToken ? (
            <a
              className="focus-ring rounded-lg border px-3 py-2 text-sm font-bold"
              href={`/p/${proposal.shareToken}`}
              target="_blank"
              rel="noreferrer"
            >
              {t("openClientLink")}
            </a>
          ) : null}
        </div>
        <p className="mt-4 text-sm text-[var(--muted)]">{t("linkExpiry")}: {proposal.expiresAt}</p>
        {message ? <p className="mt-2 text-sm">{message}</p> : null}
        <Link href="/dashboard/history" className="mt-6 inline-block text-sm font-bold underline">
          {t("backToHistory")}
        </Link>
      </section>
    </main>
  );
}
