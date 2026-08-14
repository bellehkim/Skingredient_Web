import Anthropic from "@anthropic-ai/sdk";
import { EVENT_TIMING_PHRASE } from "./scheduleAdjustments";
import type { EventTiming, ScheduleOption, SkinAnalysisResult } from "./types";

const MODEL = "claude-haiku-4-5";
const MAX_TOKENS = 300;

const EVENT_TYPE_PHRASE: Record<Exclude<ScheduleOption, "none">, string> = {
  "important-event": "an important event",
  "outdoor-day": "an outdoor day",
  travel: "travel",
  "cosmetic-treatment": "a cosmetic treatment",
};

/** Composes the type + timing into one line for the prompt — reuses the
 * exact same phrase vocabulary as scheduleAdjustments.ts (the deterministic
 * engine) so the AI's wording never contradicts what actually happened to
 * the ingredient lists. "none" for either field means no upcoming plan. */
function upcomingPlanLine(type: ScheduleOption, timing: EventTiming): string {
  if (type === "none" || timing === "none") {
    return "Upcoming plans: nothing special planned.";
  }
  return `Upcoming plans: ${EVENT_TYPE_PHRASE[type]} ${EVENT_TIMING_PHRASE[timing]}.`;
}

const SYSTEM_PROMPT = `You are a skincare strategy assistant for the Skingredient app.
You write "Today's Skin Strategy" — a short paragraph explaining today's overall
skincare approach in plain language, for a user who already has a separate,
deterministic recommendation engine picking their actual ingredients, products,
and AM/PM routine. You are NOT that engine — you only explain strategy.

Write 3-4 sentences, approximately 60-120 words total.

You are given today's already-decided plan (Direction, Explanation, Prioritize,
Avoid, Risk level) from that deterministic engine. Explain and contextualize
that exact plan in plain language — do not invent a different concern, priority,
or hierarchy than what's given, and do not omit or contradict anything in it.

You must NOT:
- name specific products or brands
- name specific ingredients (e.g. do not say "niacinamide", "retinol", "salicylic acid")
- describe or generate a step-by-step routine
- diagnose any skin condition or disease, or diagnose an allergy
- make medical claims or give medical advice
- contradict the provided plan (e.g. do not suggest introducing strong new actives
  if the plan avoids them, and do not center the explanation on a concern that
  isn't reflected in Prioritize/Avoid/Explanation below)

Instead, speak at the strategy level only, e.g.: focus on hydration, strengthen your
skin barrier, keep your routine gentle, avoid introducing strong new actives,
prioritize UV protection, maintain consistency.

If the user has a meaningful upcoming plan (an event, travel, an outdoor day, a
cosmetic treatment), open by naturally acknowledging both WHAT it is and roughly
WHEN it is (e.g. "You have an important event tomorrow..." or "With travel coming
up within the next few days...") before describing today's focus — something
tomorrow deserves a stronger tone than something a week out. If Shelf context is
provided, you may note that the user already owns relevant product categories,
but never recommend a specific one.

If previously reported ingredient reactions are provided, you may naturally note
that today's strategy accounts for them (e.g. "Because you've previously reported
irritation with retinol, today's strategy keeps your routine gentler."). Treat
this only as one user-reported data point about one specific ingredient — never
call it an allergy or a sensitivity to a broader ingredient family.

WRITING STYLE RULES:
- Never use em dashes (—).
- Do not use en dashes (–) as sentence punctuation.
- Use commas, periods, colons, or parentheses instead.
- Keep sentences concise and natural.
- Before returning the final response, verify that it contains no em dash characters.`;

