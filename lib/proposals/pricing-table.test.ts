import { describe, expect, it } from "vitest";
import {
  extractPricingRowsFromText,
  normalizeProposalPricingTable
} from "@/lib/proposals/pricing-table";

describe("pricing table normalize", () => {
  it("parses smashed euro lines into rows", () => {
    const text =
      "Analisi e Progettazione (DP25097)€ 8.000Sviluppo sito istituzionale€ 12.000Totale investimento€ 47.000";
    const rows = extractPricingRowsFromText(text);
    expect(rows).toHaveLength(2);
    expect(rows[0]?.amount).toBe(8000);
    expect(rows[1]?.amount).toBe(12000);
  });

  it("rebuilds broken table with thead after tbody", () => {
    const html = `<h3>Dettaglio Economico</h3>
<table class="pricing-table">
<tbody><tr><td>Analisi€ 8.000Sviluppo€ 12.000Totale investimento€ 47.000</td></tr></tbody>
<thead><tr><th>DESCRIZIONE</th><th>COSTO</th></tr></thead>
</table>
<p>per accettazione, cliccare sul pulsante.</p>
<p>Accetta Preventivo</p>`;

    const out = normalizeProposalPricingTable(html, 47000);
    expect(out.indexOf("<thead")).toBeLessThan(out.indexOf("<tbody"));
    expect(out.match(/<tr\b/gi)?.length).toBeGreaterThan(2);
    expect(out).toContain("Analisi");
    expect(out).toMatch(/8[.,]?000/);
  });
});
