const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || "";
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || "google/gemini-2.0-flash-001";

export async function generateProposalHtmlWithAI(input: {
  company: string;
  sector: string;
  notes: string;
  budget: number;
  palette: string[];
  styleDirection?: string;
}) {
  if (!OPENROUTER_API_KEY) return null;

  const [primary, secondary, tertiary] = input.palette;
  const prompt = `Sei un Senior Commercial Strategist.
Crea SOLO HTML interno (senza <html>/<body>) per preventivo di "${input.company}" settore "${input.sector}".
Appunti (sintetizza, NON copiare paragrafi lunghi): ${input.notes.slice(0, 1200)}
Budget target: EUR ${input.budget}
Palette brand: ${input.palette.join(", ")}
Direzione stile: ${input.styleDirection || "premium B2B"}

Regole:
- usa classi: proposal-card, proposal-grid, scope-list, pricing-table, total-row, signature-box, btn-glow
- applica colori brand inline dove utile: primary ${primary}, secondary ${secondary}, tertiary ${tertiary}
- titoli h3 con style="color:${primary}"
- bordi card con style="border-left:4px solid ${primary}"
- accessibilità: garantisci sempre testo leggibile (no testo bianco su sfondo chiaro, no testo nero su sfondo scuro)
- non impostare colori testo/sfondo inline su paragrafi e righe tabella; lascia colore di default e usa i colori brand solo per accenti (titoli, bordi, highlight leggeri)
- includi tabella prezzi e sezione firma con button "Accetta Preventivo"
- tono professionale B2B, frasi brevi, spazi dopo i punti`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 90_000);
  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.APP_URL || "https://quotegen.app",
        "X-Title": "QuoteGen Engine"
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        temperature: 0.4,
        messages: [{ role: "user", content: prompt }]
      })
    });
    if (!response.ok) return null;
    const payload = await response.json();
    let text = payload?.choices?.[0]?.message?.content || "";
    text = text.replace(/^```html\s*/i, "").replace(/```\s*$/i, "").trim();
    return text || null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
