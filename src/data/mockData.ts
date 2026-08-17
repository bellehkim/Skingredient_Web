import type { SkinAnalysisResult } from "@/lib/types";

export const mockUser = {
  name: "Jane",
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
