import { Link } from "@/i18n/navigation";
import { SiteFooter } from "@/components/site-footer";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { planCatalog } from "@/lib/billing/plans";
import { ArrowRight, Sparkles, Shield, Zap, Palette, FileCheck } from "lucide-react";
import { getTranslations } from "next-intl/server";

function PlanFeatures({ raw }: { raw: string }) {
  const items = raw.split("|");
  return (
    <ul className="mt-6 space-y-2 text-sm text-[var(--muted)]">
      {items.map((item) => (
        <li key={item}>• {item}</li>
      ))}
    </ul>
  );
}

export default async function LandingPage() {
  const t = await getTranslations("landing");
  const nav = await getTranslations("nav");
  const common = await getTranslations("common");

  return (
    <main className="min-h-screen text-[var(--foreground)] selection:bg-[var(--accent)] selection:text-white">
      <header className="glass sticky top-0 z-50 border-b border-[var(--line)] bg-[color-mix(in_srgb,var(--background)_80%,transparent)] px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--accent)] to-[var(--accent-2)] text-white shadow-md">
              <Sparkles size={16} />
            </span>
            <span className="text-base font-black tracking-tight sm:text-lg">
              QuoteGen{" "}
              <span className="bg-gradient-to-r from-[var(--accent)] to-[var(--accent-2)] bg-clip-text text-transparent">
                Engine
              </span>
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <LocaleSwitcher compact />
            <Link href="/login" className="btn-secondary min-h-9 px-4 py-1.5 text-xs font-bold">
              {nav("workspaceLogin")}
            </Link>
          </div>
        </div>
      </header>

      <section className="relative px-4 py-14 sm:px-6 sm:py-20 lg:py-32">
        <div className="mx-auto flex max-w-6xl flex-col items-center text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--panel)] px-4 py-1.5 text-xs font-bold text-[var(--accent)] shadow-sm">
            <Sparkles size={13} />
            <span>{t("badge")}</span>
          </div>

          <h1 className="max-w-4xl text-4xl font-black leading-[1.1] tracking-tight sm:text-6xl lg:text-7xl">
            {t("heroTitle")}{" "}
            <span className="bg-gradient-to-r from-[var(--accent)] to-[var(--accent-2)] bg-clip-text text-transparent">
              {t("heroHighlight")}
            </span>
          </h1>

          <p className="mt-6 max-w-2xl text-lg text-[var(--muted)] sm:text-xl">{t("heroSubtitle")}</p>

          <div className="mt-10 flex w-full max-w-md flex-col justify-center gap-3 sm:max-w-none sm:w-auto sm:flex-row sm:gap-4">
            <Link href="/login" className="btn-primary flex w-full items-center justify-center gap-2 px-8 py-3.5 text-sm font-extrabold shadow-lg sm:w-auto">
              {t("ctaPrimary")}
              <ArrowRight size={16} />
            </Link>
            <a href="#piani" className="btn-secondary w-full px-8 py-3.5 text-sm font-bold sm:w-auto">
              {t("ctaSecondary")}
            </a>
          </div>

          <div className="glass-premium mt-16 w-full max-w-4xl rounded-2xl p-2 shadow-2xl">
            <div className="rounded-xl border border-[var(--line)] bg-[var(--background)] p-4 sm:p-6 text-left">
              <div className="flex items-center justify-between border-b border-[var(--line)] pb-4">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-red-400" />
                  <span className="h-3 w-3 rounded-full bg-yellow-400" />
                  <span className="h-3 w-3 rounded-full bg-green-400" />
                  <span className="ml-2 max-w-[160px] truncate text-xs font-mono text-[var(--muted)] sm:max-w-none">
                    workspace/prop_0912f.pdf
                  </span>
                </div>
                <span className="rounded-lg bg-[var(--accent-glow)] px-2.5 py-1 text-xs font-bold text-[var(--accent)]">
                  {t("mockAnalysisDone")}
                </span>
              </div>

              <div className="mt-4 grid gap-6 md:grid-cols-2">
                <div className="grid gap-3">
                  <div className="rounded-xl border border-[var(--line)] bg-[var(--panel)] p-4">
                    <p className="text-xs font-bold uppercase text-[var(--muted)]">{t("mockClient")}</p>
                    <p className="mt-1 text-lg font-black">KFC Corporation</p>
                    <p className="text-xs text-[var(--muted)]">https://www.kfc.it</p>
                  </div>

                  <div className="rounded-xl border border-[var(--line)] bg-[var(--panel)] p-4">
                    <p className="text-xs font-bold uppercase text-[var(--muted)]">{t("mockBudgetLabel")}</p>
                    <p className="mt-1 text-2xl font-black text-[var(--accent)]">€ 14.500</p>
                    <p className="text-xs text-[var(--muted)]">{t("mockBudgetRationale")}</p>
                  </div>
                </div>

                <div className="rounded-xl border border-[var(--line)] bg-[var(--panel)] p-4 flex flex-col justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase text-[var(--muted)]">{t("mockPalette")}</p>
                    <div className="mt-3 flex gap-2">
                      <span className="h-9 w-9 rounded-lg border border-[var(--line)]" style={{ background: "#E4002B" }} />
                      <span className="h-9 w-9 rounded-lg border border-[var(--line)]" style={{ background: "#111111" }} />
                      <span className="h-9 w-9 rounded-lg border border-[var(--line)]" style={{ background: "#F5F5F5" }} />
                    </div>
                  </div>
                  <div className="mt-4 border-t border-[var(--line)] pt-3 text-xs text-[var(--muted)] flex items-center gap-1.5">
                    <Shield size={14} className="text-emerald-500" />
                    {t("mockSecurity")}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[var(--panel)] px-6 py-20 border-y border-[var(--line)]">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <h2 className="text-3xl font-black tracking-tight sm:text-4xl">{t("featuresTitle")}</h2>
            <p className="mt-3 text-[var(--muted)]">{t("featuresSubtitle")}</p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="glass rounded-2xl p-6">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-glow)] text-[var(--accent)] mb-4">
                <Palette size={20} />
              </span>
              <h3 className="text-lg font-bold">{t("featureBrandTitle")}</h3>
              <p className="mt-2 text-sm text-[var(--muted)]">{t("featureBrandDesc")}</p>
            </div>

            <div className="glass rounded-2xl p-6">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-glow)] text-[var(--accent)] mb-4">
                <Zap size={20} />
              </span>
              <h3 className="text-lg font-bold">{t("featureBudgetTitle")}</h3>
              <p className="mt-2 text-sm text-[var(--muted)]">{t("featureBudgetDesc")}</p>
            </div>

            <div className="glass rounded-2xl p-6">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-glow)] text-[var(--accent)] mb-4">
                <FileCheck size={20} />
              </span>
              <h3 className="text-lg font-bold">{t("featureSignTitle")}</h3>
              <p className="mt-2 text-sm text-[var(--muted)]">{t("featureSignDesc")}</p>
            </div>
          </div>
        </div>
      </section>

      <section id="piani" className="px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <span className="text-sm font-bold uppercase tracking-wider text-[var(--accent)]">{t("pricingEyebrow")}</span>
            <h2 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">{t("pricingTitle")}</h2>
            <p className="mt-2 text-[var(--muted)]">{t("pricingSubtitle")}</p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <article className="glass rounded-2xl p-6 flex flex-col justify-between">
              <div>
                <h3 className="text-xl font-black">Starter</h3>
                <p className="mt-1 text-xs text-[var(--muted)]">{t("planStarterDesc")}</p>
                <p className="mt-4 text-3xl font-black">
                  €{planCatalog.starter.monthly}
                  <span className="text-xs font-bold text-[var(--muted)]">{common("perMonth")}</span>
                </p>
                <PlanFeatures raw={t("planStarterFeatures")} />
              </div>
              <Link href="/login" className="btn-secondary mt-8 w-full font-bold">
                {t("planCtaStart")}
              </Link>
            </article>

            <article className="glass rounded-2xl p-6 border-2 border-[var(--accent)] flex flex-col justify-between relative">
              <span className="absolute -top-3 right-6 rounded-full bg-[var(--accent)] px-3 py-1 text-xs font-bold text-white shadow-sm">
                {t("planRecommended")}
              </span>
              <div>
                <h3 className="text-xl font-black">Growth</h3>
                <p className="mt-1 text-xs text-[var(--muted)]">{t("planGrowthDesc")}</p>
                <p className="mt-4 text-3xl font-black">
                  €{planCatalog.growth.monthly}
                  <span className="text-xs font-bold text-[var(--muted)]">{common("perMonth")}</span>
                </p>
                <PlanFeatures raw={t("planGrowthFeatures")} />
              </div>
              <Link href="/login" className="btn-primary mt-8 w-full font-bold">
                {t("planCtaGrowth")}
              </Link>
            </article>

            <article className="glass rounded-2xl p-6 flex flex-col justify-between">
              <div>
                <h3 className="text-xl font-black">Enterprise</h3>
                <p className="mt-1 text-xs text-[var(--muted)]">{t("planEnterpriseDesc")}</p>
                <p className="mt-4 text-3xl font-black">
                  €{planCatalog.enterprise.monthly}
                  <span className="text-xs font-bold text-[var(--muted)]">{common("perMonth")}</span>
                </p>
                <PlanFeatures raw={t("planEnterpriseFeatures")} />
              </div>
              <Link href="/login" className="btn-secondary mt-8 w-full font-bold">
                {t("planCtaExpert")}
              </Link>
            </article>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-6 pb-8">
        <SiteFooter />
      </div>
    </main>
  );
}
