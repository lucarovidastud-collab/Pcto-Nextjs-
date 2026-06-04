/** Allinea la riga totale della tabella prezzi al budget calcolato. */
export function ensurePricingTableTotal(html: string, budget: number): string {
  if (!html || !Number.isFinite(budget) || budget <= 0) return html;

  const formatted = `€ ${Math.round(budget).toLocaleString("it-IT")}`;
  const totalRowRe =
    /(<tr[^>]*\btotal-row\b[^>]*>[\s\S]*?<td[^>]*>[\s\S]*?<\/td>\s*<td[^>]*>[\s\S]*?<\/td>\s*<td[^>]*>)([\s\S]*?)(<\/td>)/i;

  if (totalRowRe.test(html)) {
    return html.replace(totalRowRe, `$1${formatted}$3`);
  }

  return html;
}
