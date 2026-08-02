import type {
  DailyRecommendation,
  RecommendationInput,
  SkinDirection,
} from "./types";

const DISPLAY: Record<SkinDirection, string> = {
  "barrier-recovery": "Barrier Recovery",
  "blemish-control": "Blemish Control",
  "hydration-support": "Hydration Support",
  "oil-balance": "Oil Balance",
  "texture-renewal": "Texture Renewal",
  "pause-actives": "Pause Actives",
};

const SEVERE_SYMPTOMS = ["burning", "swelling", "severe-itching", "rash"];

export function generateRecommendation(input: RecommendationInput): DailyRecommendation {
  const { analysis, symptoms, sensitivities, upcomingEvent, ingredientHistory } = input;
  const severe = symptoms.some((s) => SEVERE_SYMPTOMS.includes(s));
  const eventTomorrow = upcomingEvent?.timing === "tomorrow";

  let direction: SkinDirection = "hydration-support";
  let prioritized: string[] = [];
  let avoided: string[] = [];
  let risk: "low" | "moderate" | "high" = "low";
  let explanation = "";

  if (severe) {
    direction = "pause-actives";
    prioritized = ["Ceramides", "Panthenol", "Glycerin", "Squalane"];
    avoided = ["Retinoids", "AHA", "BHA", "Benzoyl Peroxide", "Strong Vitamin C", "Fragrance"];
    risk = "high";
    explanation = "Your skin looks highly reactive. Pausing strong actives and focusing on gentle barrier support.";
  } else if (analysis.redness >= 65 && analysis.hydration <= 55) {
    direction = "barrier-recovery";
    prioritized = ["Ceramides", "Panthenol", "Glycerin", "Beta-Glucan", "Squalane"];
    avoided = ["Retinoids", "AHA", "BHA", "Benzoyl Peroxide", "Strong Vitamin C"];
    risk = "moderate";
    explanation = "Your skin looks dehydrated and slightly reactive today.";
  } else if (analysis.acne >= 65) {
    direction = "blemish-control";
    prioritized = ["Salicylic Acid", "Azelaic Acid", "Niacinamide"];
    avoided = ["Multiple exfoliating actives at once", "Heavy occlusives"];
    risk = "moderate";
    explanation = "Focus on gentle blemish control without overloading actives.";
  } else if (analysis.hydration <= 45) {
    direction = "hydration-support";
    prioritized = ["Glycerin", "Hyaluronic Acid", "Beta-Glucan", "Panthenol"];
    avoided = ["Alcohol", "Strong exfoliants"];
    risk = "low";
    explanation = "Your skin needs a hydration boost today.";
  } else if (analysis.oiliness >= 70 && analysis.hydration > 45) {
    direction = "oil-balance";
    prioritized = ["Niacinamide", "Lightweight hydrators"];
    avoided = ["Heavy occlusives"];
    risk = "low";
    explanation = "Balance oil without over-drying your skin.";
  } else if (analysis.texture >= 65) {
    direction = "texture-renewal";
    prioritized = ["Gentle PHA", "Niacinamide"];
    avoided = ["Combining multiple strong exfoliants"];
    risk = "moderate";
    explanation = "A gentle, controlled exfoliation plan can help refine texture.";
  }

  if (eventTomorrow && risk !== "high") {
    avoided = Array.from(new Set([...avoided, "New active ingredients", "Retinoids", "AHA"]));
    explanation += " With your event tomorrow, we're favoring calming, predictable products.";
  }

  if (ingredientHistory) {
    prioritized = prioritized.filter(
      (i) => ingredientHistory[i.toLowerCase()] !== "irritating",
    );
  }

  const lowerSens = sensitivities.map((s) => s.toLowerCase());
  prioritized = prioritized.filter((i) => !lowerSens.includes(i.toLowerCase()));

  return {
    direction,
    displayName: DISPLAY[direction],
    explanation: explanation.trim(),
    prioritizedIngredients: prioritized,
    avoidedIngredients: avoided,
    riskLevel: risk,
  };
}