import {
  extractPricingRowsFromText,
  type PricingRow
} from "@/lib/proposals/pricing-table";
import {
  ensureDocumentPricingTotal,
  type ProposalDocument
} from "@/lib/proposals/document-schema";

function briefSectorLabel(sector: string) {
  const s = sector.replace(/\s+/g, " ").trim();
  if (s.length <= 72 && !/proposta per|realizzazione di un nuovo/i.test(s)) return s;
  return "e-commerce e presenza digitale B2B";
}

function buildScopeItems(notes: string) {
  const normalized = notes.replace(/\.([A-ZÀ-ÖØ-Þ])/g, ". $1");
  const lines = normalized
    .split(/\n+|(?<=[.!?])\s+/)
    .map((line) => line.trim())
    .filter((line) => line.length > 20 && line.length < 280)
    .filter((line) => !/^(spett\.|p\.iva|tel\.|fax|via |corso )/i.test(line))
    .slice(0, 8);

  if (!lines.length) {
    return [
      { lead: "Analisi", body: "Esigenze e obiettivi business" },
      { lead: "Proposta", body: "Tecnica e commerciale personalizzata" },
      { lead: "Delivery", body: "Timeline e deliverable definiti" }
    ];
  }

  return lines.map((line) => ({ body: line }));
}

function pricingRowsFromNotes(notes: string, budget: number): PricingRow[] {
  const extracted = extractPricingRowsFromText(notes);
  if (extracted.length >= 2) return extracted;
  const third = Math.round(budget / 3);
  const remainder = budget - third * 2;
  return [
    { label: "Analisi e progettazione", amount: third },
    { label: "Sviluppo e implementazione", amount: third },
    { label: "Go-live e supporto iniziale", amount: remainder }
  ];
}

export function buildFallbackProposalDocument(input: {
  company: string;
  sector: string;
  notes: string;
  budget: number;
}): ProposalDocument {
  const sectorLabel = briefSectorLabel(input.sector);
  const pricingRows = pricingRowsFromNotes(input.notes, input.budget);

  const document: ProposalDocument = {
    version: 1,
    sections: [
      {
        type: "hero",
        title: `Preventivo per ${input.company}`,
        lead: `Proposta commerciale per ${input.company} nel contesto ${sectorLabel}. Il documento riassume obiettivi, ambito operativo, investimento e prossimi passi per l'avvio del progetto.`
      },
      {
        type: "kpis",
        items: [
          { value: `€ ${input.budget.toLocaleString("it-IT")}`, label: "Investimento" },
          { value: String(pricingRows.length), label: "Voci principali" },
          { value: "B2B", label: "Focus commerciale" }
        ]
      },
      {
        type: "text",
        title: "Executive summary",
        paragraphs: [
          `Questa proposta definisce come supportare ${input.company} con un percorso strutturato: analisi, progettazione, realizzazione e messa online, allineati alle esigenze emerse dal materiale fornito.`
        ]
      },
      {
        type: "list",
        title: "Ambito e deliverable",
        items: buildScopeItems(input.notes)
      },
      {
        type: "pricing",
        title: "Dettaglio economico",
        rows: pricingRows.map((row) => ({
          description: row.label,
          amount: `€ ${row.amount.toLocaleString("it-IT")}`
        }))
      },
      {
        type: "highlight",
        title: "Prossimi passi",
        items: [
          "Allineamento finale su priorità e tempistiche",
          "Conferma dell'investimento e avvio progetto",
          `Kick-off operativo con referenti ${input.company}`
        ]
      }
    ]
  };

  return ensureDocumentPricingTotal(document, input.budget);
}
