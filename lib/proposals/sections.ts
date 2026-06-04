export type ProposalSection = { id: string; title: string };

const MAX_TITLE_LENGTH = 72;

/**
 * Inietta un id stabile su ogni <h3> del preventivo e restituisce l'elenco delle
 * sezioni, così la pagina pubblica può costruire un indice di navigazione cliccabile.
 */
export function withSectionAnchors(html: string): { html: string; sections: ProposalSection[] } {
  if (!html) return { html, sections: [] };

  const sections: ProposalSection[] = [];
  let index = 0;

  const out = html.replace(/<h3(\b[^>]*)>([\s\S]*?)<\/h3>/gi, (match, attrs: string, inner: string) => {
    const title = inner
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/gi, " ")
      .replace(/\s+/g, " ")
      .trim();

    if (!title) return match;

    index += 1;
    const id = `sezione-${index}`;
    const label = title.length > MAX_TITLE_LENGTH ? `${title.slice(0, MAX_TITLE_LENGTH).trim()}…` : title;
    sections.push({ id, title: label });

    if (/\bid\s*=/i.test(attrs)) return match;
    return `<h3${attrs} id="${id}">${inner}</h3>`;
  });

  return { html: out, sections };
}
