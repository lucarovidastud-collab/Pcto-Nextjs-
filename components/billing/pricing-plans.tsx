"use client";

import { Check, ShieldCheck, Sparkles, AlertCircle } from "lucide-react";
import { useState } from "react";

const plans = [
  {
    id: "starter" as const,
    name: "Starter",
    price: "10",
    subtitle: "Ideale per freelance e piccoli studi",
    features: [
      "40 proposte commerciali al mese",
      "Fino a 3 membri nel team",
      "Link cliente con scadenza automatica",
      "Esportazione PDF nativa"
    ]
  },
  {
    id: "growth" as const,
    name: "Growth",
    price: "29",
    subtitle: "Perfetto per agenzie e team attivi",
    features: [
      "300 proposte commerciali al mese",
      "Fino a 20 membri nel team",
      "Estrazione palette e brand styling avanzato",
      "Integrazione Stripe & Customer Portal"
    ],
    highlight: true
  },
  {
    id: "enterprise" as const,
    name: "Enterprise",
    price: "99",
    subtitle: "Per grandi aziende e volumi elevati",
    features: [
      "5000 proposte commerciali al mese",
      "Fino a 200 membri nel team",
      "Workflow avanzato di approvazione",
      "Supporto prioritario 24/7 dedicato"
    ]
  }
];

export function PricingPlans({ currentPlan }: { currentPlan: string }) {
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [useSandbox, setUseSandbox] = useState(true);

  async function checkout(plan: "starter" | "growth" | "enterprise") {
    setLoading(plan);
    setMessage("");
    try {
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, sandbox: useSandbox })
      });
      const payload = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !payload.url) {
        setMessage(payload.error || `Errore durante l'avvio del checkout. Verifica la configurazione Stripe.`);
        setLoading(null);
        return;
      }
      window.location.href = payload.url;
    } catch {
      setMessage("Errore di connessione. Riprova più tardi.");
      setLoading(null);
    }
  }

  async function openPortal() {
    setLoading("portal");
    setMessage("");
    try {
      const response = await fetch("/api/billing/portal", { method: "POST" });
      const payload = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !payload.url) {
        setMessage(payload.error || "Portale clienti Stripe disponibile solo per clienti paganti attivi.");
        setLoading(null);
        return;
      }
      window.location.href = payload.url;
    } catch {
      setMessage("Errore di connessione al portale Stripe.");
      setLoading(null);
    }
  }

  return (
    <div className="grid gap-6">
      
      {/* Current Active Plan Card */}
      <div className="glass rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-md border-l-4 border-[var(--accent)]">
        <div>
          <span className="text-[10px] font-extrabold text-[var(--muted)] uppercase tracking-wider block">Stato Sottoscrizione</span>
          <div className="flex items-center gap-2 mt-1">
            <h2 className="text-2xl font-black capitalize text-[var(--foreground)]">{currentPlan}</h2>
            <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <ShieldCheck size={12} />
              Attivo
            </span>
          </div>
          <p className="text-xs text-[var(--muted)] mt-1.5">
            Gestisci i tuoi dati di fatturazione, scarica le fatture precedenti o annulla l&apos;abbonamento tramite Stripe.
          </p>
        </div>

        <button 
          onClick={openPortal} 
          disabled={Boolean(loading)} 
          className="btn-secondary text-xs font-bold py-2 px-5 shrink-0 self-start md:self-center"
        >
          {loading === "portal" ? "Caricamento portale..." : "Gestisci fatturazione Stripe"}
        </button>
      </div>

      {/* Developer Sandbox Controls */}
      <div className="rounded-xl border border-amber-300/30 bg-amber-500/5 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex gap-2 text-amber-800 dark:text-amber-300">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Simulatore Sandbox PCTO</p>
            <p className="text-[11px] opacity-80 mt-0.5">Sei in modalità demo. Puoi abilitare o disabilitare il pagamento reale con Stripe.</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setUseSandbox(!useSandbox)}
          className={`btn-secondary min-h-9 px-4 text-xs font-bold shrink-0 ${
            useSandbox ? "border-amber-500 text-amber-700 bg-amber-500/10" : ""
          }`}
        >
          {useSandbox ? "✓ Simulatore Attivo (Consigliato)" : "Usa Stripe Reale"}
        </button>
      </div>

      {/* Pricing Cards Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        {plans.map((plan) => {
          const isActive = currentPlan === plan.id;
          return (
            <article
              key={plan.id}
              className={`glass rounded-2xl p-6 flex flex-col justify-between transition-all ${
                plan.highlight ? "ring-2 ring-[var(--accent)] bg-[color-mix(in_srgb,var(--panel)_95%,transparent)]" : ""
              } ${isActive ? "opacity-95" : ""}`}
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-xl font-black text-[var(--foreground)]">{plan.name}</h3>
                  {plan.highlight && (
                    <span className="rounded-full bg-[var(--accent)] px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-white">
                      Consigliato
                    </span>
                  )}
                  {isActive && (
                    <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                      Attivo
                    </span>
                  )}
                </div>
                
                <p className="text-xs text-[var(--muted)] mt-1.5">{plan.subtitle}</p>
                
                <div className="mt-5 flex items-baseline gap-1 text-[var(--foreground)]">
                  <span className="text-4xl font-black">€{plan.price}</span>
                  <span className="text-xs font-bold text-[var(--muted)]">/mese</span>
                </div>

                <ul className="mt-6 space-y-3 text-xs text-[var(--muted)] border-t border-[var(--line)] pt-5">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5 leading-normal">
                      <Check size={14} className="mt-0.5 shrink-0 text-[var(--accent)]" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                type="button"
                disabled={Boolean(loading) || isActive}
                onClick={() => checkout(plan.id)}
                className={`mt-8 w-full font-bold ${
                  isActive
                    ? "btn-secondary border-emerald-500/20 text-emerald-600 dark:text-emerald-400 cursor-default bg-emerald-500/5 hover:bg-emerald-500/5 hover:border-emerald-500/20"
                    : plan.highlight
                      ? "btn-primary shadow-md"
                      : "btn-secondary"
                }`}
              >
                {loading === plan.id ? (
                  <span className="inline-block animate-pulse">
                    {useSandbox ? "Attivazione..." : "Reindirizzamento..."}
                  </span>
                ) : isActive ? (
                  "Piano Attivo"
                ) : (
                  `Scegli piano ${plan.name}`
                )}
              </button>
            </article>
          );
        })}
      </div>

      {message && (
        <div className="rounded-xl border border-red-200 bg-red-500/10 px-4 py-3 text-xs text-red-600 leading-normal font-medium">
          ⚠️ {message}
        </div>
      )}
      
    </div>
  );
}
