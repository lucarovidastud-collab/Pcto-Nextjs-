/** Ripristina spazi mancanti dopo punteggiatura (es. "bucket).Origini" → "bucket). Origini"). */
export function formatReadableText(value: string) {
  return value
    .replace(/\r\n/g, "\n")
    .replace(/\.([A-ZÀ-ÖØ-Þ])/g, ". $1")
    .replace(/\)([A-ZÀ-ÖØ-Þ])/g, ") $1")
    .replace(/([a-zà-öø-ÿ]),([A-ZÀ-ÖØ-Þ])/g, "$1, $2")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export function truncateText(value: string, max = 140) {
  const clean = formatReadableText(value);
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1).trim()}…`;
}
