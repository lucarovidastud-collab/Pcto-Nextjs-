export const PALETTE_MIN_COLORS = 1;
export const PALETTE_MAX_COLORS = 6;

const PALETTE_PRESETS = ["#0D9488", "#8B5CF6", "#F59E0B", "#E11D48", "#2563EB", "#CA8A04"];

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

/** Aggiunge un colore distinto (fix: non scartare il duplicato dell'ultimo). */
export function appendPaletteColor(colors: string[]): string[] {
  const base = sanitizePaletteInput(colors);
  if (base.length >= PALETTE_MAX_COLORS) return base;

  const preset = PALETTE_PRESETS.find((hex) => !base.includes(hex));
  const next = preset || rotateHue(base[base.length - 1] || "#0D9488", 47);
  return [...base, next];
}

function rotateHue(hex: string, degrees: number) {
  const rgb = hexToRgb(normalizePaletteHex(hex));
  if (!rgb) return "#0D9488";

  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  const d = max - min;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
  }
  h = (h * 60 + degrees + 360) % 360;
  const s = max === 0 ? 0 : d / max;
  const v = max;
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let r1 = 0;
  let g1 = 0;
  let b1 = 0;
  if (h < 60) [r1, g1, b1] = [c, x, 0];
  else if (h < 120) [r1, g1, b1] = [x, c, 0];
  else if (h < 180) [r1, g1, b1] = [0, c, x];
  else if (h < 240) [r1, g1, b1] = [0, x, c];
  else if (h < 300) [r1, g1, b1] = [x, 0, c];
  else [r1, g1, b1] = [c, 0, x];
  const R = Math.round((r1 + m) * 255);
  const G = Math.round((g1 + m) * 255);
  const B = Math.round((b1 + m) * 255);
  return `#${[R, G, B].map((n) => n.toString(16).padStart(2, "0")).join("").toUpperCase()}`;
}

function hexToRgb(hex: string) {
  const m = normalizePaletteHex(hex).match(/^#([0-9A-F]{6})$/);
  if (!m) return null;
  return {
    r: Number.parseInt(m[1].slice(0, 2), 16),
    g: Number.parseInt(m[1].slice(2, 4), 16),
    b: Number.parseInt(m[1].slice(4, 6), 16)
  };
}
