const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || "";
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || "google/gemini-2.0-flash-001";

function extractBudgetFromNotes(notes: string) {
  const euroMatch = notes.match(/(?:€|eur(?:o)?)\s*([\d.,]+)/i);
  if (euroMatch) {
    const value = Number(euroMatch[1].replace(/\./g, "").replace(",", "."));
    if (Number.isFinite(value) && value >= 500) return Math.round(value);
  }
  const plain = notes.match(/\b([\d]{3,6})\b/g);
  if (plain?.length) {
    const currentYear = new Date().getFullYear();
    const candidates = plain
      .map((v) => Number(v))
      .filter((v) => v >= 800 && v <= 250_000 && v !== currentYear && v !== currentYear + 1);
    if (candidates.length) return Math.round(candidates.sort((a, b) => b - a)[0]);
  }
  return null;
}

export async function estimateBudgetFromNotes(input: {
  notes: string;
  company: string;
  sector: string;
  website?: string;
}) {
  const heuristic = extractBudgetFromNotes(input.notes);
  if (!OPENROUTER_API_KEY) {
    return {
      budget: heuristic || 4200,
      sectorSummary: input.sector,
      rationale: heuristic ? "Budget estratto dagli appunti" : "Stima default"
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
- se negli appunti c'è un importo esplicito, usalo
- range tipico 1500-50000`
        }
      ]
    })
  });

  if (!response.ok) {
    return {
      budget: heuristic || 4200,
      sectorSummary: input.sector,
      rationale: "Stima euristica (AI non disponibile)"
    };
  }

  const payload = await response.json();
  const text = String(payload?.choices?.[0]?.message?.content || "");
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) {
    return {
      budget: heuristic || 4200,
      sectorSummary: input.sector,
      rationale: "Stima euristica"
    };
  }

  try {
    const parsed = JSON.parse(match[0]) as { budget?: number; sectorSummary?: string; rationale?: string };
    const budget = Math.round(Number(parsed.budget));
    const safeBudget = Number.isFinite(budget) && budget >= 500 ? budget : heuristic || 4200;
    return {
      budget: safeBudget,
      sectorSummary: String(parsed.sectorSummary || input.sector).slice(0, 140),
      rationale: String(parsed.rationale || "Stima AI")
    };
  } catch {
    return {
      budget: heuristic || 4200,
      sectorSummary: input.sector,
      rationale: "Stima euristica"
    };
  }
}
