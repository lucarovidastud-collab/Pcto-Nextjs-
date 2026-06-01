type UsageMeterProps = {
  used: number;
  limit: number;
  label?: string;
  compact?: boolean;
};

export function UsageMeter({ used, limit, label = "Generazioni questo mese", compact = false }: UsageMeterProps) {
  const ratio = limit > 0 ? Math.min(used / limit, 1) : 0;
  const percent = Math.round(ratio * 100);
  const nearLimit = ratio >= 0.85;
  const atLimit = used >= limit;

  return (
    <div className={compact ? "grid gap-2" : "grid gap-3"}>
      <div className="flex items-end justify-between gap-3">
        <span className={`font-bold text-[var(--muted)] ${compact ? "text-[10px] uppercase tracking-wider" : "text-xs"}`}>
          {label}
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
        aria-label={`${label}: ${used} su ${limit}`}
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
          Limite mensile raggiunto — passa a un piano superiore per continuare.
        </p>
      ) : null}
    </div>
  );
}
