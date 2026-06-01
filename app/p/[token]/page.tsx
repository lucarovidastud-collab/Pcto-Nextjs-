"use client";

import { buildFallbackProposalHtml } from "@/lib/proposals/fallback-html";
import { brandedPageBackground, paletteToCssVars } from "@/lib/proposals/brand-theme";
import { sanitizeProposalHtml } from "@/lib/proposals/sanitize";
import { formatReadableText, truncateText } from "@/lib/utils/text";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ShieldCheck, Calendar, Wallet, Award, Clock, ArrowRight, Sparkles, User, FileSignature, Printer } from "lucide-react";

type ProposalView = {
  company: string;
  sector: string;
  budget: number;
  palette?: string[];
  generatedHtml?: string;
  notes?: string;
  status?: string;
  signedAt?: string;
  signedBy?: string;
  expiresAt?: string;
};

function formatDate(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("it-IT", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function resolveHtml(proposal: ProposalView) {
  const palette = proposal.palette?.length ? proposal.palette : ["#0D9488", "#8B5CF6", "#F59E0B"];
  const html = proposal.generatedHtml?.trim();
  if (html && /<[a-z][\s\S]*>/i.test(html)) return sanitizeProposalHtml(html);
  return sanitizeProposalHtml(
    buildFallbackProposalHtml({
      company: proposal.company,
      sector: formatReadableText(proposal.sector),
      notes: proposal.notes || "",
      budget: Number(proposal.budget) || 0,
      palette
    })
  );
}

export default function PublicProposalPage() {
  const params = useParams<{ token: string }>();
  const token = params.token;
  const [proposal, setProposal] = useState<ProposalView | null>(null);
  const [signedBy, setSignedBy] = useState("");
  const [message, setMessage] = useState("Caricamento proposta commerciale in corso...");
  const [loadingSign, setLoadingSign] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      document.documentElement.dataset.theme = mq.matches ? "dark" : "light";
    };
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    void (async () => {
      const response = await fetch(`/api/public/proposals/${token}`);
      if (!response.ok) {
        setMessage("Questo preventivo o link non è valido, oppure è scaduto. Contatta l'emittente per un nuovo link.");
        return;
      }
      const payload = (await response.json()) as { proposal: ProposalView };
      setProposal(payload.proposal);
      setMessage("");
    })();
  }, [token]);

  const palette = proposal?.palette?.length ? proposal.palette : ["#0D9488", "#8B5CF6", "#F59E0B"];
  const documentHtml = useMemo(() => (proposal ? resolveHtml(proposal) : ""), [proposal]);
  const themeVars = useMemo(() => paletteToCssVars(palette), [palette]);
  const pageBg = useMemo(() => brandedPageBackground(palette), [palette]);

  async function signProposal() {
    if (!signedBy.trim()) {
      setMessage("Inserisci il tuo nome e cognome completi per validare la firma.");
      return;
    }
    setLoadingSign(true);
    try {
      const response = await fetch(`/api/public/proposals/${token}/sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signedBy: signedBy.trim() })
      });
      setLoadingSign(false);
      if (!response.ok) {
        setMessage("Firma non riuscita. Riprova o contatta l'amministratore.");
        return;
      }
      setMessage("Preventivo accettato e firmato elettronicamente con successo.");
      setProposal((current) =>
        current ? { ...current, signedAt: new Date().toISOString(), signedBy: signedBy.trim(), status: "signed" } : current
      );
    } catch {
      setLoadingSign(false);
      setMessage("Errore di rete. Controlla la connessione.");
    }
  }

  if (!proposal) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4 py-8 text-[var(--foreground)] bg-[var(--background)]">
        <div className="glass rounded-2xl p-6 text-center max-w-md shadow-xl border border-[var(--line)]">
          <Sparkles className="mx-auto text-[var(--accent)] animate-pulse mb-3" size={28} />
          <p className="text-sm font-semibold leading-relaxed">{message}</p>
        </div>
      </main>
    );
  }

  const isSigned = Boolean(proposal.signedAt);
  const sectorLabel = truncateText(formatReadableText(proposal.sector), 160);

  return (
    <main className="proposal-branded min-h-screen px-4 py-8 text-[var(--foreground)] sm:px-6 sm:py-12 transition-all" style={{ ...themeVars, ...pageBg }}>
      <div className="mx-auto max-w-4xl grid gap-8">
        
        {/* Main Proposal Card Container */}
        <article className="glass overflow-hidden rounded-3xl border border-[color-mix(in_srgb,var(--brand-primary)_25%,var(--line))] shadow-2xl bg-[color-mix(in_srgb,var(--panel-strong)_95%,transparent)]">
          
          {/* Custom Branded Header Banner */}
          <header className="brand-header border-b border-[var(--line)] px-6 py-8 sm:px-12 sm:py-10 flex flex-col gap-6">
            <div>
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[var(--muted)]">
                <Award size={14} className="text-[var(--brand-primary)]" />
                <span>Proposta Commerciale Ufficiale</span>
              </div>
              <h1 className="mt-2 text-3xl sm:text-5xl font-black leading-tight" style={{ color: "var(--brand-primary)" }}>
                {proposal.company}
              </h1>
              <p className="mt-2 text-sm sm:text-base text-[var(--muted)] max-w-2xl font-medium">
                {sectorLabel}
              </p>
            </div>

            {/* Badges / Metrics Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="brand-pill rounded-xl px-4 py-2 text-xs flex items-center gap-2 shadow-sm">
                  <Wallet size={14} />
                  <span>Budget € {Number(proposal.budget).toLocaleString("it-IT")}</span>
                </span>
                <span className="rounded-xl border border-[var(--line)] bg-[var(--panel-strong)] px-4 py-2 text-xs text-[var(--muted)] flex items-center gap-2 shadow-sm">
                  <Calendar size={14} />
                  <span>Scadenza: {formatDate(proposal.expiresAt)}</span>
                </span>
              </div>
              
              <button 
                onClick={() => window.print()}
                className="no-print btn-secondary text-xs px-4 py-2 flex items-center gap-2 self-start sm:self-auto shrink-0"
              >
                <Printer size={14} />
                <span>Stampa / PDF</span>
              </button>
            </div>
          </header>

          {/* Proposal HTML Document Content */}
          <div className="proposal-document px-6 py-10 sm:px-12 prose max-w-none border-b border-[var(--line)] bg-[var(--panel-strong)] overflow-x-auto break-words">
            <div dangerouslySetInnerHTML={{ __html: documentHtml }} />
          </div>

          {/* Official Sign/Contract Panel */}
          <section className="no-print bg-[color-mix(in_srgb,var(--panel)_50%,transparent)] px-6 py-8 sm:px-12 border-t border-[var(--line)]">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-secondary,var(--brand-primary))] text-white shadow-md">
                <FileSignature size={18} />
              </div>
              <div>
                <h2 className="text-xl font-black tracking-tight" style={{ color: "var(--brand-primary)" }}>
                  Sottoscrizione e Accettazione
                </h2>
                <p className="text-xs text-[var(--muted)]">Validazione legale tramite firma elettronica crittografata.</p>
              </div>
            </div>

            {isSigned ? (
              /* Signed DocuSign-like Seal */
              <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/5 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm animate-in fade-in duration-300">
                <div className="grid gap-1">
                  <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-extrabold text-sm">
                    <ShieldCheck size={16} />
                    <span>DOCUMENTO FIRMATO E VALIDATO</span>
                  </div>
                  <p className="text-xs text-[var(--muted)] mt-1">
                    Accettato formalmente da <strong className="text-[var(--foreground)]">{proposal.signedBy}</strong>
                  </p>
                  <p className="text-[10px] text-[var(--muted)] font-mono">
                    Data validazione: {formatDate(proposal.signedAt)}
                  </p>
                </div>
                
                {/* Visual Stamp Seal */}
                <div className="border-2 border-dashed border-emerald-600/30 rounded-xl px-4 py-3 flex flex-col items-center justify-center rotate-[-2deg] max-w-[220px] self-start md:self-auto shrink-0 bg-emerald-500/5 font-mono text-[9px] text-emerald-600 dark:text-emerald-400">
                  <p className="font-extrabold uppercase tracking-widest text-[10px] border-b border-emerald-500/20 pb-1 mb-1">APPROVED</p>
                  <p className="truncate w-full text-center">Firma: {proposal.signedBy}</p>
                  <p className="text-[8px] opacity-70">HASH ID: {token.slice(0, 10)}...</p>
                </div>
              </div>
            ) : (
              /* Beautiful active signing input form */
              <div className="grid gap-4 max-w-lg">
                <p className="text-xs text-[var(--muted)] leading-relaxed">
                  Digita il tuo nome e cognome per confermare l&apos;approvazione del preventivo, del budget e delle specifiche descritte nel documento sopra riportato.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)] opacity-60" size={17} />
                    <input
                      className="input input-with-icon"
                      required
                      placeholder="Nome e Cognome firmatario"
                      value={signedBy}
                      onChange={(e) => setSignedBy(e.target.value)}
                      disabled={loadingSign}
                    />
                  </div>
                  
                  <button
                    onClick={signProposal}
                    disabled={loadingSign}
                    className="btn-brand flex items-center justify-center gap-2 sm:px-6 font-bold shadow-md transition-all active:scale-95 disabled:opacity-50"
                  >
                    {loadingSign ? (
                      <span className="inline-block animate-pulse">Registrazione firma...</span>
                    ) : (
                      <>
                        <span>Firma Proposta</span>
                        <ArrowRight size={16} />
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {message && !isSigned && (
              <p className="mt-3 text-xs text-[var(--muted)] bg-[var(--panel-strong)] rounded-lg p-2.5 border border-[var(--line)] leading-normal max-w-lg">
                {message}
              </p>
            )}
          </section>
        </article>

        {/* Branding Footer */}
        <p className="text-center text-xs text-[var(--muted)] mb-8 flex items-center justify-center gap-1">
          <ShieldCheck size={14} className="text-[var(--brand-primary)]" />
          <span>Fornito in sicurezza da QuoteGen Engine · Enterprise B2B SaaS</span>
        </p>
      </div>
    </main>
  );
}
