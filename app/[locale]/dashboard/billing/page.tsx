"use client";

import { BillingAlert } from "@/components/billing/billing-alerts";
import { BillingShell } from "@/components/billing/billing-shell";
import { PricingPlans } from "@/components/billing/pricing-plans";
import { SiteFooter } from "@/components/site-footer";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Suspense, useEffect, useState } from "react";

type BillingDiagnostics = {
  configured?: boolean;
  mode?: string;
  chargesEnabled?: boolean;
  portalConfigured?: boolean;
  message?: string;
};

function BillingContent() {
  const t = useTranslations("billing");
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
        <BillingAlert variant="success" title={t("paymentSuccessTitle")}>
          {t("paymentSuccessDesc")}
        </BillingAlert>
      ) : null}
      {checkoutStatus === "cancel" ? (
        <BillingAlert variant="warning" title={t("cancelTitle")}>
          {t("cancelDesc")}
        </BillingAlert>
      ) : null}
      {limitReached ? (
        <BillingAlert variant="warning" title={t("limitTitle")}>
          {t("limitDesc")}
          {proposalLimit !== null ? ` (${proposalsUsed}/${proposalLimit})` : ""}
        </BillingAlert>
      ) : null}
    </>
  );

  return (
    <BillingShell
      eyebrow={t("eyebrow")}
      title={t("title")}
      description={t("description")}
      backLabel={t("backLabel")}
      alerts={alerts}
    >
      <PricingPlans
        currentPlan={planName}
        hasActiveSubscription={hasActiveSubscription}
        proposalsUsed={proposalsUsed}
        proposalLimit={proposalLimit}
      />

      {diagnostics?.configured === false ? (
        <BillingAlert variant="info" title={t("stripeConfigTitle")}>
          {diagnostics.message || t("stripeConfigDefault")}
        </BillingAlert>
      ) : null}
    </BillingShell>
  );
}

export default function BillingPage() {
  const t = useTranslations("billing");
  return (
    <>
      <Suspense
        fallback={
          <div className="mx-auto max-w-6xl px-2 py-12">
            <p className="animate-pulse text-center text-sm font-medium text-[var(--muted)]">
              {t("loading")}
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
