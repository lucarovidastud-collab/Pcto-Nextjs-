"use client";

import { useTranslations } from "next-intl";

type GenerationProgressProps = {
  percent: number;
  label: string;
  active: boolean;
};

export function GenerationProgress({ percent, label, active }: GenerationProgressProps) {
  const t = useTranslations("generationProgress");

  if (!active) return null;

  const safePercent = Math.min(100, Math.max(0, Math.round(percent)));

  return (
    <div
      className="rounded-2xl border border-[var(--accent)]/25 bg-[var(--accent-glow)] p-4 sm:p-5"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex items-center justify-between gap-3 mb-3">
        <p className="text-sm font-bold text-[var(--foreground)]">{t("title")}</p>
        <span className="text-lg font-black tabular-nums text-[var(--accent)]">{safePercent}%</span>
      </div>
      <div
        className="h-2.5 w-full overflow-hidden rounded-full bg-[var(--line)]"
        role="progressbar"
        aria-valuenow={safePercent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={t("ariaLabel")}
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-[var(--accent)] to-[var(--accent-2)] transition-all duration-500 ease-out"
          style={{ width: `${safePercent}%` }}
        />
      </div>
      <p className="mt-3 text-xs font-medium text-[var(--muted)]">{label}</p>
    </div>
  );
}
