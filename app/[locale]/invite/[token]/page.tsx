"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Sparkles, UserPlus, CheckCircle, AlertTriangle, Loader2 } from "lucide-react";

type InviteInfo = {
  valid: boolean;
  tenantId: string;
  role: string;
  expiresAt: string;
};

export default function InvitePage() {
  const t = useTranslations("invite");
  const params = useParams<{ token: string }>();
  const token = params.token;
  const router = useRouter();

  const [invite, setInvite] = useState<InviteInfo | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    void (async () => {
      // Check if user is already logged in
      const meRes = await fetch("/api/auth/me");
      if (meRes.ok) {
        const me = (await meRes.json()) as { authenticated?: boolean };
        setIsLoggedIn(!!me.authenticated);
      }

      // Validate invite
      const res = await fetch(`/api/invite/${token}`);
      if (!res.ok) {
        const payload = (await res.json()) as { error?: string };
        setError(payload.error || t("invalid"));
        setLoading(false);
        return;
      }
      const data = (await res.json()) as InviteInfo;
      setInvite(data);
      setLoading(false);
    })();
  }, [token, t]);

  async function acceptInvite() {
    setAccepting(true);
    const res = await fetch(`/api/invite/${token}`, { method: "POST" });
    if (!res.ok) {
      const payload = (await res.json()) as { error?: string };
      setError(payload.error || t("acceptFailed"));
      setAccepting(false);
      return;
    }
    setSuccess(true);
    setTimeout(() => router.replace("/dashboard"), 2000);
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <Loader2 size={32} className="animate-spin text-[var(--accent)]" />
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[var(--background)] px-4">
      <div className="w-full max-w-md">
        <div className="glass rounded-3xl p-8 shadow-xl text-center">
          {/* Logo */}
          <div className="mb-6 flex justify-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--accent)] to-[var(--accent-2)] text-white shadow-lg">
              <Sparkles size={24} />
            </span>
          </div>

          {error ? (
            <>
              <AlertTriangle size={40} className="mx-auto text-amber-500 mb-4" />
              <h1 className="text-2xl font-black mb-2">{t("invalidTitle")}</h1>
              <p className="text-sm text-[var(--muted)]">{error}</p>
            </>
          ) : success ? (
            <>
              <CheckCircle size={40} className="mx-auto text-emerald-500 mb-4" />
              <h1 className="text-2xl font-black mb-2">{t("successTitle")}</h1>
              <p className="text-sm text-[var(--muted)]">{t("successDesc")}</p>
            </>
          ) : invite ? (
            <>
              <UserPlus size={40} className="mx-auto text-[var(--accent)] mb-4" />
              <h1 className="text-2xl font-black mb-2">{t("title")}</h1>
              <p className="text-sm text-[var(--muted)] mb-2">{t("roleDesc", { role: invite.role })}</p>
              <p className="text-xs text-[var(--muted)] mb-6">
                {t("expires")} {new Date(invite.expiresAt).toLocaleDateString()}
              </p>

              {isLoggedIn ? (
                <button
                  type="button"
                  onClick={acceptInvite}
                  disabled={accepting}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  {accepting ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <UserPlus size={16} />
                  )}
                  {accepting ? t("accepting") : t("acceptBtn")}
                </button>
              ) : (
                <div className="grid gap-3">
                  <p className="text-xs text-[var(--muted)]">{t("loginRequired")}</p>
                  <button
                    type="button"
                    onClick={() => {
                      sessionStorage.setItem("pending_invite", token);
                      router.push("/login");
                    }}
                    className="btn-primary w-full"
                  >
                    {t("loginToAccept")}
                  </button>
                </div>
              )}
            </>
          ) : null}
        </div>
      </div>
    </main>
  );
}
