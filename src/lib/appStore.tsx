import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { mockAnalysis, mockUser } from "@/data/mockData";
import { generateRecommendation } from "./recommendationEngine";
import { getLatestAnalysis } from "./data/analyses";
import { getCatalogProducts, type CatalogProduct } from "./data/catalog";
import {
  getShelfProductIds,
  saveToShelf as saveProductToShelf,
  removeFromShelf as removeProductFromShelf,
} from "./data/shelf";
import {
  getCustomProducts,
  addCustomProduct as addCustomProductRow,
  removeCustomProduct,
} from "./data/customProducts";
import { buildProductsFromCatalog } from "./productMatching";
import { getTodaysRecommendations } from "./productRecommendations";
import { composeRoutine, type Routine } from "./routineComposer";
import { getIngredientLibrary, type IngredientLibraryEntry } from "./data/ingredientLibrary";
import { getProfile, setOnboardingCompleted } from "./data/profile";
import type {
  DailyRecommendation,
  EventTiming,
  Product,
  ProductStatus,
  ScheduleOption,
  SkinAnalysisResult,
} from "./types";

type Reaction = "helpful" | "neutral" | "irritating" | "unknown";

interface AppState {
  user: typeof mockUser;
  analysis: SkinAnalysisResult;
  /** Full catalog, annotated with today's status — for display only. Saving
   * is what puts a product on the shelf; this list on its own never does. */
  recommendedProducts: Product[];
  /** 3-5 catalog products matched against today's skin concerns
   * (src/lib/productRecommendations.ts) — the "Recommended for you" cards.
   * Display only; saving is a separate explicit action. */
  todaysPicks: Product[];
  /** Only products the user has explicitly saved (shelf_items) — never the
   * catalog itself. */
  products: Product[];
  /** Deterministic AM/PM slot picks — src/lib/routineComposer.ts. Prefers
   * Shelf products over catalog recommendations, and never invents a
   * product for an unfillable slot. */
  routine: Routine;
  /** The curated Ingredient Library — src/routes/ingredients.index.tsx and
   * ingredients.$ingredientId.tsx, and used to link Shelf ingredient chips. */
  ingredientLibrary: IngredientLibraryEntry[];
  symptoms: string[];
  /** "What's happening?" (event TYPE) from the daily check-in — modifies
   * today's recommendation (src/lib/scheduleAdjustments.ts), never overrides
   * the skin-analysis baseline. Always paired with eventTiming below —
   * sibling fields, not nested, but together the one source of truth for
   * the user's upcoming plan (also drives the Home card). */
  scheduleTomorrow: ScheduleOption;
  /** "When is it?" (event TIMING) — "none" whenever scheduleTomorrow is
   * "none". Determines how strongly the schedule adjustment applies. */
  eventTiming: EventTiming;
  recommendation: DailyRecommendation;
  ingredientHistory: Record<string, Reaction>;
  scanCompletedToday: boolean;
  hasCompletedOnboarding: boolean;
  /** In-progress onboarding survey answers (src/routes/onboarding.tsx) —
   * lifted out of that route's local state so navigating away mid-survey
   * (e.g. Finish -> /scan/check-in) and then back doesn't remount the
   * component and silently wipe progress back to step 1. */
  onboardingStep: number;
  onboardingAnswers: string[][];
  setOnboardingStep: (step: number) => void;
  setOnboardingAnswers: (answers: string[][]) => void;
  setSymptoms: (s: string[]) => void;
  setScheduleTomorrow: (s: ScheduleOption) => void;
  setEventTiming: (t: EventTiming) => void;
  setAnalysis: (a: SkinAnalysisResult) => void;
  updateProductStatus: (id: string, status: ProductStatus) => void;
  addToShelf: (productId: string) => void;
  /** Removes either a catalog product (shelf_items) or a manually-added one
   * (custom_products) — branches internally on the "custom-" id prefix. */
  removeFromShelf: (productId: string) => void;
  /** Manually-added personal product, not part of the recommendation
   * catalog — see supabase/migrations/20260812030000_custom_products.sql. */
  addCustomProduct: (input: { brand: string; name: string; category: string }) => void;
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
  const [catalog, setCatalog] = useState<CatalogProduct[]>([]);
  const [shelfProductIds, setShelfProductIds] = useState<string[]>([]);
  const [customProducts, setCustomProducts] = useState<Product[]>([]);
  const [ingredientLibrary, setIngredientLibrary] = useState<IngredientLibraryEntry[]>([]);
  const [statusOverrides, setStatusOverrides] = useState<Record<string, ProductStatus>>({});
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [scheduleTomorrow, setScheduleTomorrow] = useState<ScheduleOption>("none");
  const [eventTiming, setEventTiming] = useState<EventTiming>("none");
  const [ingredientHistory, setIngredientHistory] = useState<Record<string, Reaction>>({});
  const [lastScanDay, setLastScanDay] = useState<string | null>(null);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [onboardingAnswers, setOnboardingAnswers] = useState<string[][]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("skingredient");
      if (raw) {
        const s = JSON.parse(raw);
        if (s.symptoms) setSymptoms(s.symptoms);
        if (s.scheduleTomorrow) setScheduleTomorrow(s.scheduleTomorrow);
        if (s.eventTiming) setEventTiming(s.eventTiming);
        if (s.ingredientHistory) setIngredientHistory(s.ingredientHistory);
        if (s.lastScanDay) setLastScanDay(s.lastScanDay);
      }
    } catch {
      // localStorage unavailable/corrupt — ignore, keep defaults.
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        "skingredient",
        JSON.stringify({ symptoms, scheduleTomorrow, eventTiming, ingredientHistory, lastScanDay }),
      );
    } catch {
      // localStorage unavailable/corrupt — ignore, keep defaults.
    }
  }, [symptoms, scheduleTomorrow, eventTiming, ingredientHistory, lastScanDay]);

  // Hydrate from Supabase on mount — pure reads, never call YouCam/Claude.
  // If the user has a real saved analysis, prefer it over mockAnalysis so a
  // reload reuses the persisted record instead of quietly reverting to mock
  // data. Best-effort: a fetch failure just keeps the mock/default state.
  useEffect(() => {
    getLatestAnalysis()
      .then((saved) => saved && setAnalysis(saved))
      .catch((err) => console.error("Failed to load latest analysis", err));

    getProfile()
      .then((profile) => profile && setHasCompletedOnboarding(profile.hasCompletedOnboarding))
      .catch((err) => console.error("Failed to load profile", err));

    getCatalogProducts()
      .then(setCatalog)
      .catch((err) => console.error("Failed to load product catalog", err));

    getShelfProductIds()
      .then(setShelfProductIds)
      .catch((err) => console.error("Failed to load shelf", err));

    getCustomProducts()
      .then(setCustomProducts)
      .catch((err) => console.error("Failed to load custom products", err));

    getIngredientLibrary()
      .then(setIngredientLibrary)
      .catch((err) => console.error("Failed to load ingredient library", err));
  }, []);

  const recommendation = useMemo(
    () =>
      generateRecommendation({
        analysis,
        symptoms,
        sensitivities: mockUser.sensitivities,
        recentActives: [],
        scheduleTomorrow,
        eventTiming,
        ingredientHistory,
      }),
    [analysis, symptoms, scheduleTomorrow, eventTiming, ingredientHistory],
  );

  // Skin concern → ingredient category → matching products, per
  // Skingredient_MVP_Implementation_Guide.md Section 6. This is the full
  // catalog annotated with today's status — display/recommendation surface
  // only. It must never be treated as "my shelf": saving is a separate,
  // explicit user action (addToShelf below), never automatic.
  const recommendedProducts = useMemo(() => {
    const computed = buildProductsFromCatalog(catalog, recommendation);
    return computed.map((p) =>
      statusOverrides[p.id] ? { ...p, status: statusOverrides[p.id] } : p,
    );
  }, [catalog, recommendation, statusOverrides]);

  const todaysPicks = useMemo(
    () => getTodaysRecommendations(catalog, analysis),
    [catalog, analysis],
  );

  // The shelf is recommendedProducts filtered down to explicitly saved
  // product IDs (shelf_items), plus the user's manually-added custom
  // products — never the catalog itself.
  const products = useMemo(() => {
    const shelfIdSet = new Set(shelfProductIds);
    return [...recommendedProducts.filter((p) => shelfIdSet.has(p.id)), ...customProducts];
  }, [recommendedProducts, shelfProductIds, customProducts]);

  // Real, persisted analyses always have an id (src/lib/types.ts); mockAnalysis
  // — the initial/fallback state until a scan is saved — never does. Routine's
  // catalog-recommendation fallback is gated on this so a brand-new/just-reset
  // user (no real scan yet) sees an empty routine instead of one silently
  // populated from mock analysis data. Shelf-owned products are unaffected —
  // saving to Shelf is a real user action regardless of scan status.
  const hasRealAnalysis = Boolean(analysis.id);

  const routine = useMemo(
    () =>
      composeRoutine(catalog, products, hasRealAnalysis ? recommendedProducts : [], recommendation),
    [catalog, products, recommendedProducts, recommendation, hasRealAnalysis],
  );

  const value: AppState = {
    user: mockUser,
    analysis,
    recommendedProducts,
    todaysPicks,
    products,
    routine,
    ingredientLibrary,
    symptoms,
    scheduleTomorrow,
    eventTiming,
    recommendation,
    ingredientHistory,
    scanCompletedToday: lastScanDay === todayKey(),
    hasCompletedOnboarding,
    onboardingStep,
    onboardingAnswers,
    setOnboardingStep,
    setOnboardingAnswers,
    setSymptoms,
    setScheduleTomorrow,
    setEventTiming,
    setAnalysis,
    updateProductStatus: (id, status) => setStatusOverrides((prev) => ({ ...prev, [id]: status })),
    addToShelf: (productId) => {
      setShelfProductIds((prev) => (prev.includes(productId) ? prev : [...prev, productId]));
      saveProductToShelf(productId).catch((err) => {
        console.error("Failed to save to shelf", err);
        setShelfProductIds((prev) => prev.filter((id) => id !== productId));
      });
    },
    removeFromShelf: (productId) => {
      if (productId.startsWith("custom-")) {
        const rawId = productId.slice("custom-".length);
        const removed = customProducts.find((p) => p.id === productId);
        setCustomProducts((prev) => prev.filter((p) => p.id !== productId));
        removeCustomProduct(rawId).catch((err) => {
          console.error("Failed to remove custom product", err);
          if (removed) setCustomProducts((prev) => [...prev, removed]);
        });
        return;
      }
      setShelfProductIds((prev) => prev.filter((id) => id !== productId));
      removeProductFromShelf(productId).catch((err) => {
        console.error("Failed to remove from shelf", err);
        setShelfProductIds((prev) => (prev.includes(productId) ? prev : [...prev, productId]));
      });
    },
    addCustomProduct: (input) => {
      addCustomProductRow(input)
        .then((product) => setCustomProducts((prev) => [...prev, product]))
        .catch((err) => console.error("Failed to add custom product", err));
    },
    recordReaction: (ingredient, r) =>
      setIngredientHistory((prev) => ({ ...prev, [ingredient.toLowerCase()]: r })),
    markScanCompleted: () => setLastScanDay(todayKey()),
    // Deliberately does NOT reset onboardingStep/onboardingAnswers: this
    // fires right as the user leaves the survey for check-in, and clearing
    // them here would wipe the very state that lets check-in's back button
    // return to the survey's last step instead of remounting at step 1.
    // resetOnboarding (a real "start over") is where that clears.
    completeOnboarding: () => {
      setHasCompletedOnboarding(true);
      setOnboardingCompleted(true).catch((err) =>
        console.error("Failed to persist onboarding completion", err),
      );
    },
    resetOnboarding: () => {
      setHasCompletedOnboarding(false);
      setOnboardingStep(0);
      setOnboardingAnswers([]);
      setOnboardingCompleted(false).catch((err) =>
        console.error("Failed to persist onboarding reset", err),
      );
    },
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAppStore() {
  const v = useContext(Ctx);
  if (!v) throw new Error("AppStore missing");
  return v;
}
