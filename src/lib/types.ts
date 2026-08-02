export interface SkinAnalysisResult {
  redness: number;
  hydration: number;
  acne: number;
  oiliness: number;
  texture: number;
  pores: number;
  analyzedAt: string;
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