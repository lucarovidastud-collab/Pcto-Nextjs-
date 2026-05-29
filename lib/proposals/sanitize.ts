import { formatReadableText } from "@/lib/utils/text";

export function sanitizeProposalHtml(html: string) {
  const spaced = html
    .replace(/\.([A-ZÀ-ÖØ-Þ])/g, ". $1")
    .replace(/\)([A-ZÀ-ÖØ-Þ])/g, ") $1");

  return spaced.replace(/>([^<]+)</g, (_, text: string) => {
    const cleaned = formatReadableText(text);
    return `>${cleaned}<`;
  });
}
