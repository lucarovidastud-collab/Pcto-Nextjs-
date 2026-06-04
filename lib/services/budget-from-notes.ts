/**
 * Fallback stretto quando l'AI non è disponibile.
 * Non scansiona tutto il PDF: solo righe con etichetta totale esplicita.
 */

const EXPLICIT_TOTAL_PATTERNS = [
  /(?:importo\s+totale|totale\s+(?:generale|progetto|offerta)|budget\s+totale|ammontare\s+complessivo)\s*[:\s]*(?:eur\.?|€)?\s*(\d{1,3}(?:\.\d{3}){0,3}(?:,\d{1,2})?|\d{1,8}(?:,\d{1,2})?)/i,
  /(?:^|[\n\r])\s*totale\s*[:\s]*(?:eur\.?|€)?\s*(\d{1,3}(?:\.\d{3}){0,3}(?:,\d{1,2})?|\d{1,8}(?:,\d{1,2})?)/i
];

export function parseItalianAmount(raw: string): number | null {
  const compact = raw.replace(/\s/g, "").trim();
  if (!compact) return null;

  if (/^\d{1,3}(\.\d{3}){0,3}(,\d{1,2})?$/.test(compact)) {
    const [intPart, decPart = "0"] = compact.split(",");
    const value = Number(`${intPart.replace(/\./g, "")}.${decPart}`);
    return Number.isFinite(value) ? value : null;
  }

  if (/^\d{1,8}(,\d{1,2})?$/.test(compact)) {
    const value = Number(compact.replace(",", "."));
    return Number.isFinite(value) ? value : null;
  }

  return null;
}

export function isReasonableBudget(value: number): boolean {
  const year = new Date().getFullYear();
  if (!Number.isFinite(value) || value <= 0) return false;
  if (value >= year - 1 && value <= year + 1) return false;
  if (String(Math.round(value)).length > 9) return false;
  return true;
}

/** Solo etichetta totale esplicita — fallback se l'AI non risponde. */
export function extractExplicitTotalFromNotes(notes: string): number | null {
  for (const pattern of EXPLICIT_TOTAL_PATTERNS) {
    const match = notes.match(pattern);
    if (!match?.[1]) continue;
    const value = parseItalianAmount(match[1]);
    if (value === null) continue;
    const rounded = Math.round(value);
    if (isReasonableBudget(rounded)) return rounded;
  }
  return null;
}