export interface SkinStrategyInput {
  scores: Pick<
    SkinAnalysisResult,
    "redness" | "hydration" | "oiliness" | "acne" | "pores" | "texture" | "ageSpots"
  >;
  overallCondition: { score: number; label: string };
  skinType: string;
  /** Today's already-computed recommendation (src/lib/recommendationEngine.ts)
   * — the exact same plan Today's Plan/Recommended Products/Routine read.
   * Never an independently-derived concern list: Claude explains this plan,
   * it doesn't get to invent a different one. `direction` is the
   * DailyRecommendation.displayName (e.g. "Blemish Control"). */
  direction: string;
  explanation: string;
  prioritizedIngredients: string[];
  avoidedIngredients: string[];
  riskLevel: "low" | "moderate" | "high";
  scheduleTomorrow: ScheduleOption;
  eventTiming: EventTiming;
  /** Category-level only (e.g. "Cleanser", "Moisturizer") — never product
   * names/brands. Omit or pass an empty array to leave Shelf context out of
   * the prompt entirely when it wouldn't materially help. */
  shelfCategories: string[];
  /** Exact inci_name of every ingredient the user has previously reported as
   * "irritating" (src/lib/data/ingredientReactions.ts) — concise structured
   * context only, e.g. ["Retinol"]. Omit or pass an empty array when there
   * are none. */
  irritatingIngredients?: string[];
}

/** Exported for testing — the prompt-building step is pure and deterministic;
 * the network call around it is not worth mocking for unit tests. */
export function buildPrompt(input: SkinStrategyInput): string {
  const {
    scores,
    overallCondition,
    skinType,
    direction,
    explanation,
    prioritizedIngredients,
    avoidedIngredients,
    riskLevel,
    scheduleTomorrow,
    eventTiming,
    shelfCategories,
    irritatingIngredients,
  } = input;

  const lines = [
    `Overall Condition: ${overallCondition.label} (score ${overallCondition.score}/100)`,
    `Skin Type: ${skinType}`,
    `Scores (0-100, higher = healthier): Redness ${scores.redness}, Hydration ${scores.hydration}, Oiliness ${scores.oiliness}, Acne ${scores.acne}, Pores ${scores.pores}, Texture ${scores.texture}, Age Spots ${scores.ageSpots}`,
    `Today's plan — Direction: ${direction}`,
    `Explanation: ${explanation || "No specific concern flagged today."}`,
    prioritizedIngredients.length > 0
      ? `Prioritize: ${prioritizedIngredients.join(", ")}`
      : "Prioritize: nothing specific today.",
    avoidedIngredients.length > 0
      ? `Avoid: ${avoidedIngredients.join(", ")}`
      : "Avoid: nothing specific today.",
    `Risk level: ${riskLevel}`,
    upcomingPlanLine(scheduleTomorrow, eventTiming),
  ];

  if (shelfCategories.length > 0) {
    lines.push(`User already owns products in these categories: ${shelfCategories.join(", ")}.`);
  }

  if (irritatingIngredients && irritatingIngredients.length > 0) {
    const reported = irritatingIngredients.map((name) => `- ${name}: irritation`).join("\n");
    lines.push(`Previously reported ingredient reactions:\n${reported}`);
  }

  return lines.join("\n");
}

/**
 * Exported for testing — a small defensive backstop to the system prompt's
 * "never use em dashes" rule, applied only to the generated Skin Strategy
 * text itself (never source code strings or other UI copy). Em dash is
 * almost always a parenthetical/sentence break, so it becomes ", "; en dash
 * is almost always a separator (e.g. a range), so it becomes a plain
 * hyphen. Does not otherwise rewrite the generated content.
 */
export function sanitizeSkinStrategyText(text: string): string {
  return text
    .replace(/\s*—\s*/g, ", ")
    .replace(/\s*–\s*/g, "-")
    .replace(/ {2,}/g, " ")
    .trim();
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
 * Calls Claude once to turn today's condition/type/plan/upcoming-plan/shelf
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
    const text = textBlock?.text.trim();
    return text ? sanitizeSkinStrategyText(text) : null;
  } catch (error) {
    console.error("skin-strategy generation failed", error);
    return null;
  }
}
