export function paletteToCssVars(palette: string[]) {
  const primary = palette[0] || "#0F766E";
  const secondary = palette[1] || primary;
  const tertiary = palette[2] || secondary;
  const proposalBg = "#faf9f6";
  const headerSurface = "#ffffff";
  return {
    "--accent": primary,
    "--accent-2": secondary,
    "--accent-3": tertiary,
    "--brand-primary": primary,
    "--brand-secondary": secondary,
    "--brand-tertiary": tertiary,
    "--brand-primary-text": readableBrandOnSurface(primary, headerSurface),
    "--brand-secondary-text": readableBrandOnSurface(secondary, headerSurface),
    "--brand-primary-ui": readableBrandOnSurface(primary, "#ffffff", 3),
    "--brand-secondary-ui": readableBrandOnSurface(secondary, "#ffffff", 3)
  } as Record<string, string>;
}

export function brandedPageBackground(palette: string[]) {
  const primary = palette[0] || "#0F766E";
  const secondary = palette[1] || primary;
  return {
    background: `
      radial-gradient(circle at 8% 0%, color-mix(in srgb, ${primary} 20%, transparent), transparent 36rem),
      radial-gradient(circle at 92% 8%, color-mix(in srgb, ${secondary} 16%, transparent), transparent 32rem),
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
