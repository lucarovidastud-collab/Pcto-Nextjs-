"use client";

import { useTranslations } from "next-intl";
import {
  Building2,
  Feather,
  Gem,
  Heart,
  Minus,
  Newspaper,
  Palette,
  Sparkles,
  Terminal,
  Zap,
  type LucideIcon
} from "lucide-react";
import { PROPOSAL_STYLES, type ProposalStyleId } from "@/lib/proposals/styles";

const STYLE_ICONS: Record<ProposalStyleId, LucideIcon> = {
  moderno: Sparkles,
  elegante: Feather,
  minimal: Minus,
  audace: Zap,
  corporate: Building2,
  creativo: Palette,
  tech: Terminal,
  caldo: Heart,
  lusso: Gem,
  editoriale: Newspaper
};

const STYLE_LABEL_KEYS: Record<ProposalStyleId, string> = {
  moderno: "styleModerno",
  elegante: "styleElegante",
  minimal: "styleMinimal",
  audace: "styleAudace",
  corporate: "styleCorporate",
  creativo: "styleCreativo",
  tech: "styleTech",
  caldo: "styleCaldo",
  lusso: "styleLusso",
  editoriale: "styleEditoriale"
};

type Props = {
  value: ProposalStyleId;
  onChange: (value: ProposalStyleId) => void;
};

export function ProposalStylePicker({ value, onChange }: Props) {
  const t = useTranslations("dashboard");

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {PROPOSAL_STYLES.map((style) => {
        const Icon = STYLE_ICONS[style.id];
        const active = value === style.id;
        return (
          <button
            key={style.id}
            type="button"
            onClick={() => onChange(style.id)}
            aria-pressed={active}
            className={`flex min-h-[2.75rem] min-w-0 items-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-bold transition-all ${
              active
                ? "border-[var(--accent)] bg-[var(--accent-glow)] text-[var(--accent)] shadow-sm"
                : "border-[var(--line)] bg-[var(--panel-strong)] text-[var(--foreground)] hover:border-[var(--accent)]"
            }`}
          >
            <Icon size={15} className="shrink-0" />
            <span className="truncate">{t(STYLE_LABEL_KEYS[style.id])}</span>
          </button>
        );
      })}
    </div>
  );
}
