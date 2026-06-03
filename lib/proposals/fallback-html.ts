export function buildFallbackProposalHtml(input: {
  company: string;
  sector: string;
  notes: string;
  budget: number;
  palette: string[];
}) {
  const normalizedNotes = input.notes.replace(/\.([A-ZÀ-ÖØ-Þ])/g, ". $1");
  const lines = normalizedNotes
    .split(/\n+|(?<=[.!?])\s+/)
    .map((line) => line.trim())
    .filter((line) => line.length > 12)
    .slice(0, 6);

  const scopeItems = lines.length
    ? lines.map((line) => `<li>${escapeHtml(line)}</li>`).join("")
    : `<li>Analisi esigenze e obiettivi business</li><li>Proposta tecnica e commerciale personalizzata</li><li>Timeline e deliverable definiti</li>`;

  const primary = input.palette[0] || "#0F766E";
  const secondary = input.palette[1] || primary;
  const design = Math.round(input.budget * 0.28);
  const build = Math.round(input.budget * 0.46);
  const qa = input.budget - design - build;

  return `
    <section class="proposal-card" style="border-left:4px solid ${primary}">
      <h3 style="color:${primary}">Obiettivo strategico</h3>
      <p>Supportare <strong>${escapeHtml(input.company)}</strong> nel settore <strong>${escapeHtml(input.sector)}</strong> con una proposta digitale chiara, orientata alla conversione e coerente con l'identita visiva del brand.</p>
    </section>
    <section class="proposal-card" style="border-left:4px solid ${secondary}">
      <h3 style="color:${primary}">Scope operativo</h3>
      <ul class="scope-list">${scopeItems}</ul>
    </section>
    <section class="proposal-card" style="border-left:4px solid ${primary}">
      <h3 style="color:${primary}">Stima economica</h3>
      <div class="table-scroll">
        <table class="pricing-table">
          <thead><tr><th>Voce</th><th>Dettaglio</th><th>Importo</th></tr></thead>
          <tbody>
            <tr><td>Design & Brand</td><td>UI, UX, identita visiva</td><td>€ ${design.toLocaleString("it-IT")}</td></tr>
            <tr><td>Sviluppo & Automazioni</td><td>Implementazione e integrazioni</td><td>€ ${build.toLocaleString("it-IT")}</td></tr>
            <tr><td>QA & Go-live</td><td>Test, sicurezza, rilascio</td><td>€ ${qa.toLocaleString("it-IT")}</td></tr>
            <tr class="total-row" style="background:color-mix(in srgb, ${primary} 12%, transparent)"><td colspan="2"><strong>Totale investimento</strong></td><td><strong style="color:${primary}">€ ${input.budget.toLocaleString("it-IT")}</strong></td></tr>
          </tbody>
        </table>
      </div>
    </section>
    <section class="signature-box" style="border-color:${primary}">
      <h3 style="color:${primary}">Accettazione formale</h3>
      <p>Confermando l'accettazione, il cliente autorizza l'avvio del progetto secondo le condizioni indicate.</p>
      <button class="btn-glow" type="button">Accetta Preventivo</button>
    </section>
  `;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
