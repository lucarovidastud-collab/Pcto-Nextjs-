const TOTAL_LINE_RE =
  /(?:totale|importo|budget|investimento|complessivo|valore|offerta|preventivo|da\s+pagare|ammontare)/i;

/** Token numerico limitato (evita catene infinite da PDF mal estratti). */
const AMOUNT_TOKEN_RE = /\d{1,3}(?:\.\d{3}){0,3}(?:,\d{1,2})?|\d{1,8}(?:,\d{1,2})?/g;

const LABELED_AMOUNT_RE =
  /(?:totale\s+(?:generale\s+)?|importo\s+totale|budget\s+totale|investimento\s+totale|valore\s+complessivo|ammontare\s+complessivo|totale\s+progetto)\s*[:\s]*(?:eur\.?|€)?\s*(\d{1,3}(?:\.\d{3}){0,3}(?:,\d{1,2})?|\d{1,8}(?:,\d{1,2})?)/gi;

/** Converte "47.000", "47.000,50", "47000" in numero (rifiuta sequenze assurde). */
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

function isPlausibleBudget(value: number, year: number) {
  if (!Number.isFinite(value) || value <= 0) return false;
  if (value >= year - 1 && value <= year + 1) return false;
  const digits = String(Math.round(value)).length;
  if (digits > 9) return false;
  return true;
}

function amountFitness(value: number): number {
  const digits = String(value).length;
  if (digits >= 10) return -10_000;
  if (digits >= 4 && digits <= 7) return 10;
  if (digits <= 3) return 5;
  return 0;
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

function pickBest(candidates: Array<{ value: number; score: number }>): number | null {
  if (!candidates.length) return null;

  candidates.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const fit = amountFitness(b.value) - amountFitness(a.value);
    if (fit !== 0) return fit;
    return a.value - b.value;
  });

  return candidates[0].value;
}

/** Estrae il budget totale da appunti/PDF (formati italiani inclusi). */
export function extractBudgetFromNotes(notes: string): number | null {
  const year = new Date().getFullYear();
  const candidates: Array<{ value: number; score: number }> = [];

  for (const match of notes.matchAll(LABELED_AMOUNT_RE)) {
    addCandidate(candidates, match[1], 120, year);
  }

  for (const line of notes.split(/\n+/)) {
    const lineScore = TOTAL_LINE_RE.test(line) ? 100 : 20;
    const tokens = line.match(AMOUNT_TOKEN_RE) || [];
    for (const token of tokens) {
      addCandidate(candidates, token, lineScore, year);
    }
  }

  for (const match of notes.matchAll(/(?:€|eur\.?)\s*(\d{1,3}(?:\.\d{3}){0,3}(?:,\d{1,2})?|\d{1,8}(?:,\d{1,2})?)/gi)) {
    addCandidate(candidates, match[1], 70, year);
  }

  for (const match of notes.matchAll(/(\d{1,3}(?:\.\d{3}){0,3}(?:,\d{1,2})?|\d{1,8}(?:,\d{1,2})?)\s*(?:€|eur\.?)/gi)) {
    addCandidate(candidates, match[1], 70, year);
  }

  return pickBest(candidates);
}
