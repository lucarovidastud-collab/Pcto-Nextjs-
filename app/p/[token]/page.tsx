"use client";

import { buildFallbackProposalHtml } from "@/lib/proposals/fallback-html";
import { brandedPageBackground, paletteToCssVars } from "@/lib/proposals/brand-theme";
import {
  ensurePricingTableTotal,
  normalizeProposalPricingTable
} from "@/lib/proposals/pricing-table";
import { applyBrandPaletteToHtml } from "@/lib/proposals/apply-brand-palette";
import { sanitizeProposalHtml } from "@/lib/proposals/sanitize";
import { formatReadableText, truncateText } from "@/lib/utils/text";
import { useParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { LocaleSwitcher } from "@/components/locale-switcher";
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
  passwordRequired?: boolean;
  clientComment?: string;
};

function formatDate(value: string | undefined, locale: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function resolveHtml(proposal: ProposalView) {
  const palette = proposal.palette?.length ? proposal.palette : ["#0D9488", "#8B5CF6", "#F59E0B"];
  const budget = Number(proposal.budget) || 0;
  const html = proposal.generatedHtml?.trim();
  const base =
    html && /<[a-z][\s\S]*>/i.test(html)
      ? sanitizeProposalHtml(html)
      : sanitizeProposalHtml(
          buildFallbackProposalHtml({
            company: proposal.company,
            sector: formatReadableText(proposal.sector),
            notes: proposal.notes || "",
            budget,
            palette
          })
        );
  return ensurePricingTableTotal(
    normalizeProposalPricingTable(applyBrandPaletteToHtml(base, palette), budget),
    budget
  );
}

export default function PublicProposalPage() {
  const t = useTranslations("proposal");
  const locale = useLocale();
  const params = useParams<{ token: string }>();
  const token = params.token;
  const [proposal, setProposal] = useState<ProposalView | null>(null);
  const [signedBy, setSignedBy] = useState("");
  const [clientComment, setClientComment] = useState("");
  const [message, setMessage] = useState("");
  const [loadingSign, setLoadingSign] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState(false);

  async function loadProposal(pwd?: string) {
    setMessage("");
    const url = pwd ? `/api/public/proposals/${token}?pwd=${encodeURIComponent(pwd)}` : `/api/public/proposals/${token}`;
    const response = await fetch(url);
    if (!response.ok) {
      const payload = (await response.json()) as { error?: string; passwordRequired?: boolean };
      if (payload.passwordRequired) {
        setProposal({ company: "", sector: "", budget: 0, passwordRequired: true });
        return;
      }
      setMessage("invalid");
      return;
    }
    const payload = (await response.json()) as { proposal: ProposalView };
    setProposal(payload.proposal);
    setMessage("");
  }

  useEffect(() => { void loadProposal(); }, [token]);

  const palette = proposal?.palette?.length ? proposal.palette : ["#0D9488", "#8B5CF6", "#F59E0B"];
  const documentHtml = useMemo(() => (proposal ? resolveHtml(proposal) : ""), [proposal]);
  const themeVars = useMemo(() => paletteToCssVars(palette), [palette]);
  const pageBg = useMemo(() => brandedPageBackground(palette), [palette]);

  async function signProposal() {
    if (!signedBy.trim()) {
      setMessage(t("signNameRequired"));
      return;
    }
    setLoadingSign(true);
    try {
      const response = await fetch(`/api/public/proposals/${token}/sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signedBy: signedBy.trim(), clientComment: clientComment.trim() || undefined })
      });
      setLoadingSign(false);
      if (!response.ok) {
        setMessage(t("signFailed"));
        return;
      }
      setMessage(t("signSuccess"));
      setProposal((current) =>
        current ? { ...current, signedAt: new Date().toISOString(), signedBy: signedBy.trim(), status: "signed" } : current
      );
    } catch {
      setLoadingSign(false);
      setMessage(t("signNetworkError"));
    }
  }

  if (!proposal) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4 py-8 text-[var(--foreground)] bg-[var(--background)]">
        <div className="glass rounded-2xl p-6 text-center max-w-md shadow-xl border border-[var(--line)]">
          <Sparkles className="mx-auto text-[var(--accent)] animate-pulse mb-3" size={28} />
          <p className="text-sm font-semibold leading-relaxed">
            {message === "invalid" ? t("invalid") : message || t("loading")}
          </p>
        </div>
      </main>
    );
  }

  // Password gate
  if (proposal.passwordRequired) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4 py-8 bg-[var(--background)]">
        <div className="glass rounded-2xl p-8 max-w-sm w-full shadow-xl border border-[var(--line)] text-center">
          <ShieldCheck size={36} className="mx-auto text-[var(--accent)] mb-4" />
          <h1 className="text-xl font-black mb-1">{t("passwordTitle")}</h1>
          <p className="text-sm text-[var(--muted)] mb-5">{t("passwordDesc")}</p>
          <input
            type="password"
            className="input w-full text-sm mb-3"
            placeholder="••••••••"
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") void loadProposal(passwordInput); }}
          />
          {passwordError && (
            <p className="text-xs text-red-600 mb-2">{t("passwordWrong")}</p>
          )}
          <button
            type="button"
            className="btn-primary w-full"
            onClick={async () => {
              await loadProposal(passwordInput);
              setPasswordError(!proposal || !!proposal.passwordRequired);
            }}
          >
            {t("passwordSubmit")}
          </button>
        </div>
      </main>
    );
  }

  const isSigned = Boolean(proposal.signedAt);
  const sectorLabel = truncateText(formatReadableText(proposal.sector), 160);

  return (
    <main className="proposal-branded min-h-screen w-full min-w-0 px-3 py-6 text-[var(--foreground)] sm:px-6 sm:py-12 transition-all" style={{ ...themeVars, ...pageBg }}>
      <div className="mx-auto w-full min-w-0 max-w-4xl grid gap-6 sm:gap-8">
        
        {/* Main Proposal Card Container */}
        <article className="glass w-full min-w-0 overflow-hidden rounded-2xl sm:rounded-3xl border border-[color-mix(in_srgb,var(--brand-primary)_25%,var(--line))] shadow-2xl bg-[color-mix(in_srgb,var(--panel-strong)_95%,transparent)]">
          
          {/* Custom Branded Header Banner */}
          <header className="brand-header border-b border-[var(--line)] px-6 py-8 sm:px-12 sm:py-10 flex flex-col gap-6">
            <div>
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[var(--muted)]">
                <Award size={14} className="brand-accent-icon" />
                <span>{t("officialBadge")}</span>
              </div>
              <h1 className="brand-heading mt-2 text-3xl sm:text-5xl font-black leading-tight">
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
                  <span>
                    {t("budget")} € {Number(proposal.budget).toLocaleString()}
                  </span>
                </span>
                <span className="rounded-xl border border-[var(--line)] bg-[var(--panel-strong)] px-4 py-2 text-xs text-[var(--muted)] flex items-center gap-2 shadow-sm">
                  <Calendar size={14} />
                  <span>
                    {t("expires")}: {formatDate(proposal.expiresAt, locale)}
                  </span>
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                <LocaleSwitcher compact />
                <button
                  onClick={() => window.print()}
                  className="no-print btn-secondary text-xs px-4 py-2 flex items-center gap-2 shrink-0"
                >
                  <Printer size={14} />
                  <span>{t("print")}</span>
                </button>
              </div>
            </div>
          </header>

          {/* Proposal HTML Document Content */}
          <div className="proposal-document min-w-0 px-4 py-8 sm:px-12 sm:py-10 max-w-none border-b border-[var(--line)] bg-[var(--panel-strong)] overflow-x-hidden break-words [overflow-wrap:anywhere]">
            <div className="min-w-0 max-w-full" dangerouslySetInnerHTML={{ __html: documentHtml }} />
          </div>

          {/* Official Sign/Contract Panel */}
          <section className="no-print bg-[color-mix(in_srgb,var(--panel)_50%,transparent)] px-6 py-8 sm:px-12 border-t border-[var(--line)]">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-secondary,var(--brand-primary))] text-white shadow-md">
                <FileSignature size={18} />
              </div>
              <div>
                <h2 className="brand-heading text-xl font-black tracking-tight">{t("signTitle")}</h2>
                <p className="text-xs text-[var(--muted)]">{t("signSubtitle")}</p>
              </div>
            </div>

            {isSigned ? (
              /* Signed DocuSign-like Seal */
              <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/5 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm animate-in fade-in duration-300">
                <div className="grid gap-1">
                  <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-extrabold text-sm">
                    <ShieldCheck size={16} />
                    <span>{t("signedTitle")}</span>
                  </div>
                  <p className="text-xs text-[var(--muted)] mt-1">
                    {t("signedBy")}{" "}
                    <strong className="text-[var(--foreground)]">{proposal.signedBy}</strong>
                  </p>
                  <p className="text-[10px] text-[var(--muted)] font-mono">
                    {t("signedAt")}: {formatDate(proposal.signedAt, locale)}
                  </p>
                </div>
                
                {/* Visual Stamp Seal */}
                <div className="border-2 border-dashed border-emerald-600/30 rounded-xl px-4 py-3 flex flex-col items-center justify-center rotate-[-2deg] max-w-[220px] self-start md:self-auto shrink-0 bg-emerald-500/5 font-mono text-[9px] text-emerald-600 dark:text-emerald-400">
                  <p className="font-extrabold uppercase tracking-widest text-[10px] border-b border-emerald-500/20 pb-1 mb-1">
                    {t("approved")}
                  </p>
                  <p className="truncate w-full text-center">
                    {t("signature")}: {proposal.signedBy}
                  </p>
                  <p className="text-[8px] opacity-70">HASH ID: {token.slice(0, 10)}...</p>
                </div>
              </div>
            ) : (
              /* Beautiful active signing input form */
              <div className="grid gap-4 max-w-lg">
                <p className="text-xs text-[var(--muted)] leading-relaxed">{t("signHint")}</p>

                <label className="grid gap-1 text-xs font-bold text-[var(--muted)] uppercase tracking-wide">
                  {t("clientCommentLabel")}
                  <textarea
                    className="input text-sm resize-y"
                    rows={3}
                    placeholder={t("clientCommentPlaceholder")}
                    value={clientComment}
                    onChange={(e) => setClientComment(e.target.value)}
                    maxLength={2000}
                  />
                </label>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)] opacity-60" size={17} />
                    <input
                      className="input input-with-icon"
                      required
                      placeholder={t("signPlaceholder")}
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
                      <span className="inline-block animate-pulse">{t("signing")}</span>
                    ) : (
                      <>
                        <span>{t("signButton")}</span>
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

      </div>
    </main>
  );
}
