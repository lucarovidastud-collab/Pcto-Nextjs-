"use client";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Link } from "@/i18n/navigation";
import { useParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import {
  ArrowLeft, ExternalLink, FileText, CheckCircle, Send,
  Eye, PenLine, Clock, Save, Loader2, AlertTriangle, BadgeEuro
} from "lucide-react";

type Proposal = {
  id: string;
  company: string;
  sector: string;
  website: string;
  budget: number;
  status: string;
  shareToken?: string;
  expiresAt?: string;
  signedAt?: string;
  signedBy?: string;
  createdAt?: string;
  updatedAt?: string;
  internalNotes?: string;
};

const STATUS_CONFIG = {
  draft:    { label: "Draft",    color: "bg-slate-500/15 text-slate-600 dark:text-slate-300", icon: PenLine },
  review:   { label: "Review",  color: "bg-amber-500/15 text-amber-700 dark:text-amber-300", icon: Eye },
  approved: { label: "Approved",color: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400", icon: CheckCircle },
  sent:     { label: "Sent",    color: "bg-blue-500/15 text-blue-700 dark:text-blue-300", icon: Send },
};

function formatDate(iso: string | undefined, locale: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(locale, { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function WorkspaceProposalPage() {
  const t = useTranslations("workspace");
  const locale = useLocale();
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [notesSaved, setNotesSaved] = useState(false);

  const load = async () => {
    const response = await fetch(`/api/proposals/${id}`, { credentials: "include" });
    if (!response.ok) {
      setMessage(t("notFound"));
      setError(true);
      return;
    }
    const payload = (await response.json()) as { proposal: Proposal };
    setProposal(payload.proposal);
    setNotes(payload.proposal.internalNotes ?? "");
  };

  useEffect(() => { void load(); }, [id]);

  async function setStatus(status: "draft" | "review" | "approved" | "sent") {
    setUpdatingStatus(status);
    const response = await fetch(`/api/proposals/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ status })
    });
    setUpdatingStatus(null);
    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      setMessage(payload.error || t("updateFailed"));
      return;
    }
    setMessage("");
    await load();
  }

  async function saveNotes() {
    setSavingNotes(true);
    await fetch(`/api/proposals/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ internalNotes: notes })
    });
    setSavingNotes(false);
    setNotesSaved(true);
    setTimeout(() => setNotesSaved(false), 2000);
  }

  const statusKeys = ["draft", "review", "approved", "sent"] as const;

  return (
    <DashboardShell>
      <div className="mx-auto max-w-4xl flex flex-col gap-6 pb-10">

        {/* Back link */}
        <Link
          href="/dashboard/history"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--muted)] hover:text-[var(--foreground)] transition-colors w-fit"
        >
          <ArrowLeft size={14} />
          {t("backToHistory")}
        </Link>

        {error || (!proposal && message) ? (
          <div className="glass rounded-2xl p-10 text-center">
            <AlertTriangle size={36} className="mx-auto text-amber-500 mb-3" />
            <p className="font-bold text-[var(--muted)]">{message}</p>
          </div>
        ) : !proposal ? (
          <div className="flex items-center justify-center py-20 gap-2 text-[var(--muted)] animate-pulse">
            <Loader2 size={18} className="animate-spin" />
            {t("loading")}
          </div>
        ) : (
          <>
            {/* Header card */}
            <div className="glass-premium rounded-3xl p-6 sm:p-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-1">
                    {t("workflow")}
                  </p>
                  <h1 className="text-3xl font-black tracking-tight">{proposal.company}</h1>
                  {proposal.sector && (
                    <p className="text-sm text-[var(--muted)] mt-1">{proposal.sector}</p>
                  )}
                  {proposal.budget > 0 && (
                    <p className="mt-2 flex items-center gap-1.5 text-xl font-black text-[var(--accent)]">
                      <BadgeEuro size={18} />
                      € {Number(proposal.budget).toLocaleString(locale)}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 shrink-0">
                  {proposal.shareToken && (
                    <a
                      href={`/p/${proposal.shareToken}`}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-primary text-xs flex items-center gap-1.5"
                    >
                      <ExternalLink size={14} />
                      {t("openClientLink")}
                    </a>
                  )}
                  <a
                    href={`/api/proposals/${id}/pdf`}
                    className="btn-secondary text-xs flex items-center gap-1.5"
                  >
                    <FileText size={14} />
                    {t("exportPdf")}
                  </a>
                </div>
              </div>
            </div>

            {/* Status workflow */}
            <div className="glass rounded-2xl p-6">
              <h2 className="text-sm font-black uppercase tracking-wider text-[var(--muted)] mb-4">
                {t("currentStatus")}
              </h2>

              <div className="flex flex-wrap gap-3">
                {statusKeys.map((s) => {
                  const cfg = STATUS_CONFIG[s];
                  const Icon = cfg.icon;
                  const isActive = proposal.status === s;
                  const isLoading = updatingStatus === s;
                  return (
                    <button
                      key={s}
                      type="button"
                      disabled={isActive || !!updatingStatus}
                      onClick={() => void setStatus(s)}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all border ${
                        isActive
                          ? `${cfg.color} border-current shadow-sm`
                          : "border-[var(--line)] text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
                      } disabled:opacity-60`}
                    >
                      {isLoading ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Icon size={14} />
                      )}
                      {cfg.label}
                      {isActive && (
                        <span className="ml-1 text-[10px] font-black uppercase">✓</span>
                      )}
                    </button>
                  );
                })}
              </div>

              {message && (
                <p className="mt-3 text-xs text-red-600 dark:text-red-400 font-medium">{message}</p>
              )}
            </div>

            {/* Internal notes */}
            <div className="glass rounded-2xl p-6">
              <h2 className="text-sm font-black uppercase tracking-wider text-[var(--muted)] mb-3">
                {t("internalNotes")}
              </h2>
              <textarea
                value={notes}
                onChange={(e) => { setNotes(e.target.value); setNotesSaved(false); }}
                rows={4}
                placeholder={t("internalNotesPlaceholder")}
                className="input w-full resize-y text-sm"
              />
              <div className="flex items-center justify-end gap-2 mt-2">
                {notesSaved && (
                  <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                    <CheckCircle size={12} /> {t("notesSaved")}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => void saveNotes()}
                  disabled={savingNotes}
                  className="btn-secondary text-xs flex items-center gap-1.5"
                >
                  {savingNotes ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                  {t("saveNotes")}
                </button>
              </div>
            </div>

            {/* Timeline */}
            <div className="glass rounded-2xl p-6">
              <h2 className="text-sm font-black uppercase tracking-wider text-[var(--muted)] mb-4">
                {t("timeline")}
              </h2>
              <ol className="relative border-l border-[var(--line)] ml-3 space-y-5">
                {proposal.createdAt && (
                  <li className="ml-5">
                    <span className="absolute -left-[9px] flex h-4 w-4 items-center justify-center rounded-full bg-[var(--accent)] ring-4 ring-[var(--background)]">
                      <Clock size={8} className="text-white" />
                    </span>
                    <p className="text-xs font-bold text-[var(--foreground)]">{t("created")}</p>
                    <p className="text-[11px] text-[var(--muted)]">{formatDate(proposal.createdAt, locale)}</p>
                  </li>
                )}
                {proposal.updatedAt && proposal.updatedAt !== proposal.createdAt && (
                  <li className="ml-5">
                    <span className="absolute -left-[9px] flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 ring-4 ring-[var(--background)]">
                      <PenLine size={8} className="text-white" />
                    </span>
                    <p className="text-xs font-bold text-[var(--foreground)]">{t("lastUpdated")}</p>
                    <p className="text-[11px] text-[var(--muted)]">{formatDate(proposal.updatedAt, locale)}</p>
                  </li>
                )}
                {proposal.signedAt && (
                  <li className="ml-5">
                    <span className="absolute -left-[9px] flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 ring-4 ring-[var(--background)]">
                      <CheckCircle size={8} className="text-white" />
                    </span>
                    <p className="text-xs font-bold text-[var(--foreground)]">{t("signedBy")}: {proposal.signedBy}</p>
                    <p className="text-[11px] text-[var(--muted)]">{formatDate(proposal.signedAt, locale)}</p>
                  </li>
                )}
                {proposal.expiresAt && (
                  <li className="ml-5">
                    <span className={`absolute -left-[9px] flex h-4 w-4 items-center justify-center rounded-full ring-4 ring-[var(--background)] ${
                      new Date(proposal.expiresAt) < new Date() ? "bg-red-500" : "bg-slate-400"
                    }`}>
                      <Clock size={8} className="text-white" />
                    </span>
                    <p className="text-xs font-bold text-[var(--foreground)]">{t("linkExpiry")}</p>
                    <p className="text-[11px] text-[var(--muted)]">{formatDate(proposal.expiresAt, locale)}</p>
                  </li>
                )}
              </ol>
            </div>
          </>
        )}
      </div>
    </DashboardShell>
  );
}
