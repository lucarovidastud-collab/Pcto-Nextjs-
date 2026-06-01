"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { OAuthButtons } from "@/components/auth/oauth-buttons";
import { Building2, Mail, Lock, Sparkles, ArrowRight, ShieldCheck, Check } from "lucide-react";
import { useState } from "react";
import { getClientAuth } from "@/lib/firebase/client";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";

type Tab = "login" | "register";

export default function LoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function completeFirebaseServerSession(idToken: string) {
    const response = await fetch("/api/auth/firebase", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken })
    });
    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      throw new Error(payload.error || "Impossibile registrare la sessione sul server.");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    
    if (!email.trim() || !password.trim()) {
      setError("Inserisci sia l'email che la password.");
      return;
    }
    
    setLoading(true);

    // Real Credentials Auth via Firebase
    try {
      let auth;
      try {
        auth = getClientAuth();
      } catch {
        throw new Error("Il login con email e password richiede Firebase Auth configurato. Usa il login Google o GitHub.");
      }

      if (tab === "login") {
        const result = await signInWithEmailAndPassword(auth, email.trim(), password);
        const idToken = await result.user.getIdToken(true);
        await completeFirebaseServerSession(idToken);
        setSuccess("Accesso riuscito! Caricamento dashboard...");
      } else {
        const result = await createUserWithEmailAndPassword(auth, email.trim(), password);
        const idToken = await result.user.getIdToken(true);
        await completeFirebaseServerSession(idToken);
        setSuccess("Registrazione completata! Creazione del tuo workspace...");
      }

      setTimeout(() => {
        window.location.assign("/dashboard");
      }, 1000);
    } catch (err) {
      setLoading(false);
      const code = (err as { code?: string })?.code;
      let msg = err instanceof Error ? err.message : "Si è verificato un errore.";
      
      if (code === "auth/invalid-credential") {
        msg = "Credenziali non valide o utente non trovato.";
      } else if (code === "auth/email-already-in-use") {
        msg = "Questo indirizzo email è già registrato. Accedi con questa email.";
      } else if (code === "auth/weak-password") {
        msg = "La password deve contenere almeno 6 caratteri.";
      } else if (code === "auth/operation-not-allowed") {
        msg = "L'accesso con Email/Password non è abilitato nella console Firebase Auth.";
      }
      
      setError(msg);
    }
  }

  return (
    <main className="grid min-h-screen lg:grid-cols-[1.1fr_1fr] bg-[var(--background)]">
      {/* Left decorative column */}
      <section className="relative hidden flex-col justify-between overflow-hidden bg-slate-950 p-12 text-slate-100 lg:flex">
        {/* Floating gradient lights */}
        <div className="absolute -left-20 -top-20 h-80 w-80 rounded-full bg-teal-500/25 blur-3xl" />
        <div className="absolute -bottom-20 -right-20 h-80 w-80 rounded-full bg-violet-600/25 blur-3xl" />

        <div className="relative z-10 flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-teal-400 to-violet-500 text-white shadow-lg">
            <Sparkles size={16} />
          </span>
          <span className="text-lg font-black tracking-tight">QuoteGen <span className="bg-gradient-to-r from-teal-400 to-violet-400 bg-clip-text text-transparent">Engine</span></span>
        </div>

        <div className="relative z-10 my-auto max-w-lg">
          <span className="rounded-full bg-teal-500/10 border border-teal-500/20 px-3 py-1 text-xs font-bold text-teal-400">
            Enterprise Track
          </span>
          <h1 className="mt-6 text-5xl font-black leading-tight tracking-tight text-white">
            Ottimizza le tue vendite B2B in pochi secondi.
          </h1>
          <p className="mt-4 text-base text-slate-400 leading-relaxed">
            Un unico workspace per analizzare brand, calcolare budget preventivi tramite AI, richiedere la firma dei clienti e sincronizzare la fatturazione Stripe.
          </p>

          <ul className="mt-8 space-y-4">
            <li className="flex items-center gap-3 text-sm text-slate-300">
              <Check size={18} className="text-teal-400 shrink-0" />
              <span>Multi-Tenant avanzato e separazione dei dati</span>
            </li>
            <li className="flex items-center gap-3 text-sm text-slate-300">
              <Check size={18} className="text-teal-400 shrink-0" />
              <span>Analisi Brand intelligente tramite Scraping & AI Vision</span>
            </li>
            <li className="flex items-center gap-3 text-sm text-slate-300">
              <Check size={18} className="text-teal-400 shrink-0" />
              <span>Firma elettronica sicura del preventivo con timestamp</span>
            </li>
          </ul>
        </div>

        <div className="relative z-10 flex items-center justify-between border-t border-slate-800 pt-6 text-xs text-slate-500">
          <p>© 2026 QuoteGen Engine. Tutti i diritti riservati.</p>
          <div className="flex gap-3">
            <Link href="/terms" className="hover:text-slate-300 transition">Termini</Link>
            <Link href="/privacy" className="hover:text-slate-300 transition">Privacy</Link>
          </div>
        </div>
      </section>

      {/* Right form column */}
      <section className="flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md">
          {/* Logo only visible on mobile */}
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--accent)] to-[var(--accent-2)] text-white shadow-md">
              <Building2 size={20} />
            </div>
            <div>
              <p className="text-xs font-bold text-[var(--muted)]">QuoteGen Engine</p>
              <h2 className="text-lg font-black tracking-tight">Accedi al Workspace</h2>
            </div>
          </div>

          <div className="glass rounded-2xl p-6 sm:p-8 shadow-xl">
            {/* Custom Sliding Tabs Header */}
            <div className="mb-6 flex rounded-xl border border-[var(--line)] bg-[color-mix(in_srgb,var(--background)_40%,transparent)] p-1">
              <button
                type="button"
                className={`flex-1 rounded-lg py-2.5 text-sm font-bold transition-all ${
                  tab === "login"
                    ? "bg-[var(--foreground)] text-[var(--background)] shadow-sm"
                    : "text-[var(--muted)] hover:text-[var(--foreground)]"
                }`}
                onClick={() => {
                  setTab("login");
                  setError("");
                  setSuccess("");
                }}
              >
                Accedi
              </button>
              <button
                type="button"
                className={`flex-1 rounded-lg py-2.5 text-sm font-bold transition-all ${
                  tab === "register"
                    ? "bg-[var(--foreground)] text-[var(--background)] shadow-sm"
                    : "text-[var(--muted)] hover:text-[var(--foreground)]"
                }`}
                onClick={() => {
                  setTab("register");
                  setError("");
                  setSuccess("");
                }}
              >
                Registrati
              </button>
            </div>

            <h2 className="text-2xl font-black tracking-tight text-[var(--foreground)]">
              {tab === "login" ? "Bentornato" : "Crea il tuo Account"}
            </h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              {tab === "login"
                ? "Accedi con le tue credenziali o con i provider social."
                : "Inizia subito a generare preventivi brandizzati gratis."}
            </p>

            <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
              <label className="grid gap-1 text-xs font-extrabold text-[var(--muted)] uppercase tracking-wide">
                Email
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)] opacity-60" size={17} />
                  <input
                    type="email"
                    required
                    className="input input-with-icon"
                    placeholder="nome@azienda.it"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </label>

              <label className="grid gap-1 text-xs font-extrabold text-[var(--muted)] uppercase tracking-wide">
                Password
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)] opacity-60" size={17} />
                  <input
                    type="password"
                    required
                    className="input input-with-icon"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </label>

              {/* Feedback messages */}
              {error ? (
                <div className="rounded-xl border border-red-200 bg-red-500/10 px-4 py-3 text-xs text-red-600 leading-normal">
                  {error}
                </div>
              ) : null}
              {success ? (
                <div className="rounded-xl border border-emerald-200 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-600 font-semibold">
                  {success}
                </div>
              ) : null}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="btn-primary mt-2 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span className="inline-block animate-pulse">Caricamento in corso...</span>
                ) : (
                  <>
                    <span>{tab === "login" ? "Accedi all'account" : "Crea account gratis"}</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>


            {/* Separator */}
            <div className="relative my-6 text-center">
              <span className="absolute inset-x-0 top-1/2 h-px bg-[var(--line)]" />
              <span className="relative inline-block bg-[var(--panel-strong)] px-3 text-xs font-bold text-[var(--muted)] uppercase tracking-wider">
                oppure accedi con
              </span>
            </div>

            {/* OAuth buttons wrapper */}
            <OAuthButtons
              onSuccess={() => setSuccess("Login social riuscito! Avvio...")}
              onError={(msg) => setError(msg)}
            />
          </div>

          <p className="mt-6 text-center text-sm font-bold">
            <Link href="/" className="underline text-[var(--muted)] hover:text-[var(--foreground)]">
              Torna alla home page
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
