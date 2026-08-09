import Anthropic from "@anthropic-ai/sdk";
import type { SkinAnalysisResult } from "./types";

const MODEL = "claude-haiku-4-5";
const MAX_TOKENS = 150;

const SYSTEM_PROMPT = `You are a skincare copywriting assistant for the Skingredient app.
Given a user's normalized skin-analysis scores (0-100 each, higher = healthier),
write exactly one short, encouraging, skincare-focused sentence for a UI element
labeled "Today's Skin Direction." Identify the single most meaningful area to
focus on today rather than listing every score. Do not diagnose medical
conditions or make medical claims. Do not mention exact numbers. Under 25 words.`;

function scoresToPrompt(scores: SkinAnalysisResult): string {
  return `Redness: ${scores.redness}, Hydration: ${scores.hydration}, Acne: ${scores.acne}, Oiliness: ${scores.oiliness}, Texture: ${scores.texture}, Pores: ${scores.pores}`;
}

let client: Anthropic | undefined;

function getClient(): Anthropic {
  if (!client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not configured on the server");
    client = new Anthropic({ apiKey });
  }
  return client;
}

/**
 * Calls Claude once to turn normalized skin-analysis scores into one short
 * "Today's Skin Direction" sentence. Returns null on any failure (refusal,
 * API error, empty response) rather than throwing — callers should treat a
 * null result as "no direction generated yet" and fall back gracefully,
 * not retry automatically.
 */
export async function generateSkinDirection(
  scores: Pick<
    SkinAnalysisResult,
    "redness" | "hydration" | "acne" | "oiliness" | "texture" | "pores"
  >,
): Promise<string | null> {
  try {
    const response = await getClient().messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: scoresToPrompt(scores as SkinAnalysisResult) }],
    });

    if (response.stop_reason === "refusal") {
      console.error("skin-direction generation refused");
      return null;
    }

    const textBlock = response.content.find((block) => block.type === "text");
    return textBlock?.text.trim() || null;
  } catch (error) {
    console.error("skin-direction generation failed", error);
    return null;
  }
}
