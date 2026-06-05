import { describe, expect, it } from "vitest";
import { buildFallbackProposalDocument } from "@/lib/proposals/document-fallback";
import { documentToHtml } from "@/lib/proposals/document-to-html";
import {
  ensureDocumentPricingTotal,
  parseProposalDocumentJson
} from "@/lib/proposals/document-schema";

describe("parseProposalDocumentJson", () => {
  it("parses valid document JSON", () => {
    const json = JSON.stringify({
      version: 1,
      sections: [
        { type: "hero", title: "Test", lead: "Lead test" },
        { type: "kpis", items: [{ value: "1", label: "A" }, { value: "2", label: "B" }] },
        { type: "text", title: "Summary", paragraphs: ["P1"] },
        { type: "pricing", title: "Prezzi", rows: [{ description: "Voce", amount: "€ 100" }] },
        { type: "highlight", title: "Passi", items: ["Uno"] }
      ]
    });
    const doc = parseProposalDocumentJson(json);
    expect(doc?.version).toBe(1);
    expect(doc?.sections.length).toBeGreaterThanOrEqual(4);
  });
});

describe("ensureDocumentPricingTotal", () => {
  it("adds total row with budget", () => {
    const doc = buildFallbackProposalDocument({
      company: "Acme",
      sector: "Tech",
      notes: "",
      budget: 5000
    });
    const normalized = ensureDocumentPricingTotal(doc, 5000);
    const pricing = normalized.sections.find((s) => s.type === "pricing");
    expect(pricing?.type).toBe("pricing");
    if (pricing?.type === "pricing") {
      const total = pricing.rows.at(-1);
      expect(total?.description).toMatch(/totale/i);
      expect(total?.amount).toMatch(/5[.,]?000/);
    }
  });
});

describe("documentToHtml", () => {
  it("renders hero and pricing table", () => {
    const doc = buildFallbackProposalDocument({
      company: "Acme",
      sector: "Tech",
      notes: "Voce servizio € 1.000",
      budget: 3000
    });
    const html = documentToHtml(doc);
    expect(html).toMatch(/proposal-hero/);
    expect(html).toMatch(/pricing-table/);
    expect(html).toMatch(/total-row/);
  });
});
