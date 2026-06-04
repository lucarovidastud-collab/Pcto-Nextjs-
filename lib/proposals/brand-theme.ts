export function paletteToCssVars(palette: string[]) {
  const colors = palette.length ? palette : ["#0F766E", "#8B5CF6", "#F59E0B"];
  const primary = colors[0] || "#0F766E";
  const secondary = colors[1] || primary;
  const tertiary = colors[2] || secondary;
  const headerSurface = "#ffffff";

  const vars: Record<string, string> = {
    "--accent": primary,
    "--accent-2": secondary,
    "--accent-3": tertiary,
    "--brand-primary": primary,
    "--brand-secondary": secondary,
    "--brand-tertiary": tertiary,
    "--brand-primary-text": readableBrandOnSurface(primary, headerSurface),
    "--brand-secondary-text": readableBrandOnSurface(secondary, headerSurface),
    "--brand-primary-ui": readableBrandOnSurface(primary, "#ffffff", 3),
    "--brand-secondary-ui": readableBrandOnSurface(secondary, "#ffffff", 3),
    "--brand-gradient": buildPaletteGradient(colors)
  };

  colors.slice(3, 6).forEach((hex, index) => {
    const key = `--brand-accent-${index + 4}`;
    vars[key] = hex;
    vars[`${key}-text`] = readableBrandOnSurface(hex, headerSurface);
  });

  return vars;
}

function buildPaletteGradient(colors: string[]) {
  const stops = colors.slice(0, 6).map((c, i, arr) => {
    const pct = arr.length === 1 ? 0 : Math.round((i / (arr.length - 1)) * 100);
    return `${c} ${pct}%`;
  });
  return `linear-gradient(90deg, ${stops.join(", ")})`;
}

export function brandedPageBackground(palette: string[]) {
  const colors = palette.length ? palette : ["#0F766E"];
  const primary = colors[0];
  const secondary = colors[1] || primary;
  const tertiary = colors[2] || secondary;
  return {
    background: `
      radial-gradient(circle at 8% 0%, color-mix(in srgb, ${primary} 20%, transparent), transparent 36rem),
      radial-gradient(circle at 92% 8%, color-mix(in srgb, ${secondary} 16%, transparent), transparent 32rem),
      radial-gradient(circle at 50% 100%, color-mix(in srgb, ${tertiary} 10%, transparent), transparent 28rem),
      var(--background)
    `
  } as Record<string, string>;
}

type Rgb = { r: number; g: number; b: number };

const PROPOSAL_FOREGROUND = "#0f172a";

/** Colore brand leggibile su sfondo chiaro (titoli, pill, CTA testo). */
export function readableBrandOnSurface(hex: string, surface = "#faf9f6", minRatio = 3): string {
  const brand = parseHex(hex);
  if (!brand) return PROPOSAL_FOREGROUND;
  const bg = parseHex(surface) || { r: 250, g: 249, b: 246 };

  if (contrastRatio(brand, bg) >= minRatio) return normalizeHex(hex);

  let best = PROPOSAL_FOREGROUND;
  let bestRatio = contrastRatio(parseHex(best)!, bg);

  for (let mix = 0.15; mix <= 1; mix += 0.05) {
    const candidate = mixRgb(brand, parseHex(PROPOSAL_FOREGROUND)!, mix);
    const ratio = contrastRatio(candidate, bg);
    if (ratio >= minRatio) return rgbToHex(candidate);
    if (ratio > bestRatio) {
      bestRatio = ratio;
      best = rgbToHex(candidate);
    }
  }

  return best;
}

function parseHex(value: string): Rgb | null {
  const v = value.trim();
  const hex = v.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (!hex) return null;
  const raw = hex[1];
  const full = raw.length === 3 ? raw.split("").map((c) => c + c).join("") : raw;
  return {
    r: Number.parseInt(full.slice(0, 2), 16),
    g: Number.parseInt(full.slice(2, 4), 16),
    b: Number.parseInt(full.slice(4, 6), 16)
  };
}

function normalizeHex(value: string) {
  const rgb = parseHex(value);
  return rgb ? rgbToHex(rgb) : PROPOSAL_FOREGROUND;
}

function rgbToHex({ r, g, b }: Rgb) {
  return `#${[r, g, b].map((n) => n.toString(16).padStart(2, "0")).join("")}`;
}

function mixRgb(a: Rgb, b: Rgb, amount: number): Rgb {
  const t = Math.max(0, Math.min(1, amount));
  return {
    r: Math.round(a.r * (1 - t) + b.r * t),
    g: Math.round(a.g * (1 - t) + b.g * t),
    b: Math.round(a.b * (1 - t) + b.b * t)
  };
}

function luminance({ r, g, b }: Rgb) {
  const toLinear = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

function contrastRatio(a: Rgb, b: Rgb) {
  const l1 = luminance(a);
  const l2 = luminance(b);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}
