/** Applica i colori palette alle card e ai titoli h3 (anche senza inline style dall'AI). */
export function applyBrandPaletteToHtml(html: string, palette: string[]) {
  const colors = palette.length ? palette : ["#0F766E", "#8B5CF6", "#F59E0B"];
  let cardIndex = 0;

  return html.replace(/<section\s+class="proposal-card"([^>]*)>/gi, (_match, attrs: string) => {
    const color = colors[cardIndex % colors.length];
    cardIndex += 1;

    if (/\bstyle\s*=/i.test(attrs)) {
      const withBorder = attrs.replace(/style="([^"]*)"/i, (_, style: string) => {
        const cleaned = style
          .split(";")
          .map((s: string) => s.trim())
          .filter((s: string) => s && !/^border-left\s*:/i.test(s) && !/^--card-accent\s*:/i.test(s));
        cleaned.unshift(`border-left:5px solid ${color}`, `--card-accent:${color}`);
        return `style="${cleaned.join("; ")}"`;
      });
      return `<section class="proposal-card"${withBorder}>`;
    }

    return `<section class="proposal-card"${attrs} style="border-left:5px solid ${color};--card-accent:${color}">`;
  });
}
