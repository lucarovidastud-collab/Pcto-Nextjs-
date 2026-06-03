import { BrandMark } from "@/components/billing/brand-mark";
import { StripeTrust } from "@/components/billing/stripe-trust";
import { ArrowLeft } from "lucide-react";
import { Link } from "@/i18n/navigation";
import type { ReactNode } from "react";

type BillingShellProps = {
  backHref?: string;
  backLabel?: string;
  eyebrow: string;
  title: string;
  description: string;
  heroTone?: "default" | "subscribe";
  alerts?: ReactNode;
  children: ReactNode;
  showTrust?: boolean;
};

export function BillingShell({
  backHref = "/dashboard",
  backLabel = "Torna alla dashboard",
  eyebrow,
  title,
  description,
  heroTone = "default",
  alerts,
  children,
  showTrust = true
}: BillingShellProps) {
  const subscribe = heroTone === "subscribe";

  return (
    <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-6 pb-10">
      <div
        className="pointer-events-none absolute -top-20 right-0 h-64 w-64 rounded-full bg-[var(--accent-glow)] blur-3xl opacity-60"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute top-40 -left-16 h-48 w-48 rounded-full bg-[var(--accent-2-glow)] blur-3xl opacity-50"
        aria-hidden
      />

      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href={backHref}
          className="inline-flex w-fit items-center gap-1.5 text-xs font-bold text-[var(--muted)] transition-colors hover:text-[var(--foreground)]"
        >
          <ArrowLeft size={14} aria-hidden />
          {backLabel}
        </Link>
        <BrandMark size="sm" />
      </div>

      <header
        className={`glass-premium relative overflow-hidden rounded-3xl p-6 sm:p-8 ${
          subscribe ? "border-l-4 border-l-amber-500" : ""
        }`}
      >
        <div
          className={`pointer-events-none absolute inset-0 opacity-40 ${
            subscribe
              ? "bg-gradient-to-br from-amber-500/10 via-transparent to-[var(--accent-glow)]"
              : "bg-gradient-to-br from-[var(--accent-glow)] via-transparent to-[var(--accent-2-glow)]"
          }`}
          aria-hidden
        />
        <div className="relative grid gap-3">
          <span className="text-[10px] font-extrabold uppercase tracking-[0.25em] text-[var(--accent)]">
            {eyebrow}
          </span>
          <h1 className="text-3xl font-black tracking-tight text-[var(--foreground)] sm:text-4xl">{title}</h1>
          <p className="max-w-2xl text-sm font-medium leading-relaxed text-[var(--muted)]">{description}</p>
        </div>
      </header>

      {alerts ? <div className="relative grid gap-3">{alerts}</div> : null}

      <div className="relative">{children}</div>

      {showTrust ? <StripeTrust /> : null}
    </div>
  );
}
