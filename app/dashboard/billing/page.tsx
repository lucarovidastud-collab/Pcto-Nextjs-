"use client";

import { PricingPlans } from "@/components/billing/pricing-plans";
import { SiteFooter } from "@/components/site-footer";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

type BillingDiagnostics = {
  configured?: boolean;
  mode?: string;
  chargesEnabled?: boolean;
  portalConfigured?: boolean;
  message?: string;
};

function BillingContent() {
  const searchParams = useSearchParams();
  const [planName, setPlanName] = useState("starter");
  const [diagnostics, setDiagnostics] = useState<BillingDiagnostics | null>(null);
  const checkoutStatus = searchParams.get("checkout");

  useEffect(() => {
    void (async () => {
      const [checkoutRes, statusRes] = await Promise.all([
        fetch("/api/billing/checkout"),
        fetch("/api/billing/status")
      ]);
      if (checkoutRes.ok) {
        const payload = (await checkoutRes.json()) as { current: { plan: string } };
        setPlanName(payload.current.plan);
      }
      if (statusRes.ok) {
        setDiagnostics((await statusRes.json()) as BillingDiagnostics);
      }
    })();
  }, []);

  return (
    <div className="flex flex-col gap-5 pb-8">
      <header className="glass rounded-2xl p-5">
        <p className="text-sm font-semibold text-[var(--muted)]">Stripe Billing</p>
        <h1 className="text-2xl font-black sm:text-3xl">Piani e pagamenti</h1>
        <p className="mt-1 max-w-2xl text-sm text-[var(--muted)]">
          Qui puoi passare a un altro piano. Per fatture e metodo di pagamento usa il portale Stripe dal workspace principale.
        </p>
        {checkoutStatus === "success" ? (
          <p className="mt-4 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
            Pagamento completato. Il piano verrà aggiornato entro pochi secondi.
          </p>
        ) : null}
        {checkoutStatus === "cancel" ? (
          <p className="mt-4 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Checkout annullato. Puoi riprovare quando vuoi.
          </p>
        ) : null}
        {diagnostics ? (
          <p className="mt-4 rounded-xl border border-[var(--line)] bg-[var(--panel-strong)] px-4 py-3 text-xs text-[var(--muted)]">
            Stripe {diagnostics.mode || "n/d"}
            {diagnostics.chargesEnabled === false ? " · pagamenti non ancora abilitati" : ""}
            {diagnostics.portalConfigured === false ? " · portale in creazione al primo accesso" : " · portale OK"}
            {diagnostics.message ? ` · ${diagnostics.message}` : ""}
          </p>
        ) : null}
      </header>

      <PricingPlans currentPlan={planName} />
      <SiteFooter />
    </div>
  );
}

export default function BillingPage() {
  return (
    <Suspense fallback={<p className="p-6 text-sm text-[var(--muted)]">Caricamento billing...</p>}>
      <BillingContent />
    </Suspense>
  );
}
