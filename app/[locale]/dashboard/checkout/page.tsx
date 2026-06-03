"use client";

import { BillingShell } from "@/components/billing/billing-shell";
import { StripeTrust } from "@/components/billing/stripe-trust";
import { formatPlanPriceLabel, planCheckoutCopy } from "@/lib/billing/stripe-branding";
import { planCatalog, type PlanName } from "@/lib/billing/plans";
import { getStripePublishable } from "@/lib/stripe/client";
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from "@stripe/react-stripe-js";
import { CreditCard, Loader2 } from "lucide-react";
import { Link, useRouter } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Suspense, useCallback, useMemo, useState } from "react";

const validPlans = new Set<PlanName>(["starter", "growth", "enterprise"]);

function CheckoutEmbed() {
  const t = useTranslations("checkout");
  const common = useTranslations("common");
  const router = useRouter();
  const searchParams = useSearchParams();
  const planParam = searchParams.get("plan");
  const plan = validPlans.has(planParam as PlanName) ? (planParam as PlanName) : null;
  const [error, setError] = useState("");

  const stripePromise = useMemo(() => getStripePublishable(), []);
  const copy = plan ? planCheckoutCopy(plan) : null;

  const fetchClientSecret = useCallback(async () => {
    if (!plan) throw new Error(t("invalidPlan"));
    setError("");
    const response = await fetch("/api/billing/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan, embedded: true })
    });
    const payload = (await response.json()) as { clientSecret?: string; error?: string };
    if (!response.ok || !payload.clientSecret) {
      const message = payload.error || t("paymentError");
      setError(message);
      throw new Error(message);
    }
    return payload.clientSecret;
  }, [plan, t]);

  if (!plan || !copy) {
    return (
      <BillingShell
        eyebrow="Checkout"
        title={t("invalidPlanTitle")}
        description={t("invalidPlanDesc")}
        showTrust={false}
      >
        <Link href="/dashboard/subscribe" className="btn-primary w-fit text-sm font-bold">
          {t("viewPlans")}
        </Link>
      </BillingShell>
    );
  }

  if (!stripePromise) {
    return (
      <BillingShell
        eyebrow="Checkout"
        title={t("notConfiguredTitle")}
        description={t("notConfiguredDesc")}
        showTrust={false}
      >
        <Link href="/dashboard/billing" className="btn-secondary w-fit text-sm font-bold">
          {t("backToPlans")}
        </Link>
      </BillingShell>
    );
  }

  return (
    <BillingShell
      eyebrow={t("securePayment")}
      title={`${t("activate")} ${copy.productName}`}
      description={`${t("completePayment")} ${formatPlanPriceLabel(plan)} · ${t("processedByStripe")}`}
      showTrust={false}
    >
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="stripe-checkout-embed glass-premium overflow-hidden rounded-3xl border border-[var(--line)] p-1 sm:p-2">
          {error ? (
            <p className="m-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-700 dark:text-red-300">
              {error}
            </p>
          ) : null}
          <EmbeddedCheckoutProvider stripe={stripePromise} options={{ fetchClientSecret }}>
            <EmbeddedCheckout />
          </EmbeddedCheckoutProvider>
        </div>

        <aside className="grid gap-4 content-start">
          <div className="glass rounded-2xl p-5">
            <div className="flex items-center gap-2 text-[var(--accent)]">
              <CreditCard size={18} aria-hidden />
              <span className="text-xs font-black uppercase tracking-wider">{t("summary")}</span>
            </div>
            <p className="mt-3 text-2xl font-black text-[var(--foreground)]">
              €{planCatalog[plan].monthly}
              <span className="text-sm font-bold text-[var(--muted)]">{common("perMonth")}</span>
            </p>
            <p className="mt-2 text-xs font-medium leading-relaxed text-[var(--muted)]">{copy.description}</p>
            <ul className="mt-4 space-y-2 border-t border-[var(--line)] pt-4 text-[11px] font-semibold text-[var(--muted)]">
              <li>· {planCatalog[plan].proposalLimit} {t("includedGenerations")}</li>
              <li>· {t("upTo")} {planCatalog[plan].memberLimit} {t("teamMembers")}</li>
              <li>· {t("cancelAnytime")}</li>
            </ul>
          </div>
          <button
            type="button"
            onClick={() => router.push("/dashboard/billing?checkout=cancel")}
            className="btn-secondary w-full text-xs font-bold"
          >
            {t("cancelAndBack")}
          </button>
          <StripeTrust />
        </aside>
      </div>
    </BillingShell>
  );
}

export default function CheckoutPage() {
  const t = useTranslations("checkout");
  return (
    <Suspense
      fallback={
        <div className="mx-auto flex max-w-6xl items-center justify-center gap-2 py-24 text-sm font-medium text-[var(--muted)]">
          <Loader2 size={18} className="animate-spin text-[var(--accent)]" aria-hidden />
          {t("preparing")}
        </div>
      }
    >
      <CheckoutEmbed />
    </Suspense>
  );
}
