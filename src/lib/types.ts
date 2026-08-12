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

export interface RecommendationInput {
  analysis: SkinAnalysisResult;
  symptoms: string[];
  sensitivities: string[];
  recentActives: string[];
  upcomingEvent?: {
    type: string;
    timing: "tomorrow" | "three-days" | "week" | "none";
  };
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
