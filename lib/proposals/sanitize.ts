import { normalizeItalianTypography, unwrapInlineEmphasis } from "@/lib/proposals/normalize-typography";

const STYLE_SECTION_RE =
  /<(?:section|div|article)[^>]*>(?:\s*<(?:h[1-6])[^>]*>\s*(?:direzione\s+stile|stile|style\s+direction)[^<]*<\/h[1-6]>)[\s\S]*?<\/(?:section|div|article)>/gi;

const READABLE_PAGE_BG: Rgba = { r: 255, g: 255, b: 255, a: 1 };

const BLOCKED_STYLE_PROPS = new Set([
  "background",
  "background-color",
  "background-image",
  "bgcolor"
]);

const COLOR_ALLOWED_TAGS = new Set(["h1", "h2", "h3", "h4", "th"]);

/**
 * Strips all dangerous HTML that could lead to XSS or content injection.
 * Applied as the first pass before any other sanitization.
 */
function stripDangerousHtml(html: string) {
  let safe = html.replace(/<script\b[\s\S]*?<\/script>/gi, "");

  safe = safe.replace(
    /<\/?(iframe|object|embed|form|input|button|select|textarea|base|link|meta|applet|canvas|audio|video|source|track|svg|math)\b[^>]*>/gi,
    ""
  );

  safe = safe.replace(/\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "");

  safe = safe.replace(
    /(\s(?:href|src|action|formaction|xlink:href)\s*=\s*["'])\s*(?:javascript|data|vbscript):[^"']*/gi,
    "$1#"
  );

  safe = safe.replace(/\s+srcdoc\s*=\s*(?:"[^"]*"|'[^']*')/gi, "");
  safe = safe.replace(/<style\b[\s\S]*?<\/style>/gi, "");

  return safe;
}

function stripBgcolorAttributes(html: string) {
  return html.replace(/\sbgcolor\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "");
}

/** Remove inline color on body text tags; AI often sets dark color + dark bg on parents. */
function stripColorOnBodyTags(html: string) {
  return html.replace(
    /<(p|li|td|span|div|section|article|a|label|mark)(\b[^>]*)>/gi,
    (match, _tag: string, attrs: string) => {
      if (!/\bstyle\s*=/i.test(attrs)) return match;
      const cleanedAttrs = attrs.replace(
        /\bstyle\s*=\s*"([^"]*)"/i,
        (_, styleText: string) => {
          const sanitized = sanitizeInlineStyle(styleText, { allowColor: false });
          if (!sanitized) return "";
          return ` style="${sanitized}"`;
        }
      );
      return match.replace(attrs, cleanedAttrs.replace(/\s{2,}/g, " ").trim());
    }
  );
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

  const wrappedTables = cleanedButtons.replace(
    /(?<!<div[^>]*class="[^"]*table-scroll[^"]*"[^>]*>\s*)(<table\b[\s\S]*?<\/table>)/gi,
    '<div class="table-scroll">$1</div>'
  );

  const noBgcolor = stripBgcolorAttributes(wrappedTables);

  const cleanedStyles = noBgcolor.replace(
    /<(h[1-4]|th|td|p|li|span|div|section|article|a)(\b[^>]*)>/gi,
    (match, tag: string, attrs: string) => {
      if (!/\bstyle\s*=/i.test(attrs)) return match;
      const tagLower = tag.toLowerCase();
      const allowColor = COLOR_ALLOWED_TAGS.has(tagLower);
      const nextAttrs = attrs.replace(/\bstyle\s*=\s*"([^"]*)"/i, (_, styleText: string) => {
        const sanitized = sanitizeInlineStyle(styleText, {
          allowColor,
          minContrast: /^h[1-4]$/.test(tagLower) ? 3 : 4.5
        });
        if (!sanitized) return "";
        return ` style="${sanitized}"`;
      });
      return `<${tag}${nextAttrs}>`;
    }
  );

  const withoutBodyColors = stripColorOnBodyTags(cleanedStyles);

  const withoutEmphasis = unwrapInlineEmphasis(withoutBodyColors);

  const spaced = withoutEmphasis
    .replace(/\.([A-ZÀ-ÖØ-Þ])/g, ". $1")
    .replace(/\)([A-ZÀ-ÖØ-Þ])/g, ") $1");

  const fixedCaps = spaced.replace(/\b(presentar|inviar|comunica[rt]|scriver|mostrar|informa[rt])(V[iI])\b/g, "$1vi");

  return fixedCaps.replace(/>([^<]+)</g, (_, text: string) => {
    const cleaned = normalizeItalianTypography(text);
    return `>${cleaned}<`;
  });
}

type Rgba = { r: number; g: number; b: number; a: number };

type SanitizeStyleOptions = {
  allowColor?: boolean;
  /** WCAG contrast vs light page background (headings may use 3:1). */
  minContrast?: number;
};

export function sanitizeInlineStyle(styleText: string, options: SanitizeStyleOptions = {}) {
  const allowColor = options.allowColor ?? true;
  const minContrast = options.minContrast ?? 4.5;

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

  let dropColor = !allowColor;

  for (const entry of entries) {
    if (BLOCKED_STYLE_PROPS.has(entry.prop)) {
      continue;
    }

    if (entry.prop === "color" && allowColor && !dropColor) {
      const color = parseColor(entry.value);
      if (!color || color.a <= 0.02) {
        dropColor = true;
        continue;
      }
      const c = blend(color, READABLE_PAGE_BG);
      if (contrastRatio(c, READABLE_PAGE_BG) < minContrast) {
        dropColor = true;
      }
    }
  }

  const rebuilt = entries
    .filter((e) => {
      if (BLOCKED_STYLE_PROPS.has(e.prop)) return false;
      if (dropColor && e.prop === "color") return false;
      if (e.prop === "width" || e.prop === "min-width") {
        const px = e.value.match(/^(\d+(?:\.\d+)?)px$/i);
        if (px && Number(px[1]) > 480) return false;
      }
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
