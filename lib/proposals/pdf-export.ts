import { jsPDF } from "jspdf";
import { formatReadableText } from "@/lib/utils/text";

export type ProposalPdfInput = {
  id: string;
  company: string;
  sector: string;
  budget: number;
  status: string;
  expiresAt: string;
  notes: string;
  generatedHtml: string;
};

/** Caratteri tipici dell'AI/HTML che Helvetica (jsPDF) non renderizza bene. */
export function normalizePdfText(value: string): string {
  return value
    .normalize("NFC")
    .replace(/\r\n/g, "\n")
    .replace(/[\u2018\u2019\u201A\u2032]/g, "'")
    .replace(/[\u201C\u201D\u201E\u2033]/g, '"')
    .replace(/[\u2013\u2014\u2212]/g, "-")
    .replace(/[\u2022\u2023\u25AA\u25CF\u25E6\u2027\u00B7]/g, "- ")
    .replace(/\u2026/g, "...")
    .replace(/\u00A0/g, " ")
    .replace(/\u20AC/g, "EUR ")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/[^\t\n\r\u0020-\u024F]/g, (char) => {
      // Mantieni lettere accentate latine; sostituisci il resto
      if (/[\u0300-\u036f]/.test(char)) return "";
      const fallback: Record<number, string> = {
        0x0152: "OE",
        0x0153: "oe",
        0x0178: "Y"
      };
      return fallback[char.charCodeAt(0)] ?? "";
    })
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

export function htmlToPlainTextForPdf(html: string): string {
  let text = html
    .replace(/<script\b[\s\S]*?<\/script>/gi, "")
    .replace(/<style\b[\s\S]*?<\/style>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|section|article|blockquote)>/gi, "\n")
    .replace(/<\/h[1-6]>/gi, "\n\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<li[^>]*>/gi, "- ")
    .replace(/<\/tr>/gi, "\n")
    .replace(/<t[hd][^>]*>/gi, "")
    .replace(/<\/t[hd]>/gi, " | ")
    .replace(/<button[^>]*>[\s\S]*?<\/button>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));

  return normalizePdfText(text);
}

export function resolveProposalPdfBody(input: ProposalPdfInput): string {
  const html = input.generatedHtml?.trim();
  if (html && /<[a-z][\s\S]*>/i.test(html)) {
    return htmlToPlainTextForPdf(html);
  }
  return normalizePdfText(formatReadableText(input.notes || ""));
}

function formatExpiry(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("it-IT", { day: "2-digit", month: "long", year: "numeric" });
}

export function buildProposalPdfBuffer(input: ProposalPdfInput): Buffer {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const marginX = 14;
  const maxWidth = 182;
  let y = 20;

  const addLine = (line: string, opts?: { size?: number; bold?: boolean; gap?: number }) => {
    if (!line.trim()) {
      y += 4;
      return;
    }
    const size = opts?.size ?? 10;
    const gap = opts?.gap ?? (size >= 14 ? 8 : 6);
    doc.setFontSize(size);
    doc.setFont("helvetica", opts?.bold ? "bold" : "normal");
    const wrapped = doc.splitTextToSize(line, maxWidth) as string[];
    for (const part of wrapped) {
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
      doc.text(part, marginX, y);
      y += gap;
    }
  };

  addLine(`Preventivo - ${normalizePdfText(input.company)}`, { size: 18, bold: true });
  y += 2;

  doc.setFontSize(10);
  addLine(`Settore: ${normalizePdfText(input.sector)}`);
  addLine(`Budget: EUR ${Number(input.budget).toLocaleString("it-IT")}`);
  addLine(`Stato: ${input.status}`);
  addLine(`Scadenza link: ${formatExpiry(input.expiresAt)}`);
  y += 4;

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  addLine("Contenuto preventivo", { size: 11, bold: true });
  y += 2;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const body = resolveProposalPdfBody(input).slice(0, 12000);
  for (const paragraph of body.split(/\n{2,}/)) {
    const lines = paragraph.split(/\n/).map((l) => l.trim()).filter(Boolean);
    for (const line of lines) {
      addLine(line);
    }
    y += 2;
  }

  return Buffer.from(doc.output("arraybuffer"));
}
