import { Sparkles } from "lucide-react";

const sizes = {
  sm: { box: "h-8 w-8 text-sm", title: "text-xs", tagline: "text-[8px]" },
  md: { box: "h-10 w-10 text-lg", title: "text-sm", tagline: "text-[9px]" },
  lg: { box: "h-12 w-12 text-xl", title: "text-base", tagline: "text-[10px]" }
} as const;

export function BrandMark({ size = "md" }: { size?: keyof typeof sizes }) {
  const s = sizes[size];
  return (
    <div className="flex items-center gap-2.5">
      <div
        className={`flex ${s.box} shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--accent)] via-[var(--accent)] to-[var(--accent-2)] shadow-md ring-1 ring-white/20`}
        aria-hidden
      >
        <span className="font-black leading-none text-white">Q</span>
      </div>
      <div className="min-w-0">
        <p className={`${s.title} font-black tracking-tight text-[var(--foreground)] leading-tight`}>
          QuoteGen
        </p>
        <p
          className={`${s.tagline} font-extrabold uppercase tracking-[0.2em] text-[var(--muted)] flex items-center gap-1`}
        >
          <Sparkles size={10} className="text-[var(--accent)] shrink-0" aria-hidden />
          Proposte AI
        </p>
      </div>
    </div>
  );
}
