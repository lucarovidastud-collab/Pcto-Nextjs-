import { formatReadableText } from "@/lib/utils/text";

/** Rimuove grassetto/corsivo inline generato dall'AI (testo uniforme). */
export function unwrapInlineEmphasis(html: string): string {
  return html
    .replace(/<(?:strong|b)\b[^>]*>/gi, "")
    .replace(/<\/(?:strong|b)>/gi, "")
    .replace(/<(?:em|i)\b[^>]*>/gi, "")
    .replace(/<\/(?:em|i)>/gi, "");
}

/** Riduce Title Case spurio: "Gamma Prodotti Tutti" → "Gamma prodotti tutti". */
export function fixExcessiveTitleCase(text: string): string {
  return text.replace(
    /\b([A-ZÀ-ÖØ-Þ][a-zà-öø-ÿ]+)(?:\s+([A-ZÀ-ÖØ-Þ][a-zà-öø-ÿ]+)){2,}/g,
    (match, first) => {
      const words = match.split(/\s+/);
      return words
        .map((word, index) => {
          if (index === 0) return word;
          if (/^[A-Z]{2,}$/.test(word)) return word;
          return word.charAt(0).toLowerCase() + word.slice(1);
        })
        .join(" ");
    }
  );
}

const CAPITALIZED_PARTICLES: Record<string, string> = {
  A: "a",
  Ad: "ad",
  Al: "al",
  Alla: "alla",
  Ai: "ai",
  Alle: "alle",
  Con: "con",
  Da: "da",
  Dal: "dal",
  Dalla: "dalla",
  De: "de",
  Dei: "dei",
  Del: "del",
  Della: "della",
  Delle: "delle",
  Di: "di",
  E: "e",
  Ed: "ed",
  Fra: "fra",
  Gli: "gli",
  I: "i",
  Il: "il",
  In: "in",
  La: "la",
  Le: "le",
  Lo: "lo",
  Nel: "nel",
  Nella: "nella",
  Nei: "nei",
  Nelle: "nelle",
  O: "o",
  Per: "per",
  Su: "su",
  Sul: "sul",
  Sulla: "sulla",
  Tra: "tra",
  Un: "un",
  Una: "una"
};

/** Corregge articoli/preposizioni con maiuscola errata (es. "Tutti I prodotti" → "Tutti i prodotti"). */
export function fixItalianParticlesCase(text: string): string {
  let out = text.replace(
    /\b([A-ZÀ-ÖØ-Þ][a-zà-öø-ÿ]+)\b/g,
    (word) => CAPITALIZED_PARTICLES[word] ?? word
  );
  out = out.replace(/(\w)\s+I\s+([a-zà-öø-ÿ])/g, "$1 i $2");
  return out;
}

export function normalizeItalianTypography(text: string): string {
  const spaced = formatReadableText(text);
  return fixItalianParticlesCase(fixExcessiveTitleCase(spaced));
}
