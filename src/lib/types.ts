/** Every field is 0-100 where higher = healthier/better — matches YouCam's `ui_score`
 * convention directly (see normalize() in src/routes/api/skin-analysis.ts). */
export interface SkinAnalysisResult {
  redness: number;
  hydration: number;
  oiliness: number;
  acne: number;
  pores: number;
  texture: number;
  ageSpots: number;
  analyzedAt: string;
  /** AI-generated "Today's Skin Direction" sentence (src/lib/skinDirectionService.ts).
   * Missing/null if generation hasn't run yet or failed — callers fall back to
   * recommendation.explanation rather than treating it as an error state. */
  skinDirection?: string | null;
  /** When skinDirection was generated (initial generation or a successful retry). */
  skinDirectionGeneratedAt?: string | null;
  /** AI-generated "Today's Skin Strategy" paragraph (src/lib/skinStrategyService.ts)
   * — a distinct field from skinDirection: a longer, more contextual strategy
   * (condition/type/concerns/schedule/shelf-aware) shown on Results/History,
   * generated exactly once per analysis and never regenerated on read. Missing/null
   * if generation failed — callers show a non-AI fallback, never retry automatically. */
  skinStrategy?: string | null;
  skinStrategyGeneratedAt?: string | null;

  // Persistence metadata (src/lib/data/analyses.ts) — present once this
  // analysis has been saved to/read from skin_analyses; absent for
  // not-yet-persisted or mock data. Carried on the same object (rather than
  // a separate wrapper type) so the DB row can become the app's source of
  // truth in place, per the scan-flow design in scan.index.tsx.
  id?: string;
  createdAt?: string;
  algorithmVersion?: string;
}

export type SkinDirection =
  | "barrier-recovery"
  | "blemish-control"
  | "hydration-support"
  | "oil-balance"
  | "texture-renewal"
  | "pause-actives";

export interface DailyRecommendation {
  direction: SkinDirection;
  displayName: string;
  explanation: string;
  prioritizedIngredients: string[];
  avoidedIngredients: string[];
  riskLevel: "low" | "moderate" | "high";
}

/** "What's happening?" (event TYPE) from the daily check-in (src/routes/scan.check-in.tsx)
 * — modifies today's recommendation, never overrides the skin-analysis-driven
 * baseline. Always paired with EventTiming (below) — TYPE picks the kind of
 * adjustment, TIMING picks how strongly it applies. See src/lib/scheduleAdjustments.ts. */
export type ScheduleOption =
  "important-event" | "outdoor-day" | "travel" | "cosmetic-treatment" | "none";

/** "When is it?" (event TIMING) from the daily check-in — sibling field to
 * ScheduleOption, not nested: both are set together from the same check-in
 * step and stored together in appStore/localStorage, so there's still one
 * source of truth for "the user's upcoming plan," just as two flat fields
 * rather than one object (matches how every other RecommendationInput field
 * is already flat). "none" whenever ScheduleOption is "none". */
export type EventTiming = "tomorrow" | "three-days" | "week" | "none";

export interface RecommendationInput {
  analysis: SkinAnalysisResult;
  symptoms: string[];
  sensitivities: string[];
  recentActives: string[];
  scheduleTomorrow?: ScheduleOption;
  eventTiming?: EventTiming;
  ingredientHistory?: Record<string, "helpful" | "neutral" | "irritating" | "unknown">;
}

export type ProductStatus = "use-today" | "optional" | "skip-today";

export interface Product {
  id: string;
  brand: string;
  name: string;
  category: string;
  status: ProductStatus;
  keyIngredients: string[];
  reason: string;
  imageColor: string;
  imageUrl?: string;
  /** Short personalized statements used on product cards & detail pages */
  benefitTags?: string[];
  benefits?: string[];
  concern?: string;
}

export interface Ingredient {
  id: string;
  name: string;
  aliases: string[];
  supports: string[];
  avoidWhen: string[];
  irritationRisk: "low" | "medium" | "high";
  beginnerFriendly: boolean;
  explanation: string;
  category?: "prioritize" | "avoid" | "neutral";
  /** Concise categorical benefits, e.g. ["Hydration", "Barrier Support"] */
  primaryBenefits?: string[];
  /** Cosmetic function labels, e.g. ["Humectant", "Skin conditioning"] */
  cosmeticFunctions?: string[];
  /** 1 = none, 2 = mild, 3 = moderate, 4 = high */
  cautionLevel?: 1 | 2 | 3 | 4;
  /** Short chips shown for level 2/3 */
  cautionChips?: string[];
  /** Longer safety notes shown for level 4 */
  safetyNotes?: string[];
}
