"use client";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Link, useRouter } from "@/i18n/navigation";
import { useParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import {
  ArrowLeft, ExternalLink, FileText, CheckCircle, Send,
  Eye, PenLine, Clock, Save, Loader2, AlertTriangle, BadgeEuro,
  Copy, QrCode, Lock, Webhook, BookTemplate, Star
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
  password?: string;
  viewCount?: number;
  clientComment?: string;
  isTemplate?: boolean;
  templateName?: string;
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
  const [password, setPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [savingWebhook, setSavingWebhook] = useState(false);
  const [webhookSaved, setWebhookSaved] = useState(false);
  const [cloning, setCloning] = useState(false);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const router = useRouter();

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
    setPassword(payload.proposal.password ?? "");

    // Load webhook URL
    const wRes = await fetch("/api/workspaces/webhook");
    if (wRes.ok) {
      const wData = (await wRes.json()) as { url?: string };
      setWebhookUrl(wData.url ?? "");
    }

    // Generate QR code for share link
    if (payload.proposal.shareToken) {
      const origin = window.location.origin;
      const shareLink = `${origin}/p/${payload.proposal.shareToken}`;
      const QRCode = (await import("qrcode")).default;
      const dataUrl = await QRCode.toDataURL(shareLink, { width: 200, margin: 2 });
      setQrDataUrl(dataUrl);
    }
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

  async function savePassword() {
    setSavingPassword(true);
    await fetch(`/api/proposals/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ password })
    });
    setSavingPassword(false);
    setPasswordSaved(true);
    setTimeout(() => setPasswordSaved(false), 2000);
  }

  async function saveWebhook() {
    setSavingWebhook(true);
    await fetch("/api/workspaces/webhook", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: webhookUrl })
    });
    setSavingWebhook(false);
    setWebhookSaved(true);
    setTimeout(() => setWebhookSaved(false), 2000);
  }

  async function cloneProposal() {
    setCloning(true);
    const res = await fetch(`/api/proposals/${id}/clone`, { method: "POST" });
    setCloning(false);
    if (res.ok) {
      const data = (await res.json()) as { proposal: { id: string } };
      router.push(`/workspace/proposals/${data.proposal.id}`);
    }
  }

  async function toggleTemplate() {
    setSavingTemplate(true);
    const isTemplate = !proposal?.isTemplate;
    const templateName = isTemplate ? (proposal?.company || "Template") : "";
    await fetch(`/api/proposals/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ isTemplate, templateName })
    });
    await load();
    setSavingTemplate(false);
  }

  async function copyShareLink() {
    if (!proposal?.shareToken) return;
    const origin = window.location.origin;
    await navigator.clipboard.writeText(`${origin}/p/${proposal.shareToken}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-1">
                    {t("workflow")}
                  </p>
                  <h1 className="text-3xl font-black tracking-tight break-words">{proposal.company}</h1>
                  {proposal.sector && (
                    <p className="text-sm text-[var(--muted)] mt-1 line-clamp-3 break-words">{proposal.sector}</p>
                  )}
                  {proposal.budget > 0 && (
                    <p className="mt-2 flex items-center gap-1.5 text-xl font-black text-[var(--accent)]">
                      <BadgeEuro size={18} />
                      € {Number(proposal.budget).toLocaleString(locale)}
                    </p>
                  )}
                  {proposal.viewCount !== undefined && proposal.viewCount > 0 && (
                    <div className="flex items-center gap-1.5 text-xs text-[var(--muted)] mt-2">
                      <Eye size={13} />
                      {t("viewCount", { count: proposal.viewCount })}
                    </div>
                  )}
                </div>

                <div className="w-full lg:w-auto lg:max-w-[min(100%,32rem)] shrink-0">
                  <div className="flex flex-wrap gap-2 justify-start lg:justify-end">
                    {proposal.shareToken && (
                      <a
                        href={`/p/${proposal.shareToken}`}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-primary text-xs !min-h-9 !py-2 !px-3 gap-1.5"
                      >
                        <ExternalLink size={14} className="shrink-0" />
                        {t("openClientLink")}
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={copyShareLink}
                      className="btn-secondary text-xs !min-h-9 !py-2 !px-3 gap-1.5"
                    >
                      {copied ? <CheckCircle size={14} className="text-emerald-500 shrink-0" /> : <Copy size={14} className="shrink-0" />}
                      {copied ? t("copied") : t("copyLink")}
                    </button>
                    <a
                      href={`/api/proposals/${id}/pdf`}
                      className="btn-secondary text-xs !min-h-9 !py-2 !px-3 gap-1.5"
                    >
                      <FileText size={14} className="shrink-0" />
                      {t("exportPdf")}
                    </a>
                    <button
                      type="button"
                      onClick={cloneProposal}
                      disabled={cloning}
                      className="btn-secondary text-xs !min-h-9 !py-2 !px-3 gap-1.5"
                    >
                      {cloning ? <Loader2 size={13} className="animate-spin shrink-0" /> : <Copy size={13} className="shrink-0" />}
                      {t("clone")}
                    </button>
                    <button
                      type="button"
                      onClick={toggleTemplate}
                      disabled={savingTemplate}
                      className={`btn-secondary text-xs !min-h-9 !py-2 !px-3 gap-1.5 ${proposal.isTemplate ? "border-amber-500/40 text-amber-600" : ""}`}
                    >
                      {savingTemplate ? <Loader2 size={13} className="animate-spin shrink-0" /> : <Star size={13} className="shrink-0" />}
                      {proposal.isTemplate ? t("removeTemplate") : t("saveAsTemplate")}
                    </button>
                  </div>
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

            {/* Client comment (read-only) */}
            {proposal.clientComment && (
              <div className="glass rounded-2xl p-6">
                <h2 className="text-sm font-black uppercase tracking-wider text-[var(--muted)] mb-3 flex items-center gap-2">
                  <Eye size={14} />
                  {t("clientComment")}
                </h2>
                <p className="text-sm text-[var(--foreground)] bg-[var(--panel-strong)] rounded-xl p-3 border border-[var(--line)]">
                  {proposal.clientComment}
                </p>
              </div>
            )}

            {/* Password protection */}
            <div className="glass rounded-2xl p-6">
              <h2 className="text-sm font-black uppercase tracking-wider text-[var(--muted)] mb-3 flex items-center gap-2">
                <Lock size={14} />
                {t("passwordSection")}
              </h2>
              <p className="text-xs text-[var(--muted)] mb-3">{t("passwordHint")}</p>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <input
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t("passwordPlaceholder")}
                  className="input text-sm w-full min-w-0 sm:flex-1"
                  maxLength={100}
                />
                <button
                  type="button"
                  onClick={() => void savePassword()}
                  disabled={savingPassword}
                  className="btn-secondary text-xs !min-h-10 gap-1.5 shrink-0 w-full sm:w-auto"
                >
                  {savingPassword ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                  {passwordSaved ? t("saved") : t("save")}
                </button>
              </div>
              {password && (
                <p className="text-[10px] text-amber-600 mt-1">{t("passwordActive")}</p>
              )}
            </div>

            {/* QR Code */}
            {qrDataUrl && proposal.shareToken && (
              <div className="glass rounded-2xl p-6">
                <h2 className="text-sm font-black uppercase tracking-wider text-[var(--muted)] mb-3 flex items-center gap-2">
                  <QrCode size={14} />
                  {t("qrCode")}
                </h2>
                <div className="flex flex-col sm:flex-row items-start gap-4">
                  <img src={qrDataUrl} alt="QR code" className="rounded-xl border border-[var(--line)] w-[120px] h-[120px]" />
                  <div>
                    <p className="text-xs text-[var(--muted)] mb-2">{t("qrHint")}</p>
                    <a
                      href={qrDataUrl}
                      download={`qr-${proposal.shareToken}.png`}
                      className="btn-secondary text-xs inline-flex items-center gap-1.5"
                    >
                      <FileText size={13} />
                      {t("downloadQr")}
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* Webhook */}
            <div className="glass rounded-2xl p-6">
              <h2 className="text-sm font-black uppercase tracking-wider text-[var(--muted)] mb-3 flex items-center gap-2">
                <Webhook size={14} />
                {t("webhookSection")}
              </h2>
              <p className="text-xs text-[var(--muted)] mb-3 leading-relaxed">{t("webhookHint")}</p>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <input
                  type="url"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  placeholder="https://hooks.zapier.com/..."
                  className="input text-sm w-full min-w-0 font-mono sm:flex-1"
                />
                <button
                  type="button"
                  onClick={() => void saveWebhook()}
                  disabled={savingWebhook}
                  className="btn-secondary text-xs !min-h-10 gap-1.5 shrink-0 w-full sm:w-auto"
                >
                  {savingWebhook ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                  {webhookSaved ? t("saved") : t("save")}
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
