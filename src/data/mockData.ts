import type { Product, SkinAnalysisResult } from "@/lib/types";
import ceraveImg from "@/assets/product-cerave.jpg";
import centellaImg from "@/assets/product-centella.jpg";
import ahabhaImg from "@/assets/product-ahabha.jpg";

export const mockUser = {
  name: "Belle",
  streak: 12,
  // Hidden for the MVP alongside the Profile page's Skin Goals card (see
  // SHOW_SKIN_GOALS in src/routes/profile.tsx) — not persisted/editable yet.
  goals: ["Strengthen barrier", "Reduce redness", "Avoid irritation"],
  sensitivities: ["Fragrance", "Essential oils"],
};

// All fields use "higher = healthier", matching YouCam's ui_score convention
// (see normalize() in src/routes/api/skin-analysis.ts). This demo scenario is a
// reactive, slightly dehydrated skin day: low redness/texture scores, decent
// acne/oiliness/pores scores, and below-average hydration.
export const mockAnalysis: SkinAnalysisResult = {
  redness: 28,
  hydration: 48,
  oiliness: 48,
  acne: 68,
  pores: 59,
  texture: 45,
  ageSpots: 72,
  analyzedAt: new Date().toISOString(),
  skinDirection: "Focus on calming redness while keeping your barrier supported today.",
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
