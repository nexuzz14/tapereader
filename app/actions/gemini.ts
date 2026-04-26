"use server";

import { GoogleGenAI } from "@google/genai";

export interface SentimentResponse {
  catalyst_score: number;
  volatility_risk: "Rendah" | "Sedang" | "Tinggi" | "Ekstrem";
  key_drivers: string[];
  action_signal: "Pantau Ketat" | "Berpotensi Naik" | "Waspada Koreksi";
}

export async function analyzeSentiment(text: string): Promise<SentimentResponse> {
  // --- Validation ---
  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error("Input teks tidak boleh kosong.");
  }
  const safeText = trimmed.substring(0, 5000);

  // --- AI Client ---
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

  const systemInstruction = `Anda adalah analis sentimen pasar saham kilat. Baca teks berita/prospektus IPO dan ekstrak sentimen utamanya. Anda HANYA boleh merespons dengan format JSON persis seperti ini, tanpa markdown atau teks pengantar:
{
  "catalyst_score": [Angka 1-100. 1=Sangat Bearish, 100=Sangat Bullish],
  "volatility_risk": [Pilih: "Rendah", "Sedang", "Tinggi", "Ekstrem"],
  "key_drivers": [Array maksimal 3 string singkat penyebab sentimen],
  "action_signal": [Pilih: "Pantau Ketat", "Berpotensi Naik", "Waspada Koreksi"]
}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",  
      contents: safeText,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
      },
    });

    const rawText = response.text;
    if (!rawText) {
      throw new Error("AI tidak mengembalikan respons.");
    }

    const parsed = JSON.parse(rawText) as SentimentResponse;

    // Basic validation
    if (
      typeof parsed.catalyst_score !== "number" ||
      !parsed.volatility_risk ||
      !Array.isArray(parsed.key_drivers) ||
      !parsed.action_signal
    ) {
      throw new Error("Format respons AI tidak valid.");
    }

    // Range clamp — pastikan score 1-100
    parsed.catalyst_score = Math.min(100, Math.max(1, Math.round(parsed.catalyst_score)));
    // Limit key_drivers ke 3 item
    parsed.key_drivers = parsed.key_drivers.slice(0, 3);

    return parsed;
  } catch (err: unknown) {
    if (err instanceof SyntaxError) {
      throw new Error("Gagal mem-parsing respons JSON dari AI.");
    }
    throw err;
  }
}