import type { SkinAnalysisResult } from "./types";

export interface SkinAnalysisService {
  analyze(image?: Blob | null): Promise<SkinAnalysisResult>;
}

export const mockSkinAnalysisService: SkinAnalysisService = {
  async analyze() {
    await new Promise((r) => setTimeout(r, 1500));
    return {
      redness: 72,
      hydration: 48,
      acne: 32,
      oiliness: 52,
      texture: 55,
      pores: 41,
      analyzedAt: new Date().toISOString(),
    };
  },
};

export const ANALYSIS_STEPS = [
  "Analyzing redness",
  "Checking hydration",
  "Reviewing texture",
  "Creating today's ingredient plan",
];