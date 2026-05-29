import { formatReadableText } from "@/lib/utils/text";

export function sanitizeProposalHtml(html: string) {
  const cleanedStyles = html.replace(/style="([^"]*)"/gi, (_, styleText: string) => {
    const sanitized = sanitizeInlineStyle(styleText);
    if (!sanitized) return "";
    return `style="${sanitized}"`;
  });

  const spaced = cleanedStyles
    .replace(/\.([A-ZÀ-ÖØ-Þ])/g, ". $1")
    .replace(/\)([A-ZÀ-ÖØ-Þ])/g, ") $1");

  return spaced.replace(/>([^<]+)</g, (_, text: string) => {
    const cleaned = formatReadableText(text);
    return `>${cleaned}<`;
  });
}

function sanitizeInlineStyle(styleText: string) {
  let style = styleText;
  style = style.replace(/\bcolor\s*:\s*(#fff(?:fff)?|white)\s*;?/gi, "");
  style = style.replace(/\bcolor\s*:\s*(#000(?:000)?|black)\s*;?/gi, "");
  style = style.replace(/\bbackground-color\s*:\s*(#fff(?:fff)?|white)\s*;?/gi, "");
  style = style.replace(/\bbackground-color\s*:\s*(#000(?:000)?|black)\s*;?/gi, "");
  style = style.replace(/\bbackground\s*:\s*(#fff(?:fff)?|white)\s*;?/gi, "");
  style = style.replace(/\bbackground\s*:\s*(#000(?:000)?|black)\s*;?/gi, "");
  style = style.replace(/\s{2,}/g, " ").trim();
  style = style.replace(/^[; ]+|[; ]+$/g, "");
  style = style.replace(/;{2,}/g, ";");
  return style;
}
