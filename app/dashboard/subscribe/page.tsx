"use client";

import { BillingShell } from "@/components/billing/billing-shell";
import { PricingPlans } from "@/components/billing/pricing-plans";
import { SiteFooter } from "@/components/site-footer";
import { LockKeyhole, Wand2 } from "lucide-react";

export default function SubscribePage() {
  return (
    <>
      <BillingShell
        heroTone="subscribe"
        eyebrow="Accesso alle funzionalità"
        title="Attiva il tuo abbonamento"
        description="Per generare preventivi con l'AI, inviare link ai clienti e usare l'estrazione brand serve un piano attivo. Scegli quello più adatto al tuo volume di lavoro."
        alerts={
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="glass flex gap-3 rounded-2xl p-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-glow)] text-[var(--accent)]">
                <Wand2 size={18} aria-hidden />
              </span>
              <div>
                <p className="text-xs font-black text-[var(--foreground)]">Generatore AI</p>
                <p className="mt-0.5 text-[11px] font-medium leading-relaxed text-[var(--muted)]">
                  Proposte brandizzate, budget stimato e palette dal sito del cliente.
                </p>
              </div>
            </div>
            <div className="glass flex gap-3 rounded-2xl p-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/15 text-violet-600 dark:text-violet-400">
                <LockKeyhole size={18} aria-hidden />
              </span>
              <div>
                <p className="text-xs font-black text-[var(--foreground)]">Pagamento sicuro</p>
                <p className="mt-0.5 text-[11px] font-medium leading-relaxed text-[var(--muted)]">
                  Checkout Stripe: carte, SEPA e fatture dal portale cliente.
                </p>
              </div>
            </div>
          </div>
        }
      >
        <PricingPlans currentPlan="none" hasActiveSubscription={false} />
      </BillingShell>
      <div className="mx-auto max-w-6xl">
        <SiteFooter />
      </div>
    </>
  );
}
