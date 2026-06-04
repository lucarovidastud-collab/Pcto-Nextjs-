import { describe, expect, it } from "vitest";
import { sanitizeProposalHtml, sanitizeInlineStyle } from "@/lib/proposals/sanitize";

describe("sanitizeProposalHtml", () => {
  it("removes dark backgrounds from sections", () => {
    const html =
      '<section style="background:#000;color:#111"><p style="color:#000">Testo</p></section>';
    const out = sanitizeProposalHtml(html);
    expect(out).not.toMatch(/background/i);
    expect(out).toContain("Testo");
  });

  it("keeps brand color on headings when readable", () => {
    const html = '<h3 style="color:#0D9488;border-left:4px solid #0D9488">Titolo</h3>';
    const out = sanitizeProposalHtml(html);
    expect(out).toMatch(/color:\s*#0D9488/i);
  });

  it("removes duplicate acceptance UI", () => {
    const html =
      '<section class="signature-box"><button>Accetta Preventivo</button></section><p>per accettazione, cliccare sul pulsante.</p><p>Accetta Preventivo</p>';
    const out = sanitizeProposalHtml(html);
    expect(out).not.toMatch(/accetta\s+preventivo/i);
    expect(out).not.toMatch(/signature-box/i);
  });

  it("strips color on paragraphs", () => {
    const html = '<p style="color:#000;background:#111">Corpo</p>';
    const out = sanitizeProposalHtml(html);
    expect(out).not.toMatch(/color:\s*#000/i);
    expect(out).not.toMatch(/background/i);
  });
});

describe("sanitizeInlineStyle", () => {
  it("drops all background properties", () => {
    expect(sanitizeInlineStyle("background:#000;color:#fff")).toBe("");
    expect(sanitizeInlineStyle("background-color: black")).toBe("");
  });
});
