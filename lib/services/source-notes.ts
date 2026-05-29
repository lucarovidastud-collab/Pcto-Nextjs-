import { formatReadableText } from "@/lib/utils/text";

export async function resolveNotesFromUploadedFile(file: File) {
  if (!file) throw new Error("File mancante");
  if (file.size > 8 * 1024 * 1024) throw new Error("File troppo grande");

  const name = (file.name || "").toLowerCase();
  const type = (file.type || "").toLowerCase();
  const data = new Uint8Array(await file.arrayBuffer());

  if (type.includes("application/pdf") || name.endsWith(".pdf")) {
    const text = await extractPdfText(data);
    return truncateForPrompt(formatReadableText(text));
  }

  if (
    type.includes("application/vnd.openxmlformats-officedocument.wordprocessingml.document") ||
    name.endsWith(".docx")
  ) {
    const text = await extractDocxText(data);
    return truncateForPrompt(formatReadableText(text));
  }

  const decoded = new TextDecoder("utf-8").decode(data);
  if (type.includes("text/html") || /<\/(html|body)>/i.test(decoded)) {
    return truncateForPrompt(formatReadableText(stripHtmlToText(decoded)));
  }

  return truncateForPrompt(formatReadableText(decoded));
}

async function extractPdfText(data: Uint8Array) {
  const [mod, worker] = await Promise.all([
    import("pdfjs-dist/legacy/build/pdf.mjs"),
    import("pdfjs-dist/legacy/build/pdf.worker.mjs")
  ]);
  const pdfjs: any = (mod as any).default || mod;
  (globalThis as any).pdfjsWorker = worker as any;
  const loadingTask = pdfjs.getDocument({ data, disableWorker: true });
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

async function extractDocxText(data: Uint8Array) {
  const mammoth = await import("mammoth");
  let arrayBuffer: ArrayBuffer;
  if (data.buffer instanceof ArrayBuffer) {
    arrayBuffer = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
  } else {
    arrayBuffer = new ArrayBuffer(data.byteLength);
    new Uint8Array(arrayBuffer).set(data);
  }
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value || "";
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
