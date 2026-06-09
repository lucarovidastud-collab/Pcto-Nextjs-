import { afterEach, describe, expect, it } from "vitest";
import {
  extractJsonFromModelText,
  getGeminiConfig,
  isGeminiConfigured,
  modelsToTry,
  resetGeminiClientCacheForTests
} from "@/lib/services/gemini-client";

describe("gemini-client (Agent Platform)", () => {
  const env = process.env;

  afterEach(() => {
    process.env = { ...env };
    resetGeminiClientCacheForTests();
  });

  it("express mode: basta GOOGLE_API_KEY anche se Firebase è su altro progetto", () => {
    delete process.env.VERTEX_PROJECT_ID;
    delete process.env.GOOGLE_CLOUD_PROJECT;
    process.env.FIREBASE_PROJECT_ID = "quotegen-engine-2";
    delete process.env.VERTEX_SERVICE_ACCOUNT_JSON;
    delete process.env.FIREBASE_CLIENT_EMAIL;
    delete process.env.FIREBASE_PRIVATE_KEY;
    process.env.GOOGLE_API_KEY = "AIza-test-key";

    expect(isGeminiConfigured()).toBe(true);
    expect(getGeminiConfig().authMode).toBe("api_key_express");
    expect(getGeminiConfig().projectId).toBe("");
  });

  it("service account: project + credenziali Firebase/Vertex", () => {
    delete process.env.GOOGLE_API_KEY;
    delete process.env.GEMINI_API_KEY;
    process.env.VERTEX_PROJECT_ID = "quotegen-prod";
    process.env.VERTEX_CLIENT_EMAIL = "vertex@quotegen.iam.gserviceaccount.com";
    process.env.VERTEX_PRIVATE_KEY = "-----BEGIN PRIVATE KEY-----\\ntest\\n-----END PRIVATE KEY-----";

    expect(isGeminiConfigured()).toBe(true);
    expect(getGeminiConfig().authMode).toBe("service_account");
  });

  it("modelsToTry deduplica e mantiene ordine", () => {
    expect(modelsToTry("gemini-2.5-pro")).toEqual([
      "gemini-2.5-pro",
      "gemini-2.5-flash",
      "gemini-2.0-flash"
    ]);
  });

  it("extractJsonFromModelText legge JSON fenced", () => {
    const raw = 'Ecco il risultato:\n```json\n{"budget": 12000}\n```';
    expect(extractJsonFromModelText(raw)).toBe('{"budget": 12000}');
  });
});
