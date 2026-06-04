const TOTAL_LINE_RE =
  /(?:totale|importo|budget|investimento|complessivo|valore|offerta|preventivo|da\s+pagare|ammontare)/i;

/** Converte "47.000", "47.000,50", "47000", "47 000" in numero. */
export function parseItalianAmount(raw: string): number | null {
  const compact = raw.replace(/\s/g, "").trim();
  if (!compact) return null;

  if (/^\d{1,3}(\.\d{3})+(,\d{1,2})?$/.test(compact)) {
    const [intPart, decPart = "0"] = compact.split(",");
    const value = Number(`${intPart.replace(/\./g, "")}.${decPart}`);
    return Number.isFinite(value) ? value : null;
  }

  if (/^\d+(,\d{1,2})?$/.test(compact)) {
    const value = Number(compact.replace(",", "."));
    return Number.isFinite(value) ? value : null;
  }

  if (/^\d{1,3}(\.\d{3})+$/.test(compact)) {
    const value = Number(compact.replace(/\./g, ""));
    return Number.isFinite(value) ? value : null;
  }

  if (/^\d+$/.test(compact)) {
    return Number(compact);
  }

  return null;
}

function isPlausibleBudget(value: number, year: number) {
  if (!Number.isFinite(value) || value <= 0) return false;
  // Evita di confondere anni (es. 2026) con importi
  if (value >= year - 1 && value <= year + 1) return false;
  return true;
}

function addCandidate(
  list: Array<{ value: number; score: number }>,
  raw: string,
  score: number,
  year: number
) {
  const value = parseItalianAmount(raw);
  if (value === null) return;
  const rounded = Math.round(value);
  if (!isPlausibleBudget(rounded, year)) return;
  list.push({ value: rounded, score });
}

/** Estrae il budget totale da appunti/PDF (formati italiani inclusi). */
export function extractBudgetFromNotes(notes: string): number | null {
  const year = new Date().getFullYear();
  const candidates: Array<{ value: number; score: number }> = [];

  const labeledPatterns = [
    /(?:totale\s+(?:generale\s+)?|importo\s+totale|budget\s+totale|investimento\s+totale|valore\s+complessivo|ammontare\s+complessivo)[:\s]*(?:eur\.?|€)?\s*([\d][\d.\s,]*)/gi,
    /(?:€|eur\.?)\s*([\d][\d.\s,]*)/gi,
    /([\d][\d.\s,]*)\s*(?:€|eur\.?)/gi
  ];

  for (const pattern of labeledPatterns) {
    for (const match of notes.matchAll(pattern)) {
      addCandidate(candidates, match[1], 80, year);
    }
  }

  for (const line of notes.split(/\n+/)) {
    const lineScore = TOTAL_LINE_RE.test(line) ? 100 : 15;
    for (const match of line.matchAll(/([\d][\d.\s,]*)/g)) {
      addCandidate(candidates, match[1], lineScore, year);
    }
  }

  if (!candidates.length) return null;

  candidates.sort((a, b) => b.score - a.score || b.value - a.value);
  const bestScore = candidates[0].score;
  const top = candidates.filter((c) => c.score === bestScore);
  return top.sort((a, b) => b.value - a.value)[0].value;
}
