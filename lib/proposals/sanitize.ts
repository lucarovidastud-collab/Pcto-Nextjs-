import { formatReadableText } from "@/lib/utils/text";

export function sanitizeProposalHtml(html: string) {
  const cleanedStyles = html.replace(/style="([^"]*)"/gi, (_, styleText: string) => {
    const sanitized = sanitizeInlineStyle(styleText);
    if (!sanitized) return "";
    return `style="${sanitized}"`;
  });

  const spaced = cleanedStyles
    .replace(/\.([A-ZÀ-ÖØ-Þ])/g, ". $1")
    .replace(/\)([A-ZÀ-ÖØ-Þ])/g, ") $1");

  return spaced.replace(/>([^<]+)</g, (_, text: string) => {
    const cleaned = formatReadableText(text);
    return `>${cleaned}<`;
  });
}

type Rgba = { r: number; g: number; b: number; a: number };

function sanitizeInlineStyle(styleText: string) {
  const entries = styleText
    .split(";")
    .map((raw) => raw.trim())
    .filter(Boolean)
    .map((raw) => {
      const idx = raw.indexOf(":");
      if (idx < 1) return null;
      const prop = raw.slice(0, idx).trim().toLowerCase();
      const value = raw.slice(idx + 1).trim();
      return { prop, value };
    })
    .filter((v): v is { prop: string; value: string } => Boolean(v));

  const colorEntry = entries.find((e) => e.prop === "color");
  const bgEntry = entries.find((e) => e.prop === "background-color") || entries.find((e) => e.prop === "background");

  const color = colorEntry ? parseColor(colorEntry.value) : null;
  const bg = bgEntry ? parseColor(bgEntry.value) : null;

  const baseBg: Rgba = { r: 255, g: 255, b: 255, a: 1 };
  const effectiveBg = bg && bg.a > 0.02 ? blend(bg, baseBg) : baseBg;

  let dropColor = false;
  let dropBackground = false;

  if (color && color.a <= 0.02) dropColor = true;
  if (bg && bg.a <= 0.02) dropBackground = true;

  if (color && !dropColor) {
    const c = blend(color, baseBg);
    const ratio = contrastRatio(c, effectiveBg);
    if (ratio < 4) dropColor = true;
  }

  if (color && bg && !dropColor && !dropBackground) {
    const c = blend(color, baseBg);
    const b = blend(bg, baseBg);
    const ratio = contrastRatio(c, b);
    if (ratio < 3) dropBackground = true;
  }

  const rebuilt = entries
    .filter((e) => {
      if (dropColor && e.prop === "color") return false;
      if (dropBackground && (e.prop === "background-color" || e.prop === "background")) return false;
      return true;
    })
    .map((e) => `${e.prop}: ${e.value}`)
    .join("; ");

  return rebuilt.trim();
}

function parseColor(value: string): Rgba | null {
  const v = value.trim().toLowerCase();
  if (!v) return null;
  if (v === "transparent") return { r: 0, g: 0, b: 0, a: 0 };
  if (v === "white") return { r: 255, g: 255, b: 255, a: 1 };
  if (v === "black") return { r: 0, g: 0, b: 0, a: 1 };

  const hex = v.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hex) {
    const raw = hex[1];
    const full = raw.length === 3 ? raw.split("").map((c) => c + c).join("") : raw;
    const r = Number.parseInt(full.slice(0, 2), 16);
    const g = Number.parseInt(full.slice(2, 4), 16);
    const b = Number.parseInt(full.slice(4, 6), 16);
    return { r, g, b, a: 1 };
  }

  const rgb = v.match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)$/i);
  if (rgb) {
    const r = clamp255(Number(rgb[1]));
    const g = clamp255(Number(rgb[2]));
    const b = clamp255(Number(rgb[3]));
    const a = rgb[4] === undefined ? 1 : clamp01(Number(rgb[4]));
    return { r, g, b, a };
  }

  return null;
}

function clamp255(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(255, Math.round(value)));
}

function clamp01(value: number) {
  if (!Number.isFinite(value)) return 1;
  return Math.max(0, Math.min(1, value));
}

function blend(fg: Rgba, bg: Rgba): Rgba {
  const a = fg.a + bg.a * (1 - fg.a);
  if (a <= 0) return { r: 0, g: 0, b: 0, a: 0 };
  const r = (fg.r * fg.a + bg.r * bg.a * (1 - fg.a)) / a;
  const g = (fg.g * fg.a + bg.g * bg.a * (1 - fg.a)) / a;
  const b = (fg.b * fg.a + bg.b * bg.a * (1 - fg.a)) / a;
  return { r: Math.round(r), g: Math.round(g), b: Math.round(b), a };
}

function luminance({ r, g, b }: Rgba) {
  const toLinear = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  const R = toLinear(r);
  const G = toLinear(g);
  const B = toLinear(b);
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

function contrastRatio(a: Rgba, b: Rgba) {
  const L1 = luminance(a);
  const L2 = luminance(b);
  const lighter = Math.max(L1, L2);
  const darker = Math.min(L1, L2);
  return (lighter + 0.05) / (darker + 0.05);
}
