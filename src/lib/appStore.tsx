import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { mockAnalysis, mockEvent, mockProducts, mockUser } from "@/data/mockData";
import { generateRecommendation } from "./recommendationEngine";
import type { DailyRecommendation, Product, ProductStatus, SkinAnalysisResult, UpcomingEvent } from "./types";

type Reaction = "helpful" | "neutral" | "irritating" | "unknown";

interface AppState {
  user: typeof mockUser;
  analysis: SkinAnalysisResult;
  event: UpcomingEvent;
  products: Product[];
  symptoms: string[];
  recommendation: DailyRecommendation;
  ingredientHistory: Record<string, Reaction>;
  scanCompletedToday: boolean;
  hasCompletedOnboarding: boolean;
  setSymptoms: (s: string[]) => void;
  setAnalysis: (a: SkinAnalysisResult) => void;
  setEvent: (e: UpcomingEvent) => void;
  updateProductStatus: (id: string, status: ProductStatus) => void;
  recordReaction: (ingredient: string, r: Reaction) => void;
  markScanCompleted: () => void;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
}

const Ctx = createContext<AppState | null>(null);

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [analysis, setAnalysis] = useState<SkinAnalysisResult>(mockAnalysis);
  const [event, setEvent] = useState<UpcomingEvent>(mockEvent);
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [ingredientHistory, setIngredientHistory] = useState<Record<string, Reaction>>({});
  const [lastScanDay, setLastScanDay] = useState<string | null>(null);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("skingredient");
      if (raw) {
        const s = JSON.parse(raw);
        if (s.symptoms) setSymptoms(s.symptoms);
        if (s.ingredientHistory) setIngredientHistory(s.ingredientHistory);
        if (s.lastScanDay) setLastScanDay(s.lastScanDay);
        if (typeof s.hasCompletedOnboarding === "boolean") setHasCompletedOnboarding(s.hasCompletedOnboarding);
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        "skingredient",
        JSON.stringify({ symptoms, ingredientHistory, lastScanDay, hasCompletedOnboarding }),
      );
    } catch {}
  }, [symptoms, ingredientHistory, lastScanDay, hasCompletedOnboarding]);

  const recommendation = useMemo(
    () =>
      generateRecommendation({
        analysis,
        symptoms,
        sensitivities: mockUser.sensitivities,
        recentActives: [],
        upcomingEvent: { type: event.type, timing: event.timing },
        ingredientHistory,
      }),
    [analysis, symptoms, event, ingredientHistory],
  );

  const value: AppState = {
    user: mockUser,
    analysis,
    event,
    products,
    symptoms,
    recommendation,
    ingredientHistory,
    scanCompletedToday: lastScanDay === todayKey(),
    hasCompletedOnboarding,
    setSymptoms,
    setAnalysis,
    setEvent,
    updateProductStatus: (id, status) =>
      setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, status } : p))),
    recordReaction: (ingredient, r) =>
      setIngredientHistory((prev) => ({ ...prev, [ingredient.toLowerCase()]: r })),
    markScanCompleted: () => setLastScanDay(todayKey()),
    completeOnboarding: () => setHasCompletedOnboarding(true),
    resetOnboarding: () => setHasCompletedOnboarding(false),
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAppStore() {
  const v = useContext(Ctx);
  if (!v) throw new Error("AppStore missing");
  return v;
}