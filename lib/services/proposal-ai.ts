import { buildProposalAiMessages } from "@/lib/services/proposal-ai-prompt";
import { buildFallbackProposalHtml } from "@/lib/proposals/fallback-html";
import { geminiChatCompletion, getGeminiConfig, isGeminiConfigured } from "@/lib/services/gemini-client";
import { logger } from "@/lib/logger";

export type ProposalHtmlSource = "ai" | "fallback";

export type ProposalHtmlGeneration = {
  html: string;
  source: ProposalHtmlSource;
  aiError?: string;
};

function cleanModelHtml(text: string) {
  return text.replace(/^```html\s*/i, "").replace(/```\s*$/i, "").trim();
}

function isUsableAiHtml(html: string) {
  if (html.length < 800) return false;
  return /proposal-(hero|card)|pricing-table/i.test(html);
}

export async function generateProposalHtml(input: {
  company: string;
  sector: string;
  notes: string;
  budget: number;
  palette: string[];
  styleDirection?: string;
  style?: string;
}): Promise<ProposalHtmlGeneration> {
  const fallback = () =>
    buildFallbackProposalHtml({
      company: input.company,
      sector: input.sector,
      notes: input.notes,
      budget: input.budget,
      palette: input.palette
    });

  if (!isGeminiConfigured()) {
    return { html: fallback(), source: "fallback", aiError: "GOOGLE_API_KEY mancante" };
  }

  const { messages } = buildProposalAiMessages(input);
  const attempts = [
    { maxTokens: 8192, timeoutMs: 90_000, label: "primary" },
    { maxTokens: 6000, timeoutMs: 75_000, label: "retry" }
  ] as const;

  let lastError = "Risposta AI non valida";

  for (const attempt of attempts) {
    const result = await geminiChatCompletion({
      messages,
      temperature: 0.5,
      maxTokens: attempt.maxTokens,
      timeoutMs: attempt.timeoutMs
    });

    if (!result.ok) {
      lastError = result.error || `HTTP ${result.status ?? "?"}`;
      logger.warn(
        { attempt: attempt.label, status: result.status, error: result.error, model: result.model },
        "proposal_ai.generation_failed"
      );
      continue;
    }

    const html = cleanModelHtml(result.content);
    if (isUsableAiHtml(html)) {
      logger.info({ attempt: attempt.label, length: html.length }, "proposal_ai.generation_ok");
      return { html, source: "ai" };
    }

    lastError = "HTML troppo corto o senza sezioni";
    logger.warn(
      { attempt: attempt.label, length: html.length, preview: html.slice(0, 120) },
      "proposal_ai.invalid_html"
    );
  }

  return { html: fallback(), source: "fallback", aiError: lastError };
}

/** @deprecated Usa generateProposalHtml */
export async function generateProposalHtmlWithAI(
  input: Parameters<typeof generateProposalHtml>[0]
): Promise<string | null> {
  const result = await generateProposalHtml(input);
  return result.source === "ai" ? result.html : null;
}
