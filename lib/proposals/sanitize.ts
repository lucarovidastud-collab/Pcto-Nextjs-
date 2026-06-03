import { formatReadableText } from "@/lib/utils/text";

const STYLE_SECTION_RE =
  /<(?:section|div|article)[^>]*>(?:\s*<(?:h[1-6])[^>]*>\s*(?:direzione\s+stile|stile|style\s+direction)[^<]*<\/h[1-6]>)[\s\S]*?<\/(?:section|div|article)>/gi;

/**
 * Strips all dangerous HTML that could lead to XSS or content injection.
 * Applied as the first pass before any other sanitization.
 */
function stripDangerousHtml(html: string): string {
  // Remove script blocks (including content)
  let safe = html.replace(/<script\b[\s\S]*?<\/script>/gi, "");

  // Remove dangerous singleton/block tags entirely
  safe = safe.replace(
    /<\/?(iframe|object|embed|form|input|button|select|textarea|base|link|meta|applet|canvas|audio|video|source|track|svg|math)\b[^>]*>/gi,
    ""
  );

  // Remove event handlers (on*)
  safe = safe.replace(/\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "");

  // Remove javascript: and data: URIs from href/src/action/formaction attributes
  safe = safe.replace(
    /(\s(?:href|src|action|formaction|xlink:href)\s*=\s*["'])\s*(?:javascript|data|vbscript):[^"']*/gi,
    "$1#"
  );

  // Remove srcdoc (can inject HTML into iframes even if iframe removed)
  safe = safe.replace(/\s+srcdoc\s*=\s*(?:"[^"]*"|'[^']*')/gi, "");

  // Remove <style> blocks (can contain expression() / url() XSS in IE)
  safe = safe.replace(/<style\b[\s\S]*?<\/style>/gi, "");

  return safe;
}

export function sanitizeProposalHtml(html: string) {
  const stripped = stripDangerousHtml(html);
  const noStyleSections = stripped.replace(STYLE_SECTION_RE, "");

  const cleanedButtons = noStyleSections
    .replace(/<button\b[\s\S]*?accetta\s+preventivo[\s\S]*?<\/button>/gi, "")
    .replace(/<a\b[\s\S]*?accetta\s+preventivo[\s\S]*?<\/a>/gi, "")
    .replace(/<input\b[^>]*\bvalue\s*=\s*["']\s*accetta\s+preventivo\s*["'][^>]*>/gi, "")
    .replace(/<button\b[^>]*\bclass\s*=\s*["'][^"']*\bbtn-glow\b[^"']*["'][^>]*>[\s\S]*?<\/button>/gi, "")
    .replace(/<a\b[^>]*\bclass\s*=\s*["'][^"']*\bbtn-glow\b[^"']*["'][^>]*>[\s\S]*?<\/a>/gi, "");

  // Wrap bare <table> tags in a scroll container so they fill 100% width
  const wrappedTables = cleanedButtons.replace(
    /(?<!<div[^>]*class="[^"]*table-scroll[^"]*"[^>]*>\s*)(<table\b[\s\S]*?<\/table>)/gi,
    '<div class="table-scroll">$1</div>'
  );

  const cleanedStyles = wrappedTables.replace(/style="([^"]*)"/gi, (_, styleText: string) => {
    const sanitized = sanitizeInlineStyle(styleText);
    if (!sanitized) return "";
    return `style="${sanitized}"`;
  });

  // Fix missing spaces after punctuation before uppercase
  const spaced = cleanedStyles
    .replace(/\.([A-ZÀ-ÖØ-Þ])/g, ". $1")
    .replace(/\)([A-ZÀ-ÖØ-Þ])/g, ") $1");

  // Fix honorific caps (presentarVi → presentarvi, VostRA → vostra, etc.)
  const fixedCaps = spaced.replace(/\b(presentar|inviar|comunica[rt]|scriver|mostrar|informa[rt])(V[iI])\b/g, "$1vi");

  return fixedCaps.replace(/>([^<]+)</g, (_, text: string) => {
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
    .map((e) => {
      if (e.prop === "text-align" && /^(right|end)$/i.test(e.value)) {
        return "text-align: center";
      }
      return `${e.prop}: ${e.value}`;
    })
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
