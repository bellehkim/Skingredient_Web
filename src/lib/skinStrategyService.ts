import Anthropic from "@anthropic-ai/sdk";
import type { ScheduleOption, SkinAnalysisResult } from "./types";

const MODEL = "claude-haiku-4-5";
const MAX_TOKENS = 300;

const SCHEDULE_LABELS: Record<ScheduleOption, string> = {
  "important-event": "an important event tomorrow",
  "outdoor-day": "an outdoor day tomorrow",
  travel: "travel tomorrow",
  "cosmetic-treatment": "a cosmetic treatment tomorrow",
  none: "nothing special planned tomorrow",
};

const SYSTEM_PROMPT = `You are a skincare strategy assistant for the Skingredient app.
You write "Today's Skin Strategy" — a short paragraph explaining today's overall
skincare approach in plain language, for a user who already has a separate,
deterministic recommendation engine picking their actual ingredients, products,
and AM/PM routine. You are NOT that engine — you only explain strategy.

Write 3-4 sentences, approximately 60-120 words total.

You must NOT:
- name specific products or brands
- name specific ingredients (e.g. do not say "niacinamide", "retinol", "salicylic acid")
- describe or generate a step-by-step routine
- diagnose any skin condition or disease
- make medical claims or give medical advice
- contradict the direction implied by the provided condition/concerns (e.g. do not
  suggest introducing strong new actives if concerns indicate irritation or low hydration)

Instead, speak at the strategy level only, e.g.: focus on hydration, strengthen your
skin barrier, keep your routine gentle, avoid introducing strong new actives,
prioritize UV protection tomorrow, maintain consistency.

If tomorrow's schedule is meaningful (an event, travel, an outdoor day, a cosmetic
treatment), open by acknowledging it before describing today's focus. If Shelf
context is provided, you may note that the user already owns relevant product
categories, but never recommend a specific one.`;

export interface SkinStrategyInput {
  scores: Pick<
    SkinAnalysisResult,
    "redness" | "hydration" | "oiliness" | "acne" | "pores" | "texture" | "ageSpots"
  >;
  overallCondition: { score: number; label: string };
  skinType: string;
  concerns: string[];
  scheduleTomorrow: ScheduleOption;
  /** Category-level only (e.g. "Cleanser", "Moisturizer") — never product
   * names/brands. Omit or pass an empty array to leave Shelf context out of
   * the prompt entirely when it wouldn't materially help. */
  shelfCategories: string[];
}

/** Exported for testing — the prompt-building step is pure and deterministic;
 * the network call around it is not worth mocking for unit tests. */
export function buildPrompt(input: SkinStrategyInput): string {
  const { scores, overallCondition, skinType, concerns, scheduleTomorrow, shelfCategories } = input;

  const lines = [
    `Overall Condition: ${overallCondition.label} (score ${overallCondition.score}/100)`,
    `Skin Type: ${skinType}`,
    `Scores (0-100, higher = healthier): Redness ${scores.redness}, Hydration ${scores.hydration}, Oiliness ${scores.oiliness}, Acne ${scores.acne}, Pores ${scores.pores}, Texture ${scores.texture}, Age Spots ${scores.ageSpots}`,
    concerns.length > 0
      ? `Detected concerns today: ${concerns.join(", ")}`
      : "Detected concerns today: none — skin is broadly balanced.",
    `Tomorrow: ${SCHEDULE_LABELS[scheduleTomorrow]}.`,
  ];

  if (shelfCategories.length > 0) {
    lines.push(`User already owns products in these categories: ${shelfCategories.join(", ")}.`);
  }

  return lines.join("\n");
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
 * Calls Claude once to turn today's condition/type/concerns/schedule/shelf
 * context into a short "Today's Skin Strategy" paragraph. Returns null on
 * any failure (refusal, API error, empty response) rather than throwing —
 * callers persist the analysis regardless and leave skin_strategy null; this
 * is never retried automatically.
 */
export async function generateSkinStrategy(input: SkinStrategyInput): Promise<string | null> {
  try {
    const response = await getClient().messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: buildPrompt(input) }],
    });

    if (response.stop_reason === "refusal") {
      console.error("skin-strategy generation refused");
      return null;
    }

    const textBlock = response.content.find((block) => block.type === "text");
    return textBlock?.text.trim() || null;
  } catch (error) {
    console.error("skin-strategy generation failed", error);
    return null;
  }
}
