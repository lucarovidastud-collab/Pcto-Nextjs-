export type OpenRouterChatMessage =
  | { role: "system" | "user"; content: string }
  | { role: "user"; content: Array<{ type: string; text?: string; image_url?: { url: string } }> };

export function getOpenRouterConfig() {
  return {
    apiKey: (process.env.OPENROUTER_API_KEY || "").trim(),
    model: (process.env.OPENROUTER_MODEL || "google/gemini-2.0-flash-001").trim(),
    referer: (process.env.APP_URL || "https://pcto-nextjs.vercel.app").replace(/\/$/, "")
  };
}

export function extractJsonFromModelText(text: string): string | null {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) return fenced[1].trim();
  const match = trimmed.match(/\{[\s\S]*\}/);
  return match?.[0] ?? null;
}

export async function openRouterChatCompletion(input: {
  messages: OpenRouterChatMessage[];
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
  timeoutMs?: number;
}): Promise<
  | { ok: true; content: string }
  | { ok: false; status?: number; error: string }
> {
  const { apiKey, model, referer } = getOpenRouterConfig();
  if (!apiKey) {
    return { ok: false, error: "OPENROUTER_API_KEY mancante" };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), input.timeoutMs ?? 60_000);

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": referer,
        "X-Title": "QuoteGen Engine"
      },
      body: JSON.stringify({
        model,
        temperature: input.temperature ?? 0.2,
        max_tokens: input.maxTokens ?? 800,
        ...(input.jsonMode ? { response_format: { type: "json_object" } } : {}),
        messages: input.messages
      })
    });

    if (!response.ok) {
      const errBody = await response.text().catch(() => "");
      return {
        ok: false,
        status: response.status,
        error: errBody.slice(0, 300) || `HTTP ${response.status}`
      };
    }

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = String(payload?.choices?.[0]?.message?.content || "").trim();
    if (!content) {
      return { ok: false, error: "Risposta AI vuota" };
    }

    return { ok: true, content };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Errore di rete";
    return { ok: false, error: message };
  } finally {
    clearTimeout(timeout);
  }
}
