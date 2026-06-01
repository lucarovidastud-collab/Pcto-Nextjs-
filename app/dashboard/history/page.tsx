"use client";

import { SiteFooter } from "@/components/site-footer";
import { ExternalLink, FileText, History, Link2, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type ProposalSummary = {
  id: string;
  company: string;
  sector: string;
  budget: number;
  status: string;
  shareToken: string;
  website: string;
  createdAt: string;
  expiresAt: string;
  signedAt?: string;
};

function formatWhen(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("it-IT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

export default function ProposalHistoryPage() {
  const [proposals, setProposals] = useState<ProposalSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [origin, setOrigin] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch("/api/proposals");
      if (!res.ok) {
        setMessage("Impossibile caricare la cronologia.");
        return;
      }
      const payload = (await res.json()) as { proposals: ProposalSummary[] };
      setProposals(payload.proposals || []);
    } catch {
      setMessage("Errore di connessione.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setOrigin(window.location.origin);
    void load();
  }, [load]);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 pb-10">
      <header className="glass-premium rounded-3xl p-6 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--accent)]">
              <History size={14} aria-hidden />
              Archivio
            </div>
            <h1 className="mt-1 text-3xl font-black tracking-tight">Cronologia preventivi</h1>
            <p className="mt-2 max-w-2xl text-sm font-medium text-[var(--muted)]">
              Tutti i preventivi generati restano salvati su cloud. Puoi riaprirli in qualsiasi momento e
              condividere di nuovo il link al cliente.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="btn-secondary shrink-0 flex items-center justify-center gap-2 text-xs font-bold"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} aria-hidden />
            Aggiorna
          </button>
        </div>
      </header>

      {message ? (
        <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-300">
          {message}
        </p>
      ) : null}

      {loading ? (
        <p className="text-center text-sm text-[var(--muted)] py-12 animate-pulse">Caricamento cronologia...</p>
      ) : proposals.length === 0 ? (
        <div className="glass rounded-2xl p-10 text-center">
          <FileText size={40} className="mx-auto text-[var(--muted)] opacity-50" aria-hidden />
          <p className="mt-4 text-sm font-semibold text-[var(--muted)]">Nessun preventivo ancora.</p>
          <Link href="/dashboard" className="btn-primary mt-6 inline-flex text-sm font-bold">
            Crea il primo preventivo
          </Link>
        </div>
      ) : (
        <ul className="grid gap-4">
          {proposals.map((p) => {
            const publicUrl = origin ? `${origin}/p/${p.shareToken}` : `/p/${p.shareToken}`;
            const expired = p.expiresAt && new Date(p.expiresAt) < new Date();
            return (
              <li key={p.id} className="glass rounded-2xl p-5 sm:p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-xl font-black text-[var(--foreground)]">{p.company}</h2>
                      <span className="rounded-full bg-[var(--accent-glow)] px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-[var(--accent)]">
                        {p.status}
                      </span>
                      {p.signedAt ? (
                        <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                          Firmato
                        </span>
                      ) : null}
                      {expired ? (
                        <span className="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[10px] font-bold text-amber-800">
                          Link scaduto
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-sm text-[var(--muted)]">{p.sector}</p>
                    <p className="mt-2 text-lg font-black text-[var(--accent)]">
                      € {Number(p.budget || 0).toLocaleString("it-IT")}
                    </p>
                    <p className="mt-2 text-xs text-[var(--muted)]">
                      Creato il {formatWhen(p.createdAt)}
                      {p.expiresAt ? ` · Scade il ${formatWhen(p.expiresAt)}` : null}
                    </p>
                    <p className="mt-2 flex items-center gap-1.5 text-xs font-mono text-[var(--muted)] break-all">
                      <Link2 size={12} className="shrink-0" aria-hidden />
                      /p/{p.shareToken}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 shrink-0">
                    <Link
                      href={`/p/${p.shareToken}`}
                      target="_blank"
                      className="btn-primary text-xs font-bold flex items-center gap-1.5"
                    >
                      <ExternalLink size={14} aria-hidden />
                      Anteprima cliente
                    </Link>
                    <Link
                      href={`/workspace/proposals/${p.id}`}
                      className="btn-secondary text-xs font-bold flex items-center gap-1.5"
                    >
                      <FileText size={14} aria-hidden />
                      Gestione
                    </Link>
                    <button
                      type="button"
                      className="btn-secondary text-xs font-bold"
                      onClick={() => void navigator.clipboard.writeText(publicUrl)}
                    >
                      Copia link
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <SiteFooter />
    </div>
  );
}
