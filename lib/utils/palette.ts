export const PALETTE_MIN_COLORS = 1;
export const PALETTE_MAX_COLORS = 6;

export function normalizePaletteHex(value: string, fallback = "#0D9488"): string {
  const raw = value.trim().replace(/^#/, "");
  if (/^[0-9A-Fa-f]{3}$/.test(raw)) {
    const expanded = raw
      .split("")
      .map((c) => c + c)
      .join("");
    return `#${expanded.toUpperCase()}`;
  }
  if (/^[0-9A-Fa-f]{6}$/.test(raw)) {
    return `#${raw.toUpperCase()}`;
  }
  return fallback;
}

export function sanitizePaletteInput(colors: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const color of colors) {
    const hex = normalizePaletteHex(color);
    if (seen.has(hex)) continue;
    seen.add(hex);
    out.push(hex);
    if (out.length >= PALETTE_MAX_COLORS) break;
  }
  while (out.length < PALETTE_MIN_COLORS) {
    out.push("#0D9488");
  }
  return out;
}
