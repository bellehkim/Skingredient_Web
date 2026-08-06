import type { Ingredient, Product, SkinAnalysisResult, UpcomingEvent } from "@/lib/types";
import ceraveImg from "@/assets/product-cerave.jpg";
import centellaImg from "@/assets/product-centella.jpg";
import ahabhaImg from "@/assets/product-ahabha.jpg";

export const mockUser = {
  name: "Belle",
  streak: 12,
  skinType: "Oily + Sensitive",
  skinNote: "T-zone oily, cheeks sensitive",
  goals: ["Strengthen barrier", "Reduce redness", "Avoid irritation"],
  sensitivities: ["Fragrance", "Essential oils"],
};

export const mockEvent: UpcomingEvent = {
  type: "Date",
  label: "Date night",
  timing: "tomorrow",
  whenLabel: "TOMORROW · 7:00 PM",
};

// All fields use "higher = healthier", matching YouCam's ui_score convention
// (see normalize() in src/routes/api/skin-analysis.ts). This demo scenario is a
// reactive, slightly dehydrated skin day: low redness/texture scores, decent
// acne/oiliness/pores scores, and below-average hydration.
export const mockAnalysis: SkinAnalysisResult = {
  redness: 28,
  hydration: 48,
  acne: 68,
  oiliness: 48,
  texture: 45,
  pores: 59,
  analyzedAt: new Date().toISOString(),
};

export const mockProducts: Product[] = [
  {
    id: "cerave-mc",
    brand: "CeraVe",
    name: "Moisturizing Cream",
    category: "Moisturizer",
    status: "use-today",
    keyIngredients: ["Ceramides", "Glycerin", "Hyaluronic Acid"],
    reason: "Great for your barrier recovery plan.",
    imageColor: "#EAF6FF",
    imageUrl: ceraveImg,
    benefitTags: ["Supports barrier recovery", "Locks in hydration", "Gentle for reactive days"],
    benefits: ["Strengthens skin barrier", "Locks in moisture", "Reduces dryness and flakiness"],
  },
  {
    id: "iunik-centella",
    brand: "iUNIK",
    name: "Centella Calming Gel Cream",
    category: "Moisturizer",
    status: "optional",
    keyIngredients: ["Centella", "Panthenol", "Beta-Glucan"],
    reason: "Calms and hydrates, but may feel light if your skin is very dry.",
    imageColor: "#E8F8F1",
    imageUrl: centellaImg,
    benefitTags: ["Helps calm redness", "Lightweight hydration", "Fragrance-free"],
    benefits: ["Calms redness", "Lightweight hydration"],
  },
  {
    id: "ordinary-ahabha",
    brand: "The Ordinary",
    name: "AHA 30% + BHA 2% Peeling Solution",
    category: "Exfoliant",
    status: "skip-today",
    keyIngredients: ["Glycolic Acid", "Lactic Acid", "Salicylic Acid"],
    reason: "Your redness is elevated and you have an event tomorrow.",
    imageColor: "#FFF0F1",
    imageUrl: ahabhaImg,
    benefitTags: [
      "Strong exfoliating actives",
      "Pause while barrier recovers",
      "Avoid before events",
    ],
    concern: "Strong exfoliating actives — pause while your barrier recovers.",
  },
];

