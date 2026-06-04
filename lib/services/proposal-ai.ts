import { buildProposalAiMessages } from "@/lib/services/proposal-ai-prompt";
import { getOpenRouterConfig, openRouterChatCompletion } from "@/lib/services/openrouter-client";

export async function generateProposalHtmlWithAI(input: {
  company: string;
  sector: string;
  notes: string;
  budget: number;
  palette: string[];
  styleDirection?: string;
}) {
  if (!getOpenRouterConfig().apiKey) return null;

  const { messages } = buildProposalAiMessages(input);

  const result = await openRouterChatCompletion({
    messages,
    temperature: 0.55,
    maxTokens: 12_000,
    timeoutMs: 120_000
  });

  if (!result.ok) return null;

  const text = result.content.replace(/^```html\s*/i, "").replace(/```\s*$/i, "").trim();
  return text || null;
}
