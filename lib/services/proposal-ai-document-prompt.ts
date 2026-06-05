import { resolveProposalStyle } from "@/lib/proposals/styles";
import { truncateNotesForProposal } from "@/lib/services/proposal-ai-prompt";

export function buildProposalDocumentAiMessages(input: {
  company: string;
  sector: string;
  notes: string;
  budget: number;
  palette: string[];
  styleDirection?: string;
  style?: string;
}) {
  const colors = input.palette.length ? input.palette : ["#0F766E", "#8B5CF6", "#F59E0B"];
  const notesBlock = truncateNotesForProposal(input.notes);
  const styleDef = resolveProposalStyle(input.style);
  const styleHint = input.styleDirection?.trim()
    ? `Direzione visiva dal sito cliente: ${input.styleDirection.trim()}`
    : "Direzione visiva: premium B2B, pulito, gerarchia chiara.";
  const toneHint = `Stile richiesto — ${styleDef.promptHint} Adatta il TONO del copy a questo stile.`;

  const system = `Sei un direttore creativo B2B che struttura preventivi commerciali in italiano.
Rispondi SOLO con JSON valido (nessun markdown, nessun commento) secondo lo schema indicato.
Il rendering visivo è gestito da componenti React/Tailwind: tu fornisci solo contenuti strutturati.`;

  const user = `Cliente: ${input.company}
Settore: ${input.sector}
Budget totale vincolante: EUR ${input.budget} — l'ultima riga pricing deve essere "Totale investimento" con importo € ${input.budget.toLocaleString("it-IT")}
Palette brand (solo riferimento): ${colors.join(", ")}
${styleHint}
${toneHint}

--- MATERIALE SORGENTE ---
${notesBlock}
--- FINE ---

SCHEMA JSON (version deve essere 1):
{
  "version": 1,
  "sections": [
    { "type": "hero", "title": "...", "lead": "4-6 frasi" },
    { "type": "kpis", "items": [{ "value": "...", "label": "..." }] },
    { "type": "text", "title": "...", "paragraphs": ["..."] },
    { "type": "list", "title": "...", "items": [{ "lead": "termine", "body": "spiegazione" }] },
    { "type": "timeline", "title": "...", "steps": [{ "title": "...", "description": "..." }] },
    { "type": "grid", "title": "...", "cards": [{ "title": "...", "body": "..." }] },
    { "type": "pricing", "title": "Dettaglio economico", "rows": [{ "description": "...", "amount": "€ ..." }] },
    { "type": "highlight", "title": "Prossimi passi", "items": ["..."] }
  ]
}

REGOLE:
1. Minimo 8 sezioni (escluso hero/kpis), massima chiarezza: niente muri di testo
2. Estrai obiettivi, deliverable, tempi, voci di costo dal PDF; se mancano, proponi voci realistiche
3. Liste: usa "lead" + "body" per ogni voce (lead = 1-3 parole chiave)
4. Pricing: una riga per voce + ultima riga Totale investimento
5. Italiano B2B professionale, concreto, niente frasi vuote
6. NON includere CTA firma, password, meta-commenti sull'AI

Output: solo JSON.`;

  return {
    messages: [
      { role: "system" as const, content: system },
      { role: "user" as const, content: user }
    ]
  };
}
