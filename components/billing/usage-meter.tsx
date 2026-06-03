"use client";

import { useTranslations } from "next-intl";

type UsageMeterProps = {
  used: number;
  limit: number;
  label?: string;
  compact?: boolean;
};

export function UsageMeter({ used, limit, label, compact = false }: UsageMeterProps) {
  const t = useTranslations("usageMeter");
  const resolvedLabel = label ?? t("defaultLabel");
  const ratio = limit > 0 ? Math.min(used / limit, 1) : 0;
  const percent = Math.round(ratio * 100);
  const nearLimit = ratio >= 0.85;
  const atLimit = used >= limit;

  return (
    <div className={compact ? "grid gap-2" : "grid gap-3"}>
      <div className="flex items-end justify-between gap-3">
        <span className={`font-bold text-[var(--muted)] ${compact ? "text-[10px] uppercase tracking-wider" : "text-xs"}`}>
          {resolvedLabel}
        </span>
        <span className={`font-black tabular-nums text-[var(--foreground)] ${compact ? "text-xs" : "text-sm"}`}>
          {used}
          <span className="font-bold text-[var(--muted)]"> / {limit}</span>
        </span>
      </div>
      <div
        className={`overflow-hidden rounded-full bg-[var(--line)] ${compact ? "h-1.5" : "h-2.5"}`}
        role="progressbar"
        aria-valuenow={used}
        aria-valuemin={0}
        aria-valuemax={limit}
        aria-label={`${resolvedLabel}: ${used} ${t("ariaOf")} ${limit}`}
      >
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            atLimit
              ? "bg-gradient-to-r from-amber-500 to-red-500"
              : nearLimit
                ? "bg-gradient-to-r from-amber-400 to-amber-600"
                : "bg-gradient-to-r from-[var(--accent)] to-[var(--accent-2)]"
          }`}
          style={{ width: `${percent}%` }}
        />
      </div>
      {!compact && atLimit ? (
        <p className="text-[11px] font-semibold text-amber-700 dark:text-amber-400">
          {t("limitReached")}
        </p>
      ) : null}
    </div>
  );
}
