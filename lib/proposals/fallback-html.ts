import {
  buildPricingTableHtml,
  extractPricingRowsFromText
} from "@/lib/proposals/pricing-table";

export function buildFallbackProposalHtml(input: {
  company: string;
  sector: string;
  notes: string;
  budget: number;
  palette: string[];
}) {
  const primary = input.palette[0] || "#0F766E";
  const secondary = input.palette[1] || primary;
  const sectorLabel = briefSectorLabel(input.sector);
  const company = escapeHtml(input.company);

  const scopeBlocks = buildScopeBlocks(input.notes);
  const pricingRows = extractPricingRowsFromText(input.notes);
  const pricingSection =
    pricingRows.length >= 2
      ? buildPricingTableHtml(pricingRows, input.budget)
      : buildDefaultPricingTable(input.budget, primary);

  return `
<section class="proposal-hero">
  <h2>Preventivo per ${company}</h2>
  <p class="proposal-lead">Proposta commerciale per ${company} nel contesto ${escapeHtml(sectorLabel)}. Il documento riassume obiettivi, ambito operativo, investimento e prossimi passi per l'avvio del progetto.</p>
</section>
<div class="proposal-kpi-grid">
  <div class="proposal-kpi"><span class="proposal-kpi-value">€ ${input.budget.toLocaleString("it-IT")}</span><span class="proposal-kpi-label">Investimento</span></div>
  <div class="proposal-kpi"><span class="proposal-kpi-value">${pricingRows.length || 3}</span><span class="proposal-kpi-label">Voci principali</span></div>
  <div class="proposal-kpi"><span class="proposal-kpi-value">B2B</span><span class="proposal-kpi-label">Focus commerciale</span></div>
</div>
<section class="proposal-card" style="border-left:4px solid ${primary}">
  <h3 style="color:${primary}">Executive summary</h3>
  <p>Questa proposta definisce come supportare ${company} con un percorso strutturato: analisi, progettazione, realizzazione e messa online, allineati alle esigenze emerse dal materiale fornito.</p>
</section>
<section class="proposal-card" style="border-left:4px solid ${secondary}">
  <h3 style="color:${primary}">Ambito e deliverable</h3>
  ${scopeBlocks}
</section>
<section class="proposal-card" style="border-left:4px solid ${primary}">
  <h3 style="color:${primary}">Dettaglio economico</h3>
  ${pricingSection}
</section>
<section class="proposal-highlight">
  <h3 style="color:${primary}">Prossimi passi</h3>
  <ul class="scope-list">
    <li>Allineamento finale su priorità e tempistiche</li>
    <li>Conferma dell'investimento e avvio progetto</li>
    <li>Kick-off operativo con referenti ${company}</li>
  </ul>
</section>`;
}

function briefSectorLabel(sector: string) {
  const s = sector.replace(/\s+/g, " ").trim();
  if (s.length <= 72 && !/proposta per|realizzazione di un nuovo/i.test(s)) return s;
  return "e-commerce e presenza digitale B2B";
}

function buildScopeBlocks(notes: string) {
  const normalized = notes.replace(/\.([A-ZÀ-ÖØ-Þ])/g, ". $1");
  const lines = normalized
    .split(/\n+|(?<=[.!?])\s+/)
    .map((line) => line.trim())
    .filter((line) => line.length > 20 && line.length < 280)
    .filter((line) => !/^(spett\.|p\.iva|tel\.|fax|via |corso )/i.test(line))
    .slice(0, 8);

  if (!lines.length) {
    return `<ul class="scope-list">
      <li>Analisi esigenze e obiettivi business</li>
      <li>Proposta tecnica e commerciale personalizzata</li>
      <li>Timeline e deliverable definiti</li>
    </ul>`;
  }

  return `<ul class="scope-list">${lines.map((line) => `<li>${escapeHtml(line)}</li>`).join("")}</ul>`;
}

function buildDefaultPricingTable(budget: number, primary: string) {
  const design = Math.round(budget * 0.28);
  const build = Math.round(budget * 0.46);
  const qa = budget - design - build;

  return `<div class="table-scroll">
    <table class="pricing-table">
      <thead><tr><th>Descrizione servizio</th><th>Importo</th></tr></thead>
      <tbody>
        <tr><td>Design &amp; UX</td><td>€ ${design.toLocaleString("it-IT")}</td></tr>
        <tr><td>Sviluppo &amp; integrazioni</td><td>€ ${build.toLocaleString("it-IT")}</td></tr>
        <tr><td>QA &amp; go-live</td><td>€ ${qa.toLocaleString("it-IT")}</td></tr>
        <tr class="total-row"><td>Totale investimento</td><td>€ ${budget.toLocaleString("it-IT")}</td></tr>
      </tbody>
    </table>
  </div>`;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
