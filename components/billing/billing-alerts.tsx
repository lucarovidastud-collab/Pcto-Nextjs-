import { AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import type { ReactNode } from "react";

type AlertVariant = "success" | "warning" | "error" | "info";

const styles: Record<AlertVariant, { wrap: string; icon: string }> = {
  success: {
    wrap: "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300",
    icon: "text-emerald-600 dark:text-emerald-400"
  },
  warning: {
    wrap: "border-amber-500/35 bg-amber-500/10 text-amber-900 dark:text-amber-200",
    icon: "text-amber-600 dark:text-amber-400"
  },
  error: {
    wrap: "border-red-500/30 bg-red-500/10 text-red-800 dark:text-red-300",
    icon: "text-red-600 dark:text-red-400"
  },
  info: {
    wrap: "border-[var(--line)] bg-[var(--panel-strong)] text-[var(--muted)]",
    icon: "text-[var(--accent)]"
  }
};

const icons = {
  success: CheckCircle2,
  warning: AlertCircle,
  error: XCircle,
  info: AlertCircle
} as const;

export function BillingAlert({
  variant,
  title,
  children
}: {
  variant: AlertVariant;
  title?: string;
  children: ReactNode;
}) {
  const Icon = icons[variant];
  const s = styles[variant];
  return (
    <div className={`flex gap-3 rounded-2xl border px-4 py-3.5 ${s.wrap}`}>
      <Icon size={20} className={`mt-0.5 shrink-0 ${s.icon}`} aria-hidden />
      <div className="min-w-0 text-sm leading-relaxed">
        {title ? <p className="font-bold mb-0.5">{title}</p> : null}
        <div className={title ? "font-medium opacity-90" : "font-semibold"}>{children}</div>
      </div>
    </div>
  );
}
