"use client";

import { SiteFooter } from "@/components/site-footer";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Users, UserPlus, Copy, Check, Trash2, Crown, Shield, Pencil, Eye, RefreshCw, Loader2 } from "lucide-react";
import type { WorkspaceMember } from "@/lib/db/types";

const roleIcons = {
  owner: Crown,
  admin: Shield,
  editor: Pencil,
  viewer: Eye
};

export default function MembersPage() {
  const t = useTranslations("members");
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [inviteUrl, setInviteUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);

  async function loadMembers() {
    setLoading(true);
    const res = await fetch("/api/workspaces/members");
    if (res.ok) {
      const data = (await res.json()) as { members: WorkspaceMember[] };
      setMembers(data.members);
    }
    setLoading(false);
  }

  useEffect(() => { void loadMembers(); }, []);

  async function createInvite() {
    setInviting(true);
    setMessage("");
    const res = await fetch("/api/workspaces/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: "editor" })
    });
    const payload = (await res.json()) as { url?: string; error?: string };
    if (!res.ok || !payload.url) {
      setMessage(payload.error || t("inviteError"));
      setInviting(false);
      return;
    }
    setInviteUrl(payload.url);
    setInviting(false);
  }

  async function copyInvite() {
    if (!inviteUrl) return;
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function removeMember(userId: string) {
    if (!confirm(t("confirmRemove"))) return;
    setRemoving(userId);
    const res = await fetch("/api/workspaces/members", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId })
    });
    if (res.ok) {
      setMembers((prev) => prev.filter((m) => m.userId !== userId));
    } else {
      const payload = (await res.json()) as { error?: string };
      setMessage(payload.error || t("removeError"));
    }
    setRemoving(null);
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 pb-10">
      {/* Header */}
      <header className="glass-premium rounded-3xl p-6 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--accent)]">
              <Users size={14} aria-hidden />
              {t("eyebrow")}
            </div>
            <h1 className="mt-1 text-3xl font-black tracking-tight">{t("title")}</h1>
            <p className="mt-2 max-w-xl text-sm font-medium text-[var(--muted)]">{t("description")}</p>
          </div>
          <button
            type="button"
            onClick={() => void loadMembers()}
            disabled={loading}
            className="btn-secondary shrink-0 flex items-center gap-2 text-xs font-bold"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            {t("refresh")}
          </button>
        </div>
      </header>

      {/* Invite section */}
      <div className="glass rounded-2xl p-6">
        <h2 className="text-base font-black mb-1">{t("inviteTitle")}</h2>
        <p className="text-xs text-[var(--muted)] mb-4">{t("inviteDesc")}</p>

        {inviteUrl ? (
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              readOnly
              value={inviteUrl}
              className="input text-xs font-mono flex-1 select-all"
            />
            <button
              type="button"
              onClick={copyInvite}
              className="btn-primary flex items-center gap-2 text-xs font-bold shrink-0"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? t("copied") : t("copyLink")}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={createInvite}
            disabled={inviting}
            className="btn-primary flex items-center gap-2 text-sm font-bold"
          >
            {inviting ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
            {inviting ? t("generating") : t("generateLink")}
          </button>
        )}

        {inviteUrl && (
          <p className="text-xs text-[var(--muted)] mt-2">{t("linkHint")}</p>
        )}
      </div>

      {/* Error message */}
      {message && (
        <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-300">
          {message}
        </p>
      )}

      {/* Member list */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="border-b border-[var(--line)] px-6 py-4 flex items-center gap-2">
          <Users size={16} className="text-[var(--muted)]" />
          <span className="font-black text-sm">{t("memberList")} ({members.length})</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-sm text-[var(--muted)] animate-pulse">
            <Loader2 size={16} className="animate-spin" />
            {t("loading")}
          </div>
        ) : members.length === 0 ? (
          <p className="text-center text-sm text-[var(--muted)] py-10">{t("noMembers")}</p>
        ) : (
          <ul className="divide-y divide-[var(--line)]">
            {members.map((m) => {
              const Icon = roleIcons[m.role] ?? Eye;
              return (
                <li key={m.userId} className="flex items-center justify-between gap-4 px-6 py-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--line)] text-[var(--foreground)] text-sm font-black">
                      {(m.displayName || m.email)?.[0]?.toUpperCase() ?? "?"}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-[var(--foreground)] truncate">
                        {m.displayName || m.email}
                      </p>
                      {m.displayName && (
                        <p className="text-xs text-[var(--muted)] truncate">{m.email}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="inline-flex items-center gap-1 rounded-full bg-[var(--accent-glow)] px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-[var(--accent)]">
                      <Icon size={10} />
                      {m.role}
                    </span>
                    {m.role !== "owner" && (
                      <button
                        type="button"
                        disabled={removing === m.userId}
                        onClick={() => removeMember(m.userId)}
                        className="btn-secondary text-xs p-1.5 border-red-500/20 text-red-500 hover:bg-red-500/10"
                        title={t("remove")}
                      >
                        {removing === m.userId ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : (
                          <Trash2 size={13} />
                        )}
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <SiteFooter />
    </div>
  );
}
