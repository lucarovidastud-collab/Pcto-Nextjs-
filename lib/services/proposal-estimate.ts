import {
  extractExplicitTotalFromNotes,
  isReasonableBudget
} from "@/lib/services/budget-from-notes";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || "";
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || "google/gemini-2.0-flash-001";
const NOTES_FOR_AI_MAX = 12_000;

const BUDGET_SYSTEM_PROMPT = `Sei un analista commerciale. Estrai il TOTALE del preventivo da testo grezzo (spesso PDF convertito male).

Rispondi SOLO JSON valido:
{"budget":number,"sectorSummary":"max 120 caratteri","rationale":"breve in italiano"}

Regole per "budget" (intero EUR):
- Cerca l'importo TOTALE del preventivo/offerta (es. "totale", "importo totale", "totale generale", "ammontare complessivo").
- In Italia 47.000 significa quarantasettemila euro (47000), non 47.
- IGNORA numeri non pertinenti: telefoni, P.IVA, CAP, codici articolo, date, anni, numeri di pagina, quantità pezzi, prezzi di singole righe se esiste un totale finale.
- NON concatenare o sommare numeri sparsi nel testo.
- Se il totale è chiaro, usa quello esatto.
- Se non c'è totale, stima un importo realistico per il progetto descritto.`;

function buildBudgetUserPrompt(input: {
  notes: string;
  company: string;
  sector: string;
  website?: string;
}) {
  const notes =
    input.notes.length > NOTES_FOR_AI_MAX
      ? `${input.notes.slice(0, NOTES_FOR_AI_MAX)}\n[...testo troncato...]`
      : input.notes;

  return `Azienda: ${input.company}
Settore indicato: ${input.sector}
Sito: ${input.website || "n/d"}

Testo estratto dal documento / appunti:
---
${notes}
---`;
}

function parseAiBudgetResponse(text: string) {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;

  try {
    const parsed = JSON.parse(match[0]) as {
      budget?: number;
      sectorSummary?: string;
      rationale?: string;
    };
    const budget = Math.round(Number(parsed.budget));
    if (!isReasonableBudget(budget)) return null;
    return {
      budget,
      sectorSummary: String(parsed.sectorSummary || "").slice(0, 140),
      rationale: String(parsed.rationale || "Analisi AI del documento")
    };
  } catch {
    return null;
  }
}

export async function estimateBudgetFromNotes(input: {
  notes: string;
  company: string;
  sector: string;
  website?: string;
}) {
  const fallbackExplicit = extractExplicitTotalFromNotes(input.notes);
  const fallbackBudget = fallbackExplicit ?? 4200;

  if (!OPENROUTER_API_KEY) {
    return {
      budget: fallbackBudget,
      sectorSummary: input.sector,
      rationale: fallbackExplicit
        ? `Totale esplicito nel documento (€ ${fallbackExplicit.toLocaleString("it-IT")})`
        : "Stima default (AI non configurata)"
    };
  }

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: OPENROUTER_MODEL,
      temperature: 0.1,
      messages: [
        { role: "system", content: BUDGET_SYSTEM_PROMPT },
        { role: "user", content: buildBudgetUserPrompt(input) }
      ]
    })
  });

  if (!response.ok) {
    return {
      budget: fallbackBudget,
      sectorSummary: input.sector,
      rationale: fallbackExplicit
        ? `Totale esplicito nel documento (€ ${fallbackExplicit.toLocaleString("it-IT")})`
        : "Stima di riserva (AI non disponibile)"
    };
  }

  const payload = await response.json();
  const text = String(payload?.choices?.[0]?.message?.content || "");
  const ai = parseAiBudgetResponse(text);

  if (ai) {
    return {
      budget: ai.budget,
      sectorSummary: ai.sectorSummary || input.sector,
      rationale: ai.rationale
    };
  }

  return {
    budget: fallbackBudget,
    sectorSummary: input.sector,
    rationale: fallbackExplicit
      ? `Totale esplicito nel documento (€ ${fallbackExplicit.toLocaleString("it-IT")})`
      : "Stima di riserva (AI senza risposta valida)"
  };
}
