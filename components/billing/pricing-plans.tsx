"use client";

import { BillingAlert } from "@/components/billing/billing-alerts";
import { UsageMeter } from "@/components/billing/usage-meter";
import { openStripeBillingPortal } from "@/lib/billing/open-portal";
import { planCatalog, type PlanName } from "@/lib/billing/plans";
import { canUseEmbeddedCheckout } from "@/lib/stripe/client";
import { Building2, Check, Crown, Loader2, ShieldCheck, Sparkles, Zap } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

const planIds = ["starter", "growth", "enterprise"] as const;
const planIcons = { starter: Zap, growth: Sparkles, enterprise: Building2 } as const;
const planAccents = {
  starter: { accent: "from-teal-500/20 to-teal-500/5", ring: "group-hover:ring-teal-500/30", highlight: false },
  growth: { accent: "from-violet-500/25 to-[var(--accent-glow)]", ring: "ring-2 ring-[var(--accent)] ring-offset-2 ring-offset-[var(--background)]", highlight: true },
  enterprise: { accent: "from-amber-500/20 to-amber-500/5", ring: "group-hover:ring-amber-500/30", highlight: false }
} as const;

export function PricingPlans({
  currentPlan,
  hasActiveSubscription = false,
  proposalsUsed,
  proposalLimit
}: {
  currentPlan: string;
  hasActiveSubscription?: boolean;
  proposalsUsed?: number;
  proposalLimit?: number | null;
}) {
  const t = useTranslations("pricing");
  const common = useTranslations("common");
  const locale = useLocale();
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const showUsage =
    hasActiveSubscription &&
    proposalLimit != null &&
    proposalLimit > 0 &&
    typeof proposalsUsed === "number";

  const plans = planIds.map((id) => ({
    id,
    name: id.charAt(0).toUpperCase() + id.slice(1),
    price: String(planCatalog[id].monthly),
    subtitle: t(`${id}Subtitle` as "starterSubtitle" | "growthSubtitle" | "enterpriseSubtitle"),
    icon: planIcons[id],
    features: [t(`${id}F1` as never), t(`${id}F2` as never), t(`${id}F3` as never), t(`${id}F4` as never)],
    ...planAccents[id]
  }));

  async function checkout(plan: PlanName) {
    setLoading(plan);
    setMessage("");
    try {
      if (canUseEmbeddedCheckout()) {
        window.location.assign(`/dashboard/checkout?plan=${plan}`);
        return;
      }

      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, locale })
      });
      const payload = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !payload.url) {
        setMessage(payload.error || t("checkoutError"));
        setLoading(null);
        return;
      }
      window.location.assign(payload.url);
    } catch {
      setMessage(t("connectionError"));
      setLoading(null);
    }
  }

  async function openPortal() {
    setLoading("portal");
    setMessage("");
    const result = await openStripeBillingPortal(t("portalUnavailable"));
    if (!result.ok) {
      setMessage(result.error);
      setLoading(null);
    }
  }

  return (
    <div className="grid gap-6">
      <section className="glass-premium rounded-3xl p-6 sm:p-7">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="grid gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[var(--muted)]">
              {t("yourPlan")}
            </span>
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-2xl font-black capitalize text-[var(--foreground)] sm:text-3xl">
                {currentPlan === "none" ? t("noPlan") : currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)}
              </h2>
              {hasActiveSubscription ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                  <ShieldCheck size={12} aria-hidden />
                  {t("active")}
                </span>
              ) : (
                <span className="inline-flex rounded-full bg-amber-500/15 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-amber-800 dark:text-amber-300">
                  {t("toActivate")}
                </span>
              )}
            </div>
            <p className="max-w-lg text-xs font-medium leading-relaxed text-[var(--muted)]">
              {hasActiveSubscription ? t("manageDesc") : t("upgradeDesc")}
            </p>
          </div>

          {hasActiveSubscription ? (
            <button
              type="button"
              onClick={() => void openPortal()}
              disabled={Boolean(loading)}
              className="btn-secondary shrink-0 px-5 text-xs font-bold"
            >
              {loading === "portal" ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 size={14} className="animate-spin" aria-hidden />
                  {t("openingPortal")}
                </span>
              ) : (
                t("manageSub")
              )}
            </button>
          ) : null}
        </div>

        {showUsage ? (
          <div className="mt-6 border-t border-[var(--line)] pt-6">
            <UsageMeter used={proposalsUsed} limit={proposalLimit} />
          </div>
        ) : null}
      </section>

      <div className="text-center px-2">
        <h3 className="text-lg font-black tracking-tight text-[var(--foreground)] sm:text-xl">
          {t("choosePlanTitle")}
        </h3>
        <p className="mt-1.5 text-xs font-medium text-[var(--muted)]">
          {t("pricingNote")}
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-3 md:items-stretch">
        {plans.map((plan) => {
          const isActive = currentPlan === plan.id;
          const Icon = plan.icon;

          return (
            <article
              key={plan.id}
              className={`group relative flex flex-col rounded-3xl border border-[var(--line)] bg-[color-mix(in_srgb,var(--panel)_90%,transparent)] p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-lg)] ${
                plan.highlight ? plan.ring : `hover:ring-1 ${plan.ring}`
              } ${isActive ? "bg-[color-mix(in_srgb,var(--accent-glow)_40%,var(--panel))]" : ""}`}
            >
              {plan.highlight ? (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-gradient-to-r from-[var(--accent)] to-[var(--accent-2)] px-3 py-1 text-[9px] font-black uppercase tracking-wider text-white shadow-md">
                  {t("mostChosen")}
                </span>
              ) : null}

              <div
                className={`mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${plan.accent} text-[var(--accent)]`}
              >
                <Icon size={22} strokeWidth={2.25} aria-hidden />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-xl font-black text-[var(--foreground)]">{plan.name}</h3>
                {isActive ? (
                  <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[9px] font-black uppercase text-emerald-700 dark:text-emerald-400">
                    {t("active")}
                  </span>
                ) : null}
              </div>

              <p className="mt-1 text-xs font-medium text-[var(--muted)]">{plan.subtitle}</p>

              <div className="mt-5 flex items-baseline gap-1">
                <span className="text-4xl font-black tracking-tight text-[var(--foreground)]">€{plan.price}</span>
                <span className="text-xs font-bold text-[var(--muted)]">{common("perMonth")}</span>
              </div>

              <ul className="mt-6 flex-1 space-y-3 border-t border-[var(--line)] pt-5">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5 text-xs font-medium leading-snug text-[var(--muted)]">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-[var(--accent-glow)] text-[var(--accent)]">
                      <Check size={12} strokeWidth={3} aria-hidden />
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                type="button"
                disabled={Boolean(loading) || isActive}
                onClick={() => void checkout(plan.id)}
                className={`mt-8 w-full font-bold ${
                  isActive
                    ? "btn-secondary cursor-default border-emerald-500/25 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400"
                    : plan.highlight
                      ? "btn-primary shadow-lg"
                      : "btn-secondary"
                }`}
              >
                {loading === plan.id ? (
                  <span className="inline-flex items-center justify-center gap-2">
                    <Loader2 size={14} className="animate-spin" aria-hidden />
                    {t("redirecting")}
                  </span>
                ) : isActive ? (
                  t("currentPlan")
                ) : (
                  t("activatePlan", { name: plan.name })
                )}
              </button>
            </article>
          );
        })}
      </div>

      <p className="flex items-center justify-center gap-1.5 text-center text-[10px] font-semibold text-[var(--muted)]">
        <Crown size={12} className="text-[var(--accent-3)]" aria-hidden />
        {t("enterpriseNote")}
      </p>

      {message ? <BillingAlert variant="error">{message}</BillingAlert> : null}
    </div>
  );
}
