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
      skinDirection: "Focus on calming redness while keeping your barrier supported today.",
    };
  },
};

// Calls our server-side proxy (src/routes/api/skin-analysis.ts), which holds the
// YouCam API key and talks to Perfect Corp's Skin Analysis API. Image validation
// (dimensions, face detection, lighting) is intentionally not duplicated here for
// the MVP — the API itself rejects unsupported images and we surface its error.
export const realSkinAnalysisService: SkinAnalysisService = {
  async analyze(image) {
    if (!image) throw new Error("No image provided");

    const formData = new FormData();
    formData.append("image", image);

    const res = await fetch("/api/skin-analysis", { method: "POST", body: formData });
    const body = await res.json();
    if (!res.ok) {
      throw new Error(body?.error ?? "Skin analysis failed");
    }
    return body as SkinAnalysisResult;
  },
};

// Single switch point for which service backs the scan flow — flip via env var
// rather than changing call sites in scan.index.tsx.
export const skinAnalysisService: SkinAnalysisService =
  import.meta.env.VITE_ENABLE_REAL_SCAN === "true"
    ? realSkinAnalysisService
    : mockSkinAnalysisService;

export const ANALYSIS_STEPS = [
  "Analyzing redness",
  "Checking hydration",
  "Reviewing texture",
  "Creating today's ingredient plan",
];
