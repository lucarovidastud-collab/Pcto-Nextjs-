import type { ProposalDocument, ProposalDocumentSection } from "@/lib/proposals/document-schema";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function emphasisToHtml(text: string) {
  return escapeHtml(text)
    .replace(/\*\*\*([^*\n]+?)\*\*\*/g, "<strong>$1</strong>")
    .replace(/\*\*([^*\n]+?)\*\*/g, "<strong>$1</strong>");
}

function sectionToHtml(section: ProposalDocumentSection, sectionIndex: number): string {
  const anchor = section.type === "hero" || section.type === "kpis" ? "" : ` id="sezione-${sectionIndex}"`;

  switch (section.type) {
    case "hero":
      return `<section class="proposal-hero"><h2>${emphasisToHtml(section.title)}</h2><p class="proposal-lead">${emphasisToHtml(section.lead)}</p></section>`;

    case "kpis":
      return `<div class="proposal-kpi-grid">${section.items
        .map(
          (item) =>
            `<div class="proposal-kpi"><span class="proposal-kpi-value">${emphasisToHtml(item.value)}</span><span class="proposal-kpi-label">${emphasisToHtml(item.label)}</span></div>`
        )
        .join("")}</div>`;

    case "text":
      return `<section class="proposal-card"${anchor}><h3>${emphasisToHtml(section.title)}</h3>${section.paragraphs
        .map((p) => `<p>${emphasisToHtml(p)}</p>`)
        .join("")}</section>`;

    case "list":
      return `<section class="proposal-card"${anchor}><h3>${emphasisToHtml(section.title)}</h3><ul class="scope-list">${section.items
        .map((item) =>
          item.lead
            ? `<li><strong>${emphasisToHtml(item.lead)}</strong> — ${emphasisToHtml(item.body)}</li>`
            : `<li>${emphasisToHtml(item.body)}</li>`
        )
        .join("")}</ul></section>`;

    case "timeline":
      return `<section class="proposal-card"${anchor}><h3>${emphasisToHtml(section.title)}</h3><ol class="proposal-timeline">${section.steps
        .map(
          (step) =>
            `<li><strong>${emphasisToHtml(step.title)}</strong><span>${emphasisToHtml(step.description)}</span></li>`
        )
        .join("")}</ol></section>`;

    case "pricing":
      return `<section class="proposal-card"${anchor}><h3>${emphasisToHtml(section.title)}</h3><div class="table-scroll"><table class="pricing-table"><thead><tr><th>Descrizione servizio</th><th>Importo</th></tr></thead><tbody>${section.rows
        .map((row) => {
          const isTotal = /^totale\b/i.test(row.description);
          const trClass = isTotal ? ' class="total-row"' : "";
          return `<tr${trClass}><td>${emphasisToHtml(row.description)}</td><td>${emphasisToHtml(row.amount || "")}</td></tr>`;
        })
        .join("")}</tbody></table></div></section>`;

    case "highlight":
      return `<section class="proposal-highlight"${anchor}><h3>${emphasisToHtml(section.title)}</h3><ul class="scope-list">${section.items
        .map((item) => `<li>${emphasisToHtml(item)}</li>`)
        .join("")}</ul></section>`;

    case "grid":
      return `<section class="proposal-card"${anchor}><h3>${emphasisToHtml(section.title)}</h3><div class="proposal-grid">${section.cards
        .map(
          (card) =>
            `<section class="proposal-card"><h3>${emphasisToHtml(card.title)}</h3><p>${emphasisToHtml(card.body)}</p></section>`
        )
        .join("")}</div></section>`;

    default:
      return "";
  }
}

/** Serializza il documento strutturato in HTML legacy (PDF, compat, stampa). */
export function documentToHtml(document: ProposalDocument): string {
  let navIndex = 0;
  return document.sections
    .map((section) => {
      if (section.type !== "hero" && section.type !== "kpis") navIndex += 1;
      return sectionToHtml(section, navIndex);
    })
    .filter(Boolean)
    .join("\n");
}
