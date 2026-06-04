import { extractBudgetFromNotes } from "@/lib/services/budget-from-notes";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || "";
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || "google/gemini-2.0-flash-001";

export async function estimateBudgetFromNotes(input: {
  notes: string;
  company: string;
  sector: string;
  website?: string;
}) {
  const explicitBudget = extractBudgetFromNotes(input.notes);

  if (!OPENROUTER_API_KEY) {
    return {
      budget: explicitBudget || 4200,
      sectorSummary: input.sector,
      rationale: explicitBudget
        ? `Importo rilevato negli appunti (€ ${explicitBudget.toLocaleString("it-IT")})`
        : "Stima default"
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
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content:
            'Rispondi SOLO JSON: {"budget":number,"sectorSummary":"max 120 caratteri","rationale":"breve"}'
        },
        {
          role: "user",
          content: `Stima preventivo B2B.
Azienda: ${input.company}
Settore: ${input.sector}
Sito: ${input.website || "n/d"}
Appunti grezzi:
${input.notes}

Regole budget:
- numero intero EUR, realistico per scope descritto
- se negli appunti c'è un importo totale esplicito (es. "totale 47.000", "importo 15000"), usa QUELLO esatto senza limiti minimo/massimo`
        }
      ]
    })
  });

  if (!response.ok) {
    return {
      budget: explicitBudget || 4200,
      sectorSummary: input.sector,
      rationale: explicitBudget
        ? `Importo rilevato negli appunti (€ ${explicitBudget.toLocaleString("it-IT")})`
        : "Stima euristica (AI non disponibile)"
    };
  }

  const payload = await response.json();
  const text = String(payload?.choices?.[0]?.message?.content || "");
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) {
    return {
      budget: explicitBudget || 4200,
      sectorSummary: input.sector,
      rationale: explicitBudget ? "Importo dagli appunti" : "Stima euristica"
    };
  }

  try {
    const parsed = JSON.parse(match[0]) as { budget?: number; sectorSummary?: string; rationale?: string };
    const aiBudget = Math.round(Number(parsed.budget));
    const safeAiBudget = Number.isFinite(aiBudget) && aiBudget > 0 ? aiBudget : null;

    const budget = explicitBudget ?? safeAiBudget ?? 4200;
    const rationale = explicitBudget
      ? `Importo rilevato negli appunti (€ ${explicitBudget.toLocaleString("it-IT")})`
      : String(parsed.rationale || "Stima AI");

    return {
      budget,
      sectorSummary: String(parsed.sectorSummary || input.sector).slice(0, 140),
      rationale
    };
  } catch {
    return {
      budget: explicitBudget || 4200,
      sectorSummary: input.sector,
      rationale: explicitBudget ? "Importo dagli appunti" : "Stima euristica"
    };
  }
}
