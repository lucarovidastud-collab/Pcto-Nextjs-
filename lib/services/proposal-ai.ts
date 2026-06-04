import { getOpenRouterConfig, openRouterChatCompletion } from "@/lib/services/openrouter-client";

export async function generateProposalHtmlWithAI(input: {
  company: string;
  sector: string;
  notes: string;
  budget: number;
  palette: string[];
  styleDirection?: string;
}) {
  if (!getOpenRouterConfig().apiKey) return null;

  const [primary, secondary, tertiary] = input.palette;
  const prompt = `Sei un Senior Commercial Strategist che scrive preventivi B2B in italiano.
Crea SOLO HTML interno (senza <html>/<body>) per il preventivo di "${input.company}" settore "${input.sector}".
Appunti (sintetizza, NON copiare paragrafi lunghi): ${input.notes.slice(0, 1200)}
Budget totale OBBLIGATORIO: EUR ${input.budget} (la riga "Totale investimento" nella tabella prezzi deve mostrare esattamente € ${input.budget.toLocaleString("it-IT")})
Palette brand: ${input.palette.join(", ")}

Regole:
- usa classi: proposal-card, proposal-grid, scope-list, pricing-table, total-row
- applica colori brand SOLO su titoli h3: style="color:${primary}" e bordi card style="border-left:4px solid ${primary}"
- VIETATO: background, background-color, bgcolor su qualsiasi tag; VIETATO color inline su p, li, td, span, div, section
- il documento ha sfondo chiaro fisso: non usare box scuri, temi dark, highlight con sfondo colorato o testo chiaro
- paragrafi e liste senza attributo style (il CSS del sito gestisce leggibilità)
- includi SOLO tabella prezzi HTML valida: <table class="pricing-table"><thead><tr><th>Descrizione servizio</th><th>Importo</th></tr></thead><tbody> con UNA <tr> per ogni voce (due <td>), poi <tr class="total-row"> per il totale
- NON includere pulsanti, link, signature-box, testo "Accetta Preventivo" o istruzioni di firma (la firma è nel modulo sotto il documento)
- le voci della tabella devono essere coerenti e la somma deve corrispondere al budget totale indicato sopra
- se negli appunti c'è un importo totale, usa quello nella riga totale senza modificarlo
- NON includere sezioni intitolate "Direzione Stile", "Stile", "Style Direction" o simili
- tono professionale B2B formale, frasi brevi, spazi dopo i punti
- usa sempre la forma verbale di terza persona o infinito (es. "siamo lieti di presentare"), MAI il Lei maiuscolo reverenziale (no "presentarVi", "VostRA", "LeI" con maiuscole interne)
- NON usare <strong>, <b>, <em> o <i>: tutto il testo deve essere peso normale
- maiuscole in italiano: solo inizio frase e nomi propri; NON usare Title Case su ogni parola (es. scrivi "gamma prodotti tutti i" non "Gamma Prodotti Tutti I")
- sintetizza gli appunti in 4-6 frasi brevi per sezione, non elencare cataloghi o liste lunghe copiate dal documento`;

  const result = await openRouterChatCompletion({
    messages: [{ role: "user", content: prompt }],
    temperature: 0.4,
    maxTokens: 4000,
    timeoutMs: 90_000
  });

  if (!result.ok) return null;

  const text = result.content.replace(/^```html\s*/i, "").replace(/```\s*$/i, "").trim();
  return text || null;
}
