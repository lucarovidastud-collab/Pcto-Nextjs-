"use client";

import { BillingAlert } from "@/components/billing/billing-alerts";
import { BillingShell } from "@/components/billing/billing-shell";
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
  const [planName, setPlanName] = useState("none");
  const [proposalsUsed, setProposalsUsed] = useState(0);
  const [proposalLimit, setProposalLimit] = useState<number | null>(null);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [diagnostics, setDiagnostics] = useState<BillingDiagnostics | null>(null);
  const checkoutStatus = searchParams.get("checkout");
  const limitReached = searchParams.get("limit") === "reached";

  useEffect(() => {
    void (async () => {
      const [checkoutRes, statusRes] = await Promise.all([
        fetch("/api/billing/checkout"),
        fetch("/api/billing/status")
      ]);
      if (checkoutRes.ok) {
        const payload = (await checkoutRes.json()) as {
          current: { plan: string };
          limits: { proposalLimit: number } | null;
          usage: { proposalsThisMonth: number };
          hasActiveSubscription: boolean;
        };
        setPlanName(payload.current.plan);
        setProposalsUsed(payload.usage.proposalsThisMonth);
        setProposalLimit(payload.limits?.proposalLimit ?? null);
        setHasActiveSubscription(payload.hasActiveSubscription);
      }
      if (statusRes.ok) {
        setDiagnostics((await statusRes.json()) as BillingDiagnostics);
      }
    })();
  }, []);

  const alerts = (
    <>
      {checkoutStatus === "success" ? (
        <BillingAlert variant="success" title="Pagamento completato">
          Il piano si aggiornerà automaticamente entro pochi secondi. Puoi tornare alla dashboard e iniziare a
          generare.
        </BillingAlert>
      ) : null}
      {checkoutStatus === "cancel" ? (
        <BillingAlert variant="warning" title="Checkout annullato">
          Nessun addebito effettuato. Puoi scegliere un piano quando vuoi.
        </BillingAlert>
      ) : null}
      {limitReached ? (
        <BillingAlert variant="warning" title="Limite mensile raggiunto">
          Hai usato tutte le generazioni incluse nel piano
          {proposalLimit !== null ? ` (${proposalsUsed}/${proposalLimit})` : ""}. Passa a Growth o Enterprise per
          continuare.
        </BillingAlert>
      ) : null}
    </>
  );

  return (
    <BillingShell
      eyebrow="Abbonamento"
      title="Piani e pagamenti"
      description="Gestisci il tuo abbonamento, confronta i piani e aggiorna la fatturazione in pochi clic. I pagamenti sono elaborati in modo sicuro da Stripe."
      alerts={alerts}
    >
      <PricingPlans
        currentPlan={planName}
        hasActiveSubscription={hasActiveSubscription}
        proposalsUsed={proposalsUsed}
        proposalLimit={proposalLimit}
      />

      {diagnostics?.configured === false ? (
        <BillingAlert variant="info" title="Stripe in configurazione">
          {diagnostics.message || "I pagamenti non sono ancora disponibili su questo ambiente."}
        </BillingAlert>
      ) : null}
    </BillingShell>
  );
}

export default function BillingPage() {
  return (
    <>
      <Suspense
        fallback={
          <div className="mx-auto max-w-6xl px-2 py-12">
            <p className="animate-pulse text-center text-sm font-medium text-[var(--muted)]">
              Caricamento piani...
            </p>
          </div>
        }
      >
        <BillingContent />
      </Suspense>
      <div className="mx-auto max-w-6xl">
        <SiteFooter />
      </div>
    </>
  );
}
