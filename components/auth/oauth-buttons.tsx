"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import {
  getRedirectResult,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  type User
} from "firebase/auth";
import { authProviders, getClientAuth } from "@/lib/firebase/client";

type ProviderKey = "google" | "github";

const REDIRECT_FLAG = "quotegen_oauth_redirect";

async function completeServerSession(idToken: string, sessionError: string) {
  const response = await fetch("/api/auth/firebase", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken })
  });
  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(payload.error || sessionError);
  }
}

export function OAuthButtons({
  onSuccess,
  onError
}: {
  onSuccess: () => void;
  onError: (msg: string) => void;
}) {
  const t = useTranslations("oauth");
  const [loading, setLoading] = useState<ProviderKey | null>(null);
  const [finishing, setFinishing] = useState(false);
  const handledRef = useRef(false);

  async function handleFirebaseUser(user: User) {
    if (handledRef.current) return;
    handledRef.current = true;
    setFinishing(true);
    setLoading(null);
    try {
      const idToken = await user.getIdToken(true);
      await completeServerSession(idToken, t("sessionError"));
      sessionStorage.removeItem(REDIRECT_FLAG);
      onSuccess();
      const pendingInvite = sessionStorage.getItem("pending_invite");
      if (pendingInvite) {
        sessionStorage.removeItem("pending_invite");
        window.location.assign(`/invite/${pendingInvite}`);
      } else {
        window.location.assign("/dashboard");
      }
    } catch (error) {
      handledRef.current = false;
      sessionStorage.removeItem(REDIRECT_FLAG);
      setFinishing(false);
      onError(error instanceof Error ? error.message : t("socialFailed"));
    }
  }

  useEffect(() => {
    let auth;
    try {
      auth = getClientAuth();
    } catch {
      return;
    }

    const pendingRedirect = sessionStorage.getItem(REDIRECT_FLAG);
    if (pendingRedirect) setFinishing(true);

    void getRedirectResult(auth).then((result) => {
      if (result?.user) void handleFirebaseUser(result.user);
    });

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user || handledRef.current || !sessionStorage.getItem(REDIRECT_FLAG)) return;
      void handleFirebaseUser(user);
    });

    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function signIn(providerKey: ProviderKey) {
    setLoading(providerKey);
    setFinishing(false);
    handledRef.current = false;
    try {
      const auth = getClientAuth();
      const result = await signInWithPopup(auth, authProviders[providerKey]);
      await handleFirebaseUser(result.user);
    } catch (error) {
      const code = (error as { code?: string })?.code;
      if (code === "auth/popup-blocked" || code === "auth/popup-closed-by-user") {
        sessionStorage.setItem(REDIRECT_FLAG, providerKey);
        setFinishing(true);
        const auth = getClientAuth();
        await signInWithRedirect(auth, authProviders[providerKey]);
        return;
      }
      setLoading(null);

      const message = error instanceof Error ? error.message : t("socialFailed");
      if (message.includes("Firebase client non configurato") || message.includes("Firebase client not configured")) {
        onError(t("firebaseNotConfigured"));
      } else {
        onError(message);
      }
    }
  }

  return (
    <div className="grid gap-2">
      {finishing ? (
        <div className="rounded-xl border border-[var(--line)] bg-[var(--panel-strong)] px-3 py-2 text-center text-xs text-[var(--muted)]">
          <span className="inline-block animate-pulse">{t("completing")}</span>
        </div>
      ) : null}

      <button
        type="button"
        disabled={Boolean(loading) || finishing}
        onClick={() => signIn("google")}
        className="btn-secondary flex items-center justify-center gap-3 px-4 py-2.5 text-sm font-bold shadow-sm transition-all hover:bg-[var(--panel)] hover:border-[var(--accent)] hover:translate-y-[-1px] disabled:opacity-50"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        <span>{t("continueWithGoogle")}</span>
      </button>

      <button
        type="button"
        disabled={Boolean(loading) || finishing}
        onClick={() => signIn("github")}
        className="btn-secondary flex items-center justify-center gap-3 px-4 py-2.5 text-sm font-bold shadow-sm transition-all hover:bg-[var(--panel)] hover:border-[var(--accent)] hover:translate-y-[-1px] disabled:opacity-50"
      >
        <svg className="h-5 w-5 text-[var(--foreground)]" viewBox="0 0 24 24" fill="currentColor">
          <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.9-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.52 2.34 1.08 2.91.83.1-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0012 2z" />
        </svg>
        <span>{t("continueWithGithub")}</span>
      </button>
    </div>
  );
}
