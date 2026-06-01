import { CreditCard, Lock, RefreshCw } from "lucide-react";

const items = [
  { icon: Lock, label: "Pagamenti crittografati" },
  { icon: CreditCard, label: "Carte e SEPA via Stripe" },
  { icon: RefreshCw, label: "Disdici quando vuoi" }
] as const;

export function StripeTrust() {
  return (
    <div
      className="rounded-2xl border border-[var(--line)] bg-[color-mix(in_srgb,var(--panel-strong)_60%,transparent)] px-4 py-4"
      role="contentinfo"
    >
      <ul className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center sm:gap-x-6 sm:gap-y-2">
        {items.map(({ icon: Icon, label }) => (
          <li key={label} className="flex items-center gap-2 text-[11px] font-semibold text-[var(--muted)]">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--accent-glow)] text-[var(--accent)]">
              <Icon size={14} aria-hidden />
            </span>
            {label}
          </li>
        ))}
      </ul>
    </div>
  );
}
