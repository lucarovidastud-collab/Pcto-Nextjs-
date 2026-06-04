import { parseItalianAmount } from "@/lib/services/budget-from-notes";

export type PricingRow = { label: string; amount: number };

/** Allinea la riga totale della tabella prezzi al budget calcolato. */
export function ensurePricingTableTotal(html: string, budget: number): string {
  if (!html || !Number.isFinite(budget) || budget <= 0) return html;

  const formatted = `€ ${Math.round(budget).toLocaleString("it-IT")}`;
  const totalRowRe =
    /(<tr[^>]*\btotal-row\b[^>]*>[\s\S]*?<td[^>]*>[\s\S]*?<\/td>\s*<td[^>]*>[\s\S]*?<\/td>\s*<td[^>]*>)([\s\S]*?)(<\/td>)/i;

  if (totalRowRe.test(html)) {
    return html.replace(totalRowRe, `$1${formatted}$3`);
  }

  const twoColTotalRe =
    /(<tr[^>]*\btotal-row\b[^>]*>[\s\S]*?<td[^>]*>[\s\S]*?<\/td>\s*<td[^>]*>)([\s\S]*?)(<\/td>)/i;
  if (twoColTotalRe.test(html)) {
    return html.replace(twoColTotalRe, `$1${formatted}$3`);
  }

  return html;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function htmlToPlainText(fragment: string) {
  return fragment
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(?:p|div|li|tr|h[1-6])>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function extractPricingRowsFromText(text: string): PricingRow[] {
  const rows: PricingRow[] = [];
  const re = /(.+?)\s*€\s*(\d{1,3}(?:\.\d{3})*(?:,\d{1,2})?|\d{1,8}(?:,\d{1,2})?)/gi;
  let match: RegExpExecArray | null;

  while ((match = re.exec(text))) {
    const label = match[1].trim().replace(/^[\s:;.-]+|[\s:;.-]+$/g, "");
    if (label.length < 3) continue;
    if (/^totale\b/i.test(label)) continue;

    const amount = parseItalianAmount(match[2]);
    if (amount === null || amount <= 0) continue;

    rows.push({ label, amount: Math.round(amount) });
  }

  return rows;
}

function isPricingTableBroken(tableHtml: string) {
  const trCount = (tableHtml.match(/<tr\b/gi) || []).length;
  const euroInSingleCell = /<t[dh][^>]*>[^<]*€[^<]{8,}€/i.test(tableHtml);
  const theadAfterTbody = /<tbody[\s\S]*<thead/i.test(tableHtml);
  const singleRowManyEuros =
    trCount <= 2 && (tableHtml.match(/€/g) || []).length >= 3;

  return trCount < 2 || euroInSingleCell || theadAfterTbody || singleRowManyEuros;
}

function fixTableHeadOrder(tableHtml: string) {
  const thead = tableHtml.match(/<thead\b[\s\S]*?<\/thead>/i)?.[0];
  const tbody = tableHtml.match(/<tbody\b[\s\S]*?<\/tbody>/i)?.[0];
  if (!thead || !tbody) return tableHtml;

  if (tableHtml.indexOf(thead) > tableHtml.indexOf(tbody)) {
    const without = tableHtml.replace(thead, "").replace(tbody, "");
    return `${thead}${tbody}${without}`;
  }
  return tableHtml;
}

export function buildPricingTableHtml(rows: PricingRow[], budget: number) {
  const lineRows = rows
    .filter((r) => !/totale\s+investimento/i.test(r.label))
    .map(
      (r) =>
        `<tr><td>${escapeHtml(r.label)}</td><td>€ ${r.amount.toLocaleString("it-IT")}</td></tr>`
    )
    .join("");

  const total = `€ ${Math.round(budget).toLocaleString("it-IT")}`;

  return `<div class="table-scroll"><table class="pricing-table">
<thead><tr><th>Descrizione servizio</th><th>Importo</th></tr></thead>
<tbody>
${lineRows}
<tr class="total-row"><td>Totale investimento</td><td>${total}</td></tr>
</tbody>
</table></div>`;
}

function replaceTableInner(html: string, tableMatch: string, rows: PricingRow[], budget: number) {
  const rebuilt = buildPricingTableHtml(rows, budget);
  if (/<div[^>]*class="[^"]*table-scroll/i.test(tableMatch)) {
    return html.replace(tableMatch, rebuilt);
  }
  return html.replace(tableMatch, rebuilt);
}

function tableTextForExtraction(tableHtml: string) {
  const tbody = tableHtml.match(/<tbody\b[\s\S]*?<\/tbody>/i)?.[0];
  const source = tbody ?? tableHtml;
  return htmlToPlainText(source).replace(
    /descrizione\s+servizio|costo\s+unitario|importo/gi,
    " "
  );
}

function rebuildTableFromFragment(tableHtml: string, budget: number) {
  const rows = extractPricingRowsFromText(tableTextForExtraction(tableHtml));
  if (rows.length < 2) return null;
  return buildPricingTableHtml(rows, budget);
}

/**
 * Ripara tabelle prezzi generate male dall'AI (testo tutto attaccato, thead sotto il tbody).
 */
export function normalizeProposalPricingTable(html: string, budget: number): string {
  if (!html || !Number.isFinite(budget) || budget <= 0) return html;

  let result = html.replace(/<table\b[\s\S]*?<\/table>/gi, (tableHtml) => {
    const isPricing =
      /\bpricing-table\b/i.test(tableHtml) ||
      /dettaglio\s+economico/i.test(tableHtml) ||
      (tableHtml.match(/€/g) || []).length >= 2;

    if (!isPricing) {
      return fixTableHeadOrder(tableHtml);
    }

    const fixedOrder = fixTableHeadOrder(tableHtml);
    if (!isPricingTableBroken(fixedOrder)) {
      return fixedOrder;
    }

    const rebuilt = rebuildTableFromFragment(fixedOrder, budget);
    return rebuilt ?? fixedOrder;
  });

  const economicoBlockRe =
    /(<h3[^>]*>[\s\S]*?dettaglio\s+economico[\s\S]*?)(?=<h3\b|<section\b[^>]*\bproposal-card|$)/i;
  const economicoMatch = result.match(economicoBlockRe);
  if (economicoMatch) {
    const block = economicoMatch[1];
    const hasGoodTable =
      /<table\b[\s\S]*?<\/table>/i.test(block) &&
      !isPricingTableBroken(block.match(/<table\b[\s\S]*?<\/table>/i)?.[0] || "");

    if (!hasGoodTable) {
      const rows = extractPricingRowsFromText(htmlToPlainText(block));
      if (rows.length >= 2) {
        const tableOnly = buildPricingTableHtml(rows, budget);
        const heading = block.match(/<h3[^>]*>[\s\S]*?<\/h3>/i)?.[0] || "<h3>Dettaglio economico</h3>";
        const card = `<section class="proposal-card">${heading}${tableOnly}</section>`;
        result = result.replace(block, card);
      }
    }
  }

  return result;
}
