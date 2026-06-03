"use client";

import { Link } from "@/i18n/navigation";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

type Proposal = {
  id: string;
  company: string;
  status: string;
  shareToken?: string;
  expiresAt?: string;
};

export default function WorkspaceProposalPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [message, setMessage] = useState("");

  const load = async () => {
    const response = await fetch(`/api/proposals/${id}`, { credentials: "include" });
    if (!response.ok) {
      setMessage("Proposta non trovata o sessione scaduta.");
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
      setMessage(payload.error || "Aggiornamento stato fallito.");
      return;
    }
    setMessage(`Stato aggiornato: ${status}`);
    await load();
  }

  if (!proposal) {
    return <main className="mx-auto max-w-3xl p-6">{message || "Caricamento..."}</main>;
  }

  return (
    <main className="mx-auto min-h-screen max-w-4xl px-4 py-8 text-[var(--foreground)]">
      <section className="glass rounded-lg p-6">
        <p className="text-sm text-[var(--muted)]">Workflow proposta</p>
        <h1 className="text-3xl font-black">{proposal.company}</h1>
        <p className="mt-2 text-sm">Stato attuale: <strong>{proposal.status}</strong></p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button className="focus-ring rounded-lg border px-3 py-2 text-sm font-bold" onClick={() => setStatus("draft")}>Draft</button>
          <button className="focus-ring rounded-lg border px-3 py-2 text-sm font-bold" onClick={() => setStatus("review")}>Review</button>
          <button className="focus-ring rounded-lg border px-3 py-2 text-sm font-bold" onClick={() => setStatus("approved")}>Approved</button>
          <button className="focus-ring rounded-lg border px-3 py-2 text-sm font-bold" onClick={() => setStatus("sent")}>Sent</button>
          <a className="focus-ring rounded-lg border px-3 py-2 text-sm font-bold" href={`/api/proposals/${id}/pdf`}>
            Export PDF
          </a>
          {proposal.shareToken ? (
            <Link className="focus-ring rounded-lg border px-3 py-2 text-sm font-bold" href={`/p/${proposal.shareToken}`}>
              Apri link cliente
            </Link>
          ) : null}
        </div>
        <p className="mt-4 text-sm text-[var(--muted)]">Scadenza link: {proposal.expiresAt}</p>
        {message ? <p className="mt-2 text-sm">{message}</p> : null}
        <Link href="/dashboard/history" className="mt-6 inline-block text-sm font-bold underline">
          Torna alla cronologia
        </Link>
      </section>
    </main>
  );
}
