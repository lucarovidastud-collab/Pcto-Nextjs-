export function paletteToCssVars(palette: string[]) {
  const primary = palette[0] || "#0F766E";
  const secondary = palette[1] || primary;
  const tertiary = palette[2] || secondary;
  return {
    "--accent": primary,
    "--accent-2": secondary,
    "--accent-3": tertiary,
    "--brand-primary": primary,
    "--brand-secondary": secondary,
    "--brand-tertiary": tertiary
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
