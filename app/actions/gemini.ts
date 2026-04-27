"use server";

import { GoogleGenAI } from "@google/genai";

export interface SentimentResponse {
  catalyst_score: number;
  volatility_risk: "Low" | "Moderate" | "High" | "Extreme";
  key_drivers: string[];
  action_signal: "Watch Closely" | "Potential Upside" | "Correction Risk";
}

const MODEL_CHAIN = [
  "gemini-2.5-flash",
  "gemini-1.5-flash",
  "gemini-1.5-flash-8b",
] as const;

const SYSTEM_INSTRUCTION = `You are a rapid stock market sentiment analyst. Read the provided news article or IPO prospectus text and extract its core sentiment. You MUST respond ONLY with a JSON object in exactly this format — no markdown, no preamble, no explanation:
{
  "catalyst_score": [Number 1-100. 1=Extremely Bearish, 100=Extremely Bullish],
  "volatility_risk": [Choose one: "Low", "Moderate", "High", "Extreme"],
  "key_drivers": [Array of max 3 short strings describing the main sentiment drivers],
  "action_signal": [Choose one: "Watch Closely", "Potential Upside", "Correction Risk"]
}`;

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

function isRetriable(err: unknown): boolean {
  if (err && typeof err === "object" && "status" in err) {
    const status = (err as { status: number }).status;
    return status === 503 || status === 429 || status === 500;
  }
  const msg = err instanceof Error ? err.message : String(err);
  return msg.includes("503") || msg.includes("UNAVAILABLE") || msg.includes("429");
}

async function attemptWithModel(
  ai: GoogleGenAI,
  model: string,
  safeText: string
): Promise<SentimentResponse> {
  const MAX_RETRIES = 2;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: safeText,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          responseMimeType: "application/json",
        },
      });

      const rawText = response.text;
      if (!rawText) throw new Error("AI returned no response.");

      const clean = rawText.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean) as SentimentResponse;

      if (
        typeof parsed.catalyst_score !== "number" ||
        !parsed.volatility_risk ||
        !Array.isArray(parsed.key_drivers) ||
        !parsed.action_signal
      ) {
        throw new Error("AI response format is invalid.");
      }

      parsed.catalyst_score = Math.min(100, Math.max(1, Math.round(parsed.catalyst_score)));
      parsed.key_drivers = parsed.key_drivers.slice(0, 3);

      return parsed;

    } catch (err: unknown) {
      const isLast = attempt === MAX_RETRIES;

      if (err instanceof SyntaxError) {
        throw new Error("Failed to parse JSON response from AI.");
      }

      if (isRetriable(err) && !isLast) {
        // Exponential backoff: 1s → 2s
        await delay(1000 * Math.pow(2, attempt));
        continue;
      }

      throw err;
    }
  }

  throw new Error("Unexpected retry loop exit.");
}

export async function analyzeSentiment(text: string): Promise<SentimentResponse> {
  const trimmed = text.trim();
  if (!trimmed) throw new Error("Input text cannot be empty.");
  const safeText = trimmed.substring(0, 5000);

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

  let lastError: unknown;

  for (const model of MODEL_CHAIN) {
    try {
      const result = await attemptWithModel(ai, model, safeText);
      return result;
    } catch (err: unknown) {
      lastError = err;

      if (isRetriable(err)) {
        console.warn(`[TapeReader] ${model} unavailable, trying next model...`);
        continue;
      }

      throw err;
    }
  }

  // Suppress unused warning — lastError is intentional for debugging
  void lastError;

  throw new Error(
    "All AI models are currently under high demand. Please wait a moment and try again."
  );
}