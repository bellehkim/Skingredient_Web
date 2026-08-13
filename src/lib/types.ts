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

/** "What's happening tomorrow?" from the daily check-in (src/routes/scan.check-in.tsx)
 * — modifies today's recommendation, never overrides the skin-analysis-driven
 * baseline. "cosmetic-treatment" has no adjustment rule for the MVP; it's kept
 * as a distinct value (rather than folded into "none") so the check-in chip's
 * selection is preserved faithfully even though it doesn't affect output yet.
 * See src/lib/scheduleAdjustments.ts. */
export type ScheduleOption =
  "important-event" | "outdoor-day" | "travel" | "cosmetic-treatment" | "none";

export interface RecommendationInput {
  analysis: SkinAnalysisResult;
  symptoms: string[];
  sensitivities: string[];
  recentActives: string[];
  /** Deprecated in favor of scheduleTomorrow — kept only so the MCP get_recommendation
   * tool (src/lib/mcp/tools/get-recommendation.ts) keeps compiling. No longer read by
   * generateRecommendation(); permanently stuck at the mock "tomorrow" value in the
   * app itself, since nothing ever called the old setEvent(). */
  upcomingEvent?: {
    type: string;
    timing: "tomorrow" | "three-days" | "week" | "none";
  };
  scheduleTomorrow?: ScheduleOption;
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

export interface UpcomingEvent {
  type: string;
  label: string;
  timing: "tomorrow" | "three-days" | "week" | "none";
  whenLabel: string;
}