export const mockIngredients: Ingredient[] = [
  {
    id: "ceramides",
    name: "Ceramides",
    aliases: ["Ceramide NP", "Ceramide AP"],
    supports: ["Barrier repair", "Moisture retention"],
    avoidWhen: [],
    irritationRisk: "low",
    beginnerFriendly: true,
    category: "prioritize",
    explanation: "Lipids that help restore and reinforce the skin barrier.",
    primaryBenefits: ["Barrier Support", "Moisture Retention", "Soothing"],
    cosmeticFunctions: ["Skin conditioning", "Emollient"],
    cautionLevel: 1,
  },
  {
    id: "panthenol",
    name: "Panthenol",
    aliases: ["Provitamin B5"],
    supports: ["Soothing", "Hydration"],
    avoidWhen: [],
    irritationRisk: "low",
    beginnerFriendly: true,
    category: "prioritize",
    explanation: "Commonly used to soothe reactive skin and support hydration.",
    primaryBenefits: ["Hydration", "Soothing", "Barrier Support"],
    cosmeticFunctions: ["Humectant", "Skin conditioning"],
    cautionLevel: 1,
  },
  {
    id: "glycerin",
    name: "Glycerin",
    aliases: [],
    supports: ["Hydration"],
    avoidWhen: [],
    irritationRisk: "low",
    beginnerFriendly: true,
    category: "prioritize",
    explanation: "A gentle humectant that pulls water into the skin.",
    primaryBenefits: ["Hydration", "Moisture Retention"],
    cosmeticFunctions: ["Humectant", "Solvent"],
    cautionLevel: 1,
  },
  {
    id: "niacinamide",
    name: "Niacinamide",
    aliases: ["Vitamin B3"],
    supports: ["Oil balance", "Even tone"],
    avoidWhen: ["Layering with strong actives if very sensitive"],
    irritationRisk: "low",
    beginnerFriendly: true,
    explanation: "May support oil balance, tone and barrier function.",
    primaryBenefits: ["Oil Balance", "Brightening", "Barrier Support"],
    cosmeticFunctions: ["Skin conditioning", "Smoothing"],
    cautionLevel: 2,
    cautionChips: ["High-strength formula", "Very sensitive skin", "Start gradually"],
  },
  {
    id: "centella",
    name: "Centella Asiatica",
    aliases: ["Cica", "Tiger grass"],
    supports: ["Soothing irritation", "Redness"],
    avoidWhen: [],
    irritationRisk: "low",
    beginnerFriendly: true,
    explanation: "Commonly used to calm irritation and support healing.",
    primaryBenefits: ["Soothing", "Redness Care", "Barrier Support"],
    cosmeticFunctions: ["Skin conditioning", "Antioxidant"],
    cautionLevel: 1,
  },
  {
    id: "retinol",
    name: "Retinol",
    aliases: ["Retinoids", "Retinaldehyde"],
    supports: ["Texture", "Fine lines"],
    avoidWhen: ["Reactive skin", "Barrier damage", "Before events"],
    irritationRisk: "high",
    beginnerFriendly: false,
    category: "avoid",
    explanation:
      "Powerful but may be irritating for some users, especially when the barrier is compromised.",
    primaryBenefits: ["Texture", "Fine Lines", "Cell Renewal"],
    cosmeticFunctions: ["Skin conditioning"],
    cautionLevel: 4,
    safetyNotes: [
      "Avoid after cosmetic procedures",
      "Avoid during pregnancy",
      "Do not combine with multiple exfoliating acids",
      "Use sunscreen consistently",
    ],
  },
  {
    id: "aha",
    name: "AHA",
    aliases: ["Glycolic Acid", "Lactic Acid"],
    supports: ["Exfoliation"],
    avoidWhen: ["Sensitive skin day"],
    irritationRisk: "high",
    beginnerFriendly: false,
    category: "avoid",
    explanation: "Chemical exfoliants that can be irritating on reactive days.",
    primaryBenefits: ["Exfoliation", "Texture", "Brightening"],
    cosmeticFunctions: ["Exfoliant", "pH adjuster"],
    cautionLevel: 4,
    safetyNotes: [
      "Avoid combining with other exfoliating acids",
      "Avoid on compromised barrier",
      "Use sunscreen consistently",
    ],
  },
  {
    id: "vitamin-c",
    name: "High Vitamin C",
    aliases: ["L-Ascorbic Acid"],
    supports: ["Brightening"],
    avoidWhen: ["Sensitive skin"],
    irritationRisk: "high",
    beginnerFriendly: false,
    category: "avoid",
    explanation: "Effective for brightening but may sting reactive skin.",
    primaryBenefits: ["Brightening", "Dark Spot Care", "Antioxidant"],
    cosmeticFunctions: ["Antioxidant", "Skin conditioning"],
    cautionLevel: 3,
    cautionChips: ["Very reactive skin", "Compromised barrier", "Layering with strong actives"],
  },
];

// Redness health score dipped mid-week (worse) and has been recovering since —
// higher = healthier, same convention as SkinAnalysisResult.
export const mockRednessTrend = [
  { day: "5/12", value: 50 },
  { day: "5/13", value: 47 },
  { day: "5/14", value: 40 },
  { day: "5/15", value: 32 },
  { day: "5/16", value: 28 },
  { day: "5/17", value: 45 },
  { day: "5/18", value: 58 },
];

export const mockRoutine = {
  day: "Tuesday, May 13",
  morning: ["Cleanser", "Toner", "Serum", "Moisturizer", "Sunscreen"],
  evening: ["Cleanser", "Serum", "Moisturizer"],
};

export const mockComparison = {
  from: "May 6",
  to: "Today",
  metrics: [
    { name: "Redness", from: 38, to: 28, direction: "decreased", color: "coral" as const },
    { name: "Hydration", from: 62, to: 48, direction: "decreased", color: "aqua" as const },
    { name: "Acne", from: 65, to: 68, direction: "improved", color: "sage" as const },
    { name: "Oiliness", from: 45, to: 48, direction: "improved", color: "sun" as const },
  ],
};
