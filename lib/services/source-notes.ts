import { formatReadableText } from "@/lib/utils/text";

export async function resolveNotesFromSourceUrl(inputUrl: string) {
  const url = normalizeHttpUrl(inputUrl);
  const response = await fetch(url, { redirect: "follow" });
  if (!response.ok) {
    throw new Error(`Impossibile scaricare il documento (${response.status})`);
  }

  const contentType = (response.headers.get("content-type") || "").toLowerCase();
  const data = await readResponseWithLimit(response, 8 * 1024 * 1024);

  if (contentType.includes("application/pdf") || url.toLowerCase().endsWith(".pdf")) {
    const text = await extractPdfText(data);
    const cleaned = formatReadableText(text);
    return truncateForPrompt(cleaned);
  }

  const decoded = new TextDecoder("utf-8").decode(data);

  if (contentType.includes("text/html") || /<\/(html|body)>/i.test(decoded)) {
    const stripped = stripHtmlToText(decoded);
    const cleaned = formatReadableText(stripped);
    return truncateForPrompt(cleaned);
  }

  return truncateForPrompt(formatReadableText(decoded));
}

function normalizeHttpUrl(input: string) {
  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    throw new Error("Link non valido");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Link non valido");
  }
  return url.toString();
}

async function readResponseWithLimit(response: Response, limitBytes: number) {
  if (!response.body) {
    return new Uint8Array();
  }
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;
    received += value.length;
    if (received > limitBytes) {
      throw new Error("Documento troppo grande");
    }
    chunks.push(value);
  }
  const out = new Uint8Array(received);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.length;
  }
  return out;
}

async function extractPdfText(data: Uint8Array) {
  const mod = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const pdfjs: any = (mod as any).default || mod;
  const loadingTask = pdfjs.getDocument({ data });
  const doc = await loadingTask.promise;
  const pages: string[] = [];
  for (let pageNumber = 1; pageNumber <= doc.numPages; pageNumber += 1) {
    const page = await doc.getPage(pageNumber);
    const content = await page.getTextContent();
    const parts = (content.items || []).map((item: any) => (typeof item?.str === "string" ? item.str : ""));
    pages.push(parts.join(" "));
  }
  return pages.join("\n");
}

function stripHtmlToText(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function truncateForPrompt(value: string, maxChars = 12000) {
  if (value.length <= maxChars) return value;
  return value.slice(0, maxChars).trim();
}
