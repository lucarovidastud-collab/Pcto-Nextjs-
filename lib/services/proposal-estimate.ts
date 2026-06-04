import {
  extractExplicitTotalFromNotes,
  isReasonableBudget,
  parseItalianAmount
} from "@/lib/services/budget-from-notes";
import {
  extractJsonFromModelText,
  getOpenRouterConfig,
  openRouterChatCompletion
} from "@/lib/services/openrouter-client";
import { logger } from "@/lib/logger";

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

function coerceBudget(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.round(value);
  }
  if (typeof value === "string") {
    const compact = value.trim();
    const parsed = parseItalianAmount(compact) ?? parseItalianAmount(compact.replace(/\s/g, ""));
    return parsed === null ? null : Math.round(parsed);
  }
  return null;
}

function parseAiBudgetResponse(text: string) {
  const jsonText = extractJsonFromModelText(text);
  if (!jsonText) return null;

  try {
    const parsed = JSON.parse(jsonText) as {
      budget?: unknown;
      sectorSummary?: string;
      rationale?: string;
    };
    const budget = coerceBudget(parsed.budget);
    if (budget === null || !isReasonableBudget(budget)) return null;
    return {
      budget,
      sectorSummary: String(parsed.sectorSummary || "").slice(0, 140),
      rationale: String(parsed.rationale || "Analisi AI del documento")
    };
  } catch {
    return null;
  }
}

function buildFallbackResult(
  input: { sector: string },
  fallbackExplicit: number | null,
  rationale: string
) {
  return {
    budget: fallbackExplicit ?? 4200,
    sectorSummary: input.sector,
    rationale
  };
}

export async function estimateBudgetFromNotes(input: {
  notes: string;
  company: string;
  sector: string;
  website?: string;
}) {
  const fallbackExplicit = extractExplicitTotalFromNotes(input.notes);

  if (!getOpenRouterConfig().apiKey) {
    return buildFallbackResult(
      input,
      fallbackExplicit,
      fallbackExplicit
        ? `Totale esplicito nel documento (€ ${fallbackExplicit.toLocaleString("it-IT")})`
        : "Stima default (configura OPENROUTER_API_KEY su Vercel)"
    );
  }

  const result = await openRouterChatCompletion({
    messages: [
      { role: "system", content: BUDGET_SYSTEM_PROMPT },
      { role: "user", content: buildBudgetUserPrompt(input) }
    ],
    temperature: 0.1,
    maxTokens: 600,
    jsonMode: true,
    timeoutMs: 90_000
  });

  if (!result.ok) {
    logger.warn(
      { status: result.status, error: result.error, model: getOpenRouterConfig().model },
      "openrouter.budget_estimate.failed"
    );
    return buildFallbackResult(
      input,
      fallbackExplicit,
      fallbackExplicit
        ? `Totale esplicito nel documento (€ ${fallbackExplicit.toLocaleString("it-IT")})`
        : `Stima di riserva (AI non raggiungibile${result.status ? `, HTTP ${result.status}` : ""})`
    );
  }

  const ai = parseAiBudgetResponse(result.content);
  if (ai) {
    return {
      budget: ai.budget,
      sectorSummary: ai.sectorSummary || input.sector,
      rationale: ai.rationale
    };
  }

  logger.warn(
    { preview: result.content.slice(0, 200) },
    "openrouter.budget_estimate.invalid_json"
  );

  return buildFallbackResult(
    input,
    fallbackExplicit,
    fallbackExplicit
      ? `Totale esplicito nel documento (€ ${fallbackExplicit.toLocaleString("it-IT")})`
      : "Stima di riserva (risposta AI non valida)"
  );
}
