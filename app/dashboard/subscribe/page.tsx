"use client";

import { PricingPlans } from "@/components/billing/pricing-plans";
import { SiteFooter } from "@/components/site-footer";
import { ShieldAlert } from "lucide-react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function SubscribePage() {
  return (
    <div className="flex flex-col gap-5 pb-8 max-w-6xl mx-auto">
      
      <div className="flex items-center">
        <Link 
          href="/dashboard"
          className="text-xs font-bold text-[var(--muted)] hover:text-[var(--foreground)] flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft size={14} />
          Torna alla Dashboard
        </Link>
      </div>

      <header className="glass rounded-2xl p-6 sm:p-8 border-l-4 border-amber-500 bg-amber-500/5">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400">
            <ShieldAlert size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black sm:text-3xl tracking-tight text-[var(--foreground)]">Abbonamento Richiesto</h1>
            <p className="mt-1.5 max-w-2xl text-sm text-[var(--muted)] font-medium leading-relaxed">
              Per utilizzare il generatore AI di preventivi e creare proposte brandizzate per i tuoi clienti, 
              hai bisogno di attivare un abbonamento. Scegli il piano più adatto alle tue esigenze per sbloccare tutte le funzionalità.
            </p>
          </div>
        </div>
      </header>

      <PricingPlans currentPlan="none" hasActiveSubscription={false} />
      <SiteFooter />
    </div>
  );
}
