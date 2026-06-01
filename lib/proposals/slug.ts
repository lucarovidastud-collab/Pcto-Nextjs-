const RESERVED = new Set([
  "admin",
  "api",
  "billing",
  "checkout",
  "dashboard",
  "history",
  "login",
  "privacy",
  "subscribe",
  "terms",
  "workspace",
  "p",
  "favicon",
  "robots",
  "sitemap"
]);

export function slugifyProposalLink(value: string) {
  const withoutLegal = value
    .replace(/\b(s\.?\s?r\.?\s?l\.?|spa|s\.?\s?p\.?\s?a\.?|snc|sas|gmbh|inc|ltd)\b/gi, " ")
    .trim();
  return withoutLegal
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export function isValidProposalSlug(slug: string) {
  if (!slug || slug.length < 2 || slug.length > 48) return false;
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return false;
  if (RESERVED.has(slug)) return false;
  return true;
}

export function proposalSlugError(slug: string) {
  if (!slug.trim()) return "Inserisci un identificativo per il link.";
  const normalized = slugifyProposalLink(slug);
  if (!isValidProposalSlug(normalized)) {
    return "Usa solo lettere, numeri e trattini (es. king-inox). Min 2 caratteri.";
  }
  if (RESERVED.has(normalized)) return "Questo identificativo è riservato, scegline un altro.";
  return null;
}

export function fallbackShareToken() {
  return `p-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}
