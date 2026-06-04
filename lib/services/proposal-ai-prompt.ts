/** Testo estratto da PDF/DOCX inviato al modello generativo (preventivi lunghi). */
/** Bilanciato per latenza su Vercel + modelli flash (evita timeout → fallback). */
export const PROPOSAL_NOTES_MAX_CHARS = 20_000;

const PROPOSAL_HTML_CLASSES = [
  "proposal-hero",
  "proposal-lead",
  "proposal-kpi-grid",
  "proposal-kpi",
  "proposal-card",
  "proposal-grid",
  "proposal-highlight",
  "proposal-timeline",
  "scope-list",
  "pricing-table",
  "total-row",
  "proposal-divider"
] as const;

export function truncateNotesForProposal(notes: string) {
  if (notes.length <= PROPOSAL_NOTES_MAX_CHARS) return notes;
  const head = notes.slice(0, Math.floor(PROPOSAL_NOTES_MAX_CHARS * 0.7));
  const tail = notes.slice(-Math.floor(PROPOSAL_NOTES_MAX_CHARS * 0.25));
  return `${head}\n\n[... sezioni centrali omesse per limite token — sintetizza comunque tutti i temi rilevati ...]\n\n${tail}`;
}

export function buildProposalAiMessages(input: {
  company: string;
  sector: string;
  notes: string;
  budget: number;
  palette: string[];
  styleDirection?: string;
}) {
  const [primary, secondary, tertiary] = input.palette;
  const notesBlock = truncateNotesForProposal(input.notes);
  const styleHint = input.styleDirection?.trim()
    ? `Direzione visiva dal sito cliente: ${input.styleDirection.trim()}`
    : "Direzione visiva: premium B2B, pulito, gerarchia chiara, impatto commerciale.";

  const system = `Sei un direttore creativo e strategist B2B che progetta micro-siti di preventivo digitali in italiano.
Il tuo output è HTML semantico (fragment, senza <html>/<body>/<script>/<style>) che diventa una pagina commerciale premium — non un foglio Word minimalista.

Obiettivo: impressionare il decisore (effetto "wow"), dimostrare comprensione profonda del brief e giustificare l'investimento.
Modelli forti (GPT-4 class): sfrutta capacità di strutturare documenti lunghi in sezioni chiare e copy persuasivo.`;

  const user = `Cliente: ${input.company}
Settore: ${input.sector}
Budget totale vincolante: EUR ${input.budget} — riga "Totale investimento" = € ${input.budget.toLocaleString("it-IT")} (non modificare)
Palette brand: primary ${primary}, secondary ${secondary}, tertiary ${tertiary}
${styleHint}

--- MATERIALE SORGENTE (PDF/appunti del cliente, può essere molto lungo) ---
${notesBlock}
--- FINE MATERIALE ---

ISTRUZIONI DI LAVORO:
1. Leggi tutto il materiale: anche 15–20 pagine vanno distillate in un preventivo COMPLETO, non in due righe.
2. Estrai e usa: obiettivi, vincoli, deliverable, tempistiche, voci di costo, tecnologie, team, condizioni commerciali citate.
3. Se il PDF elenca voci/prezzi, riportale nella tabella; se mancano dettagli, proponi voci realistiche coerenti col settore che sommano al budget.
4. Non copiare paragrafi interi grezzi: riscrivi in italiano professionale, ma con profondità (più paragrafi e punti elenco dove serve).

STRUTTURA OBBLIGATORIA (usa queste classi CSS: ${PROPOSAL_HTML_CLASSES.join(", ")}):

A) <section class="proposal-hero"> — titolo h2 con nome cliente, <p class="proposal-lead"> (4–6 frasi) valore e risultato atteso
B) <div class="proposal-kpi-grid"> con 3–4 <div class="proposal-kpi"> ciascuno con <span class="proposal-kpi-value">valore</span> e <span class="proposal-kpi-label">etichetta</span>
C) <section class="proposal-card"> Executive summary (h3 + 2–3 paragrafi)
D) <section class="proposal-card"> Contesto e sfide del cliente
E) <section class="proposal-card"> Soluzione proposta (approccio, metodologia, perché funziona)
F) <div class="proposal-grid"> con 2+ <section class="proposal-card">: Ambito & deliverable | Tecnologie & integrazioni (liste scope-list)
G) <section class="proposal-card"> Piano operativo / timeline (ol class="proposal-timeline" o tabella fasi)
H) <hr class="proposal-divider">
I) <section class="proposal-card"> Dettaglio economico — tabella HTML rigorosa:
   <div class="table-scroll"><table class="pricing-table"><thead><tr><th>Descrizione servizio</th><th>Importo</th></tr></thead><tbody>
   una <tr> per voce, ultima <tr class="total-row"><td>Totale investimento</td><td>€ ...</td></tr></tbody></table></div>
J) <section class="proposal-card"> Condizioni (pagamenti, validità offerta, IP, esclusioni se presenti nel sorgente)
K) <section class="proposal-highlight"> Prossimi passi (3–5 punti concreti)
L) Opzionale: Rischi & mitigazioni, KPI di successo, supporto post go-live — se pertinenti dal PDF

ESTETICA (senza rompere il tema chiaro del sito):
- Impatto visivo tramite gerarchia (h2, h3), griglia proposal-grid, hero e KPI — non minimalismo vuoto
- Accenti brand: h3 style="color:${primary}"; card style="border-left:4px solid ${primary}" (o secondary per variare)
- VIETATO: background/background-color su p, li, td, div; niente tema dark; niente color inline su paragrafi
- Niente pulsanti, link CTA, "Accetta Preventivo", signature-box (firma gestita dall'app)

QUALITÀ COPY:
- Italiano B2B, tono autorevole e caldo; frasi complete; evita generiche vuote ("soluzioni innovative" senza sostanza)
- Maiuscole corrette (no Title Case su ogni parola); no Lei cerimonioso distorto (presentarvi ok minuscolo)
- No <strong>/<b>/<em>/<i>
- Non includere sezioni "Direzione stile" o meta-commenti sull'AI

Output: solo HTML del preventivo, minimo 10 sezioni sostanziali se il sorgente lo consente.`;

  return {
    messages: [
      { role: "system" as const, content: system },
      { role: "user" as const, content: user }
    ]
  };
}
