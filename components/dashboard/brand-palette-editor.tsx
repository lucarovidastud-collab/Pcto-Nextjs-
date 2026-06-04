"use client";

import { Check, Copy, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import {
  appendPaletteColor,
  normalizePaletteHex,
  PALETTE_MAX_COLORS,
  PALETTE_MIN_COLORS,
  sanitizePaletteInput
} from "@/lib/utils/palette";

type Props = {
  palette: string[];
  onChange: (palette: string[]) => void;
};

export function BrandPaletteEditor({ palette, onChange }: Props) {
  const t = useTranslations("dashboard");
  const [copiedColor, setCopiedColor] = useState<string | null>(null);

  function updateColor(index: number, value: string) {
    const next = [...palette];
    next[index] = normalizePaletteHex(value, next[index] || "#0D9488");
    onChange(sanitizePaletteInput(next));
  }

  function removeColor(index: number) {
    if (palette.length <= PALETTE_MIN_COLORS) return;
    onChange(sanitizePaletteInput(palette.filter((_, i) => i !== index)));
  }

  function addColor() {
    onChange(appendPaletteColor(palette));
  }

  async function copyColor(color: string) {
    await navigator.clipboard.writeText(color);
    setCopiedColor(color);
    setTimeout(() => setCopiedColor(null), 1500);
  }

  return (
    <div className="grid gap-3">
      {palette.map((color, index) => (
        <div
          key={`palette-row-${index}`}
          className="flex items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--panel-strong)] p-2"
        >
          <input
            type="color"
            value={normalizePaletteHex(color).toLowerCase()}
            onInput={(e) => updateColor(index, (e.target as HTMLInputElement).value)}
            onChange={(e) => updateColor(index, (e.target as HTMLInputElement).value)}
            className="color-swatch-input h-10 w-14 shrink-0 cursor-pointer rounded-lg border border-[var(--line)] bg-[var(--panel)]"
            aria-label={t("paletteColorPicker")}
          />

          <input
            type="text"
            value={color}
            onChange={(e) => updateColor(index, e.target.value)}
            onBlur={(e) => updateColor(index, e.target.value)}
            className="input min-h-0 flex-1 py-1.5 font-mono text-xs uppercase"
            spellCheck={false}
            maxLength={7}
          />

          <button
            type="button"
            onClick={() => void copyColor(color)}
            className="btn-secondary shrink-0 px-2.5 py-1.5 min-h-0"
            title={t("paletteCopy")}
          >
            {copiedColor === color ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
          </button>

          <button
            type="button"
            onClick={() => removeColor(index)}
            disabled={palette.length <= PALETTE_MIN_COLORS}
            className="btn-secondary shrink-0 px-2.5 py-1.5 min-h-0 disabled:opacity-40"
            title={t("paletteRemove")}
          >
            <Trash2 size={14} />
          </button>
        </div>
      ))}

      {palette.length < PALETTE_MAX_COLORS && (
        <button
          type="button"
          onClick={addColor}
          className="btn-secondary w-full text-xs font-bold py-2 min-h-[2.25rem] flex items-center justify-center gap-1.5"
        >
          <Plus size={14} />
          {t("paletteAdd")}
        </button>
      )}

      {copiedColor && (
        <p className="text-[10px] text-emerald-600 font-bold animate-pulse">
          {t("hexCopied", { color: copiedColor })}
        </p>
      )}
    </div>
  );
}
