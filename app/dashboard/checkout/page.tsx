"use client";

import { BillingShell } from "@/components/billing/billing-shell";
import { StripeTrust } from "@/components/billing/stripe-trust";
import { formatPlanPriceLabel, planCheckoutCopy } from "@/lib/billing/stripe-branding";
import { planCatalog, type PlanName } from "@/lib/billing/plans";
import { getStripePublishable } from "@/lib/stripe/client";
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from "@stripe/react-stripe-js";
import { CreditCard, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useMemo, useState } from "react";

const validPlans = new Set<PlanName>(["starter", "growth", "enterprise"]);

function CheckoutEmbed() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planParam = searchParams.get("plan");
  const plan = validPlans.has(planParam as PlanName) ? (planParam as PlanName) : null;
  const [error, setError] = useState("");

  const stripePromise = useMemo(() => getStripePublishable(), []);
  const copy = plan ? planCheckoutCopy(plan) : null;

  const fetchClientSecret = useCallback(async () => {
    if (!plan) throw new Error("Piano non valido");
    setError("");
    const response = await fetch("/api/billing/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan, embedded: true })
    });
    const payload = (await response.json()) as { clientSecret?: string; error?: string };
    if (!response.ok || !payload.clientSecret) {
      const message = payload.error || "Impossibile avviare il pagamento.";
      setError(message);
      throw new Error(message);
    }
    return payload.clientSecret;
  }, [plan]);

  if (!plan || !copy) {
    return (
      <BillingShell
        eyebrow="Checkout"
        title="Piano non valido"
        description="Scegli un piano dalla pagina abbonamento per continuare."
        showTrust={false}
      >
        <Link href="/dashboard/subscribe" className="btn-primary w-fit text-sm font-bold">
          Vedi i piani
        </Link>
      </BillingShell>
    );
  }

  if (!stripePromise) {
    return (
      <BillingShell
        eyebrow="Checkout"
        title="Pagamento non configurato"
        description="Manca la chiave pubblica Stripe. Contatta l'amministratore o riprova più tardi."
        showTrust={false}
      >
        <Link href="/dashboard/billing" className="btn-secondary w-fit text-sm font-bold">
          Torna ai piani
        </Link>
      </BillingShell>
    );
  }

  return (
    <BillingShell
      eyebrow="Pagamento sicuro"
      title={`Attiva ${copy.productName}`}
      description={`Completa il pagamento qui sotto. ${formatPlanPriceLabel(plan)} · elaborato da Stripe.`}
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
              <span className="text-xs font-black uppercase tracking-wider">Riepilogo</span>
            </div>
            <p className="mt-3 text-2xl font-black text-[var(--foreground)]">
              €{planCatalog[plan].monthly}
              <span className="text-sm font-bold text-[var(--muted)]">/mese</span>
            </p>
            <p className="mt-2 text-xs font-medium leading-relaxed text-[var(--muted)]">{copy.description}</p>
            <ul className="mt-4 space-y-2 border-t border-[var(--line)] pt-4 text-[11px] font-semibold text-[var(--muted)]">
              <li>· {planCatalog[plan].proposalLimit} generazioni incluse</li>
              <li>· Fino a {planCatalog[plan].memberLimit} membri team</li>
              <li>· Disdetta dal portale cliente</li>
            </ul>
          </div>
          <button
            type="button"
            onClick={() => router.push("/dashboard/billing?checkout=cancel")}
            className="btn-secondary w-full text-xs font-bold"
          >
            Annulla e torna ai piani
          </button>
          <StripeTrust />
        </aside>
      </div>
    </BillingShell>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto flex max-w-6xl items-center justify-center gap-2 py-24 text-sm font-medium text-[var(--muted)]">
          <Loader2 size={18} className="animate-spin text-[var(--accent)]" aria-hidden />
          Preparazione checkout...
        </div>
      }
    >
      <CheckoutEmbed />
    </Suspense>
  );
}
