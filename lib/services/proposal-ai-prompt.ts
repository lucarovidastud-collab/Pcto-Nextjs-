import { resolveProposalStyle } from "@/lib/proposals/styles";

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
  style?: string;
}) {
  const colors = input.palette.length ? input.palette : ["#0F766E", "#8B5CF6", "#F59E0B"];
  const notesBlock = truncateNotesForProposal(input.notes);
  const styleDef = resolveProposalStyle(input.style);
  const styleHint = input.styleDirection?.trim()
    ? `Direzione visiva dal sito cliente: ${input.styleDirection.trim()}`
    : "Direzione visiva: premium B2B, pulito, gerarchia chiara, impatto commerciale.";
  const toneHint = `Stile richiesto dal cliente — ${styleDef.promptHint} Adatta il TONO e il registro del copy a questo stile (l'aspetto grafico è gestito dall'app).`;

  const system = `Sei un direttore creativo e strategist B2B che progetta micro-siti di preventivo digitali in italiano.
Il tuo output è HTML semantico (fragment, senza <html>/<body>/<script>/<style>) che diventa una pagina commerciale premium — non un foglio Word minimalista.

Obiettivo: impressionare il decisore (effetto "wow"), dimostrare comprensione profonda del brief e giustificare l'investimento.
Modelli forti (GPT-4 class): sfrutta capacità di strutturare documenti lunghi in sezioni chiare e copy persuasivo.`;

  const user = `Cliente: ${input.company}
Settore: ${input.sector}
Budget totale vincolante: EUR ${input.budget} — riga "Totale investimento" = € ${input.budget.toLocaleString("it-IT")} (non modificare)
Palette brand (applicata automaticamente dall'app — NON usarla in stili inline): ${colors.join(", ")}
${styleHint}
${toneHint}

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

ESTETICA E LEGGIBILITÀ (priorità assoluta: effetto "wow" ma CHIARISSIMO da leggere):
- NON impostare colori, background o stili inline: pensa solo a struttura e contenuto. Brand, colori, numeri di sezione e accenti sono applicati AUTOMATICAMENTE dall'app
- Ogni sezione = una <section class="proposal-card"> con <h3> titolo BREVE (2–4 parole) + contenuto immediatamente scansionabile
- Apri ogni sezione con 1 frase introduttiva, poi entra nel dettaglio con liste o paragrafi corti (max 2–4 frasi)
- Per QUALSIASI elenco (deliverable, vincoli, voci, tecnologie) usa <ul class="scope-list">. Pattern consigliato per ogni voce: <li>**Termine chiave** — spiegazione sintetica</li> (il termine in **grassetto** diventa un'etichetta evidenziata)
- Alterna prosa e liste: VIETATI i muri di testo. Ogni sezione deve essere comprensibile in pochi secondi
- Sfrutta i blocchi visivi: proposal-kpi-grid (3–4 numeri chiave d'impatto), proposal-grid (2 colonne per confronti/ambiti), proposal-timeline (fasi numerate), proposal-highlight (prossimi passi)
- Niente tema dark, niente pulsanti/CTA/"Accetta Preventivo"/signature-box (la firma è gestita dall'app)

DOCUMENTI MOLTO LUNGHI (anche 100+ pagine): non incollare testo grezzo. Sintetizza per TEMI in sezioni nitide, tieni solo ciò che conta (obiettivi, deliverable, costi, tempi, condizioni). Meglio 12 sezioni chiare e dense di sostanza che 3 muri di testo.

QUALITÀ COPY:
- Italiano B2B, autorevole e concreto; niente frasi vuote ("soluzioni innovative" senza sostanza)
- Maiuscole corrette (no Title Case su ogni parola)
- Usa il **grassetto** SOLO per i termini chiave a inizio voce/frase (non interi paragrafi). Niente <strong>/<b>/<em>/<i> HTML: usa la sintassi markdown **testo**
- Non includere sezioni "Direzione stile" o meta-commenti sull'AI

Output: solo HTML del preventivo (le liste possono contenere **grassetto** markdown). Punta a 8–12 sezioni nitide e complete, ognuna facile da capire a colpo d'occhio.`;

  return {
    messages: [
      { role: "system" as const, content: system },
      { role: "user" as const, content: user }
    ]
  };
}
