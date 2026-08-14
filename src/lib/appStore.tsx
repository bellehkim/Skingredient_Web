import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { mockUser } from "@/data/mockData";
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
import {
  getIngredientReactions,
  upsertIngredientReaction,
  removeIngredientReaction,
  EMPTY_INGREDIENT_REACTIONS,
  type Reaction,
} from "./data/ingredientReactions";
import {
  getProductReactions,
  upsertProductReaction,
  setProductReactionExcluded as setProductReactionExcludedRow,
  EMPTY_PRODUCT_REACTIONS,
} from "./data/productReactions";
import { getTodaysCheckIn, upsertTodaysCheckIn, type TodaysCheckIn } from "./data/checkins";
import { generateAndPersistSkinStrategy } from "./skinStrategyFlow";
import { todayDateString } from "./date";
import type {
  DailyRecommendation,
  EventTiming,
  Product,
  ProductStatus,
  ScheduleOption,
  SkinAnalysisResult,
} from "./types";

// Used only when there's no analysis from *today* — keeps Shelf/Routine/
// Ingredients pages functioning (neutral "optional" statuses, empty
// prioritize/avoid lists) without ever computing against a stale
// yesterday-or-older analysis or the mockAnalysis dev fixture as if it were
// real personalization. See generateRecommendation() in
// recommendationEngine.ts for the real computation this stands in for.
const EMPTY_SYMPTOMS: string[] = [];

const EMPTY_RECOMMENDATION: DailyRecommendation = {
  direction: "hydration-support",
  displayName: "No scan yet",
  explanation: "Complete a skin scan to get personalized recommendations.",
  prioritizedIngredients: [],
  avoidedIngredients: [],
  riskLevel: "low",
};

interface AppState {
  user: typeof mockUser;
  /** The user's most recent persisted analysis, or null until they've
   * completed a real (or explicit mock-mode) scan — see
   * src/lib/skinAnalysisService.ts. Never defaults to the mockAnalysis dev
   * fixture (src/data/mockData.ts), which exists only for tests/manual
   * fixtures now, not as production app state. May be an older analysis
   * from a previous day — see `scanCompletedToday` for "is this today's". */
  analysis: SkinAnalysisResult | null;
  /** True until the initial getLatestAnalysis() fetch has settled. On first
   * render/hard refresh `analysis` is null simply because the fetch hasn't
   * resolved yet — routes gating on "no report yet" (src/routes/results.tsx)
   * must check this first, so a real analysis doesn't briefly flash an
   * empty state before it loads. */
  analysisLoading: boolean;
  /** Full catalog, annotated with today's status — for display only. Saving
   * is what puts a product on the shelf; this list on its own never does. */
  recommendedProducts: Product[];
  /** 3-5 catalog products matched against today's skin concerns
   * (src/lib/productRecommendations.ts) — the "Recommended for you" cards.
   * Empty unless `scanCompletedToday` — never matched against a stale
   * previous-day analysis. Display only; saving is a separate action. */
  todaysPicks: Product[];
  /** Only products the user has explicitly saved (shelf_items) — never the
   * catalog itself. */
  products: Product[];
  /** True until the catalog/shelf/custom-product fetches that feed `products`
   * have all settled. On first render (including a hard refresh) `products`
   * is empty simply because those fetches haven't resolved yet — routes doing
   * `products.find(...)` must check this before treating "not found yet" as
   * "doesn't exist" (see src/routes/shelf.$productId.tsx). */
  productsLoading: boolean;
  /** Deterministic AM/PM slot picks — src/lib/routineComposer.ts. Prefers
   * Shelf products over catalog recommendations, and never invents a
   * product for an unfillable slot. Personalized only when
   * `scanCompletedToday` — otherwise built from EMPTY_RECOMMENDATION. */
  routine: Routine;
  /** The curated Ingredient Library — src/routes/ingredients.index.tsx and
   * ingredients.$ingredientId.tsx, and used to link Shelf ingredient chips. */
  ingredientLibrary: IngredientLibraryEntry[];
  /** Today's Daily Check-in symptoms, or [] if not checked in today —
   * derived from the persisted daily_checkins row (src/lib/data/checkins.ts),
   * never yesterday's. */
  symptoms: string[];
  /** "What's happening?" (event TYPE) from today's Daily Check-in — modifies
   * today's recommendation (src/lib/scheduleAdjustments.ts), never overrides
   * the skin-analysis baseline. "none" if not checked in today. */
  scheduleTomorrow: ScheduleOption;
  /** "When is it?" (event TIMING) — "none" whenever scheduleTomorrow is
   * "none". Determines how strongly the schedule adjustment applies. */
  eventTiming: EventTiming;
  /** Computed from today's analysis + today's check-in only — EMPTY_RECOMMENDATION
   * whenever `scanCompletedToday` is false, so it never combines today's
   * check-in with a stale analysis or fabricates a plan with no scan at all. */
  recommendation: DailyRecommendation;
  ingredientHistory: Record<string, Reaction>;
  /** Original-case inci_name of every ingredient reported "irritating" — for
   * AI Skin Strategy context (src/lib/skinStrategyFlow.ts). */
  irritatingIngredientNames: string[];
  /** functional_category of every ingredient reported "irritating" — passed
   * into generateRecommendation() calls made outside this store (e.g.
   * src/lib/skinStrategyFlow.ts's recommendation_snapshot) so they get the
   * same category bridge the live `recommendation` above uses. */
  irritatingCategories: Set<string>;
  /** True only if today's Daily Check-in has been persisted (daily_checkins
   * has a row for today) — a real server-side date boundary, not a
   * client-only flag. */
  checkInCompletedToday: boolean;
  /** True only once a real analysis (has an id) was captured today —
   * derived from analysis.analyzedAt, not from check-in. This — not
   * "analysis !== null" — is the gate for all personalization below, so a
   * previous day's scan is never silently combined with today's check-in. */
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
  /** Removes an ingredient sensitivity entirely (src/routes/profile.sensitivities.tsx)
   * — "Add" reuses recordReaction(inciName, "irritating") directly; this is
   * the one extra action "remove" needs, since it's a real delete, not just
   * overwriting the reaction type. */
  removeIngredientSensitivity: (ingredient: string) => void;
  /** Current product-level reaction per product id (src/lib/data/productReactions.ts)
   * — separate from ingredientHistory above, never converted into an
   * ingredient sensitivity. Powers the "REACTION REPORTED" status and the
   * Product Reaction History view (src/routes/profile.reactions.tsx). */
  productReactionHistory: Record<string, Reaction>;
  /** product ids currently excluded from Recommended for You/Routine because
   * of a reported-irritating reaction — the same set `recommendedProducts`/
   * `todaysPicks`/`routine` are built from. Exposed raw (not just via the
   * derived "reaction-reported" status) so the Shelf product page can show
   * the correct "Exclude it" vs "Keep it anyway" selected state even though
   * `product.status` alone can't distinguish "kept anyway" from other
   * unrelated skip-today reasons. */
  excludedProductIds: Set<string>;
  /** Saves a product-level reaction (Step 1 of the Shelf reaction flow).
   * "irritating" defaults to excluded from Recommended for You/Routine —
   * see setProductReactionExcluded to override that. Helpful/Neutral/Not
   * sure yet just record history with no exclusion effect. */
  recordProductReaction: (productId: string, r: Reaction) => void;
  /** The Step 2 follow-up after reporting "irritating": "Exclude it"
   * (excluded=true, already the default) vs "Keep it anyway" (excluded=false).
   * Only meaningful for a product already reported irritating — never
   * changes reaction_type, never touches ingredient_reactions. */
  setProductReactionExcluded: (productId: string, excluded: boolean) => void;
  /**
   * Persists today's Daily Check-in (upsert — resubmitting today updates
   * today's row, never a duplicate). If today's scan already exists, this
   * also immediately combines it with the just-submitted check-in to
   * generate (or, if a strategy already exists, just refresh the
   * deterministic recommendation_snapshot for) AI Skin Strategy — see
   * src/lib/skinStrategyFlow.ts — and updates `analysis` in place so
   * Results reflects it without a refresh. Returns whether today's scan
   * already existed, so the caller (src/routes/scan.check-in.tsx) knows
   * whether to go straight to Results or on to the scan step. Throws if the
   * check-in itself fails to persist — this is the page's primary action,
   * not a best-effort background write, so the caller should surface the
   * failure rather than navigate as if it succeeded.
   */
  submitTodaysCheckIn: (input: TodaysCheckIn) => Promise<{ hasTodaysScan: boolean }>;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
}

const Ctx = createContext<AppState | null>(null);

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [analysis, setAnalysis] = useState<SkinAnalysisResult | null>(null);
  const [catalog, setCatalog] = useState<CatalogProduct[]>([]);
  const [shelfProductIds, setShelfProductIds] = useState<string[]>([]);
  const [customProducts, setCustomProducts] = useState<Product[]>([]);
  const [ingredientLibrary, setIngredientLibrary] = useState<IngredientLibraryEntry[]>([]);
  const [statusOverrides, setStatusOverrides] = useState<Record<string, ProductStatus>>({});
  const [todaysCheckIn, setTodaysCheckIn] = useState<TodaysCheckIn | null>(null);
  const [reactionsData, setReactionsData] = useState(EMPTY_INGREDIENT_REACTIONS);
  const [productReactionsData, setProductReactionsData] = useState(EMPTY_PRODUCT_REACTIONS);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [onboardingAnswers, setOnboardingAnswers] = useState<string[][]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [analysisLoading, setAnalysisLoading] = useState(true);

  // Hydrate from Supabase on mount — pure reads, never call YouCam/Claude.
  // Best-effort: a fetch failure just keeps the empty/default state.
  useEffect(() => {
    getLatestAnalysis()
      .then((saved) => saved && setAnalysis(saved))
      .catch((err) => console.error("Failed to load latest analysis", err))
      .finally(() => setAnalysisLoading(false));

    getProfile()
      .then((profile) => profile && setHasCompletedOnboarding(profile.hasCompletedOnboarding))
      .catch((err) => console.error("Failed to load profile", err));

    Promise.allSettled([
      getCatalogProducts().then(setCatalog),
      getShelfProductIds().then(setShelfProductIds),
      getCustomProducts().then(setCustomProducts),
    ])
      .then((results) => {
        results.forEach((r, i) => {
          if (r.status === "rejected") {
            const label = ["catalog", "shelf", "custom products"][i];
            console.error(`Failed to load ${label}`, r.reason);
          }
        });
      })
      .finally(() => setProductsLoading(false));

    getIngredientLibrary()
      .then(setIngredientLibrary)
      .catch((err) => console.error("Failed to load ingredient library", err));

    getIngredientReactions()
      .then(setReactionsData)
      .catch((err) => console.error("Failed to load ingredient reactions", err));

    getProductReactions()
      .then(setProductReactionsData)
      .catch((err) => console.error("Failed to load product reactions", err));

    getTodaysCheckIn()
      .then(setTodaysCheckIn)
      .catch((err) => console.error("Failed to load today's check-in", err));
  }, []);

  // Derived from the persisted daily_checkins row, not local/localStorage
  // state — [] / "none" whenever there's no row for today, so a stale
  // previous day's check-in can never leak into today's context. Falls back
  // to the shared EMPTY_SYMPTOMS (not a fresh `[]` literal) so the
  // recommendation useMemo below doesn't see a "changed" dependency on
  // every render while there's no check-in.
  const symptoms = todaysCheckIn?.symptoms ?? EMPTY_SYMPTOMS;
  const scheduleTomorrow = todaysCheckIn?.scheduleOption ?? "none";
  const eventTiming = todaysCheckIn?.eventTiming ?? "none";
  const checkInCompletedToday = todaysCheckIn !== null;

  const scanCompletedToday =
    analysis !== null &&
    Boolean(analysis.id) &&
    todayDateString(new Date(analysis.analyzedAt)) === todayDateString();
  // The one thing personalization is allowed to read — null whenever
  // today's scan doesn't exist, even if `analysis` holds a real (but older)
  // analysis. Prevents today's check-in from ever combining with
  // yesterday's (or any other day's) scan.
  const todaysAnalysis = scanCompletedToday ? analysis : null;

  const recommendation = useMemo(
    () =>
      todaysAnalysis
        ? generateRecommendation({
            analysis: todaysAnalysis,
            symptoms,
            sensitivities: mockUser.sensitivities,
            recentActives: [],
            scheduleTomorrow,
            eventTiming,
            ingredientHistory: reactionsData.history,
            irritatingCategories: reactionsData.irritatingCategories,
          })
        : EMPTY_RECOMMENDATION,
    [todaysAnalysis, symptoms, scheduleTomorrow, eventTiming, reactionsData],
  );

  // Skin concern → ingredient category → matching products, per
  // Skingredient_MVP_Implementation_Guide.md Section 6. This is the full
  // catalog annotated with today's status — display/recommendation surface
  // only. It must never be treated as "my shelf": saving is a separate,
  // explicit user action (addToShelf below), never automatic.
  const recommendedProducts = useMemo(() => {
    const computed = buildProductsFromCatalog(
      catalog,
      recommendation,
      reactionsData.irritatingIngredients,
      productReactionsData.excludedProductIds,
    );
    return computed.map((p) =>
      statusOverrides[p.id] ? { ...p, status: statusOverrides[p.id] } : p,
    );
  }, [catalog, recommendation, statusOverrides, reactionsData, productReactionsData]);

  // recommendation already collapses to EMPTY_RECOMMENDATION (empty
  // prioritizedIngredients) whenever there's no todaysAnalysis, so this
  // naturally returns [] then too — no separate null-guard needed. Reads
  // the same `recommendation` Today's Plan/Shelf/Routine use, never an
  // independently-derived concern list.
  const todaysPicks = useMemo(
    () =>
      getTodaysRecommendations(
        catalog,
        recommendation,
        reactionsData.irritatingIngredients,
        productReactionsData.excludedProductIds,
      ),
    [catalog, recommendation, reactionsData, productReactionsData],
  );

  // The shelf is recommendedProducts filtered down to explicitly saved
  // product IDs (shelf_items), plus the user's manually-added custom
  // products — never the catalog itself.
  const products = useMemo(() => {
    const shelfIdSet = new Set(shelfProductIds);
    return [...recommendedProducts.filter((p) => shelfIdSet.has(p.id)), ...customProducts];
  }, [recommendedProducts, shelfProductIds, customProducts]);

  const routine = useMemo(
    () =>
      composeRoutine(
        catalog,
        products,
        todaysAnalysis ? recommendedProducts : [],
        recommendation,
        reactionsData.irritatingIngredients,
        productReactionsData.excludedProductIds,
      ),
    [
      catalog,
      products,
      recommendedProducts,
      recommendation,
      todaysAnalysis,
      reactionsData,
      productReactionsData,
    ],
  );

  const value: AppState = {
    user: mockUser,
    analysis,
    analysisLoading,
    recommendedProducts,
    todaysPicks,
    products,
    productsLoading,
    routine,
    ingredientLibrary,
    symptoms,
    scheduleTomorrow,
    eventTiming,
    recommendation,
    ingredientHistory: reactionsData.history,
    productReactionHistory: productReactionsData.history,
    excludedProductIds: productReactionsData.excludedProductIds,
    irritatingIngredientNames: reactionsData.irritatingIngredientNames,
    irritatingCategories: reactionsData.irritatingCategories,
    checkInCompletedToday,
    scanCompletedToday,
    hasCompletedOnboarding,
    onboardingStep,
    onboardingAnswers,
    setOnboardingStep,
    setOnboardingAnswers,
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
    // Optimistically update local state, then persist; on failure, refetch
    // from Supabase so the UI can't drift from the real persisted state.
    recordReaction: (ingredient, r) => {
      const name = ingredient.toLowerCase();
      setReactionsData((prev) => {
        const history = { ...prev.history, [name]: r };
        const irritatingIngredients = new Set(prev.irritatingIngredients);
        const irritatingIngredientNames = prev.irritatingIngredientNames.filter(
          (n) => n.toLowerCase() !== name,
        );
        if (r === "irritating") {
          irritatingIngredients.add(name);
          irritatingIngredientNames.push(ingredient);
        } else {
          irritatingIngredients.delete(name);
        }
        // Category set can only grow correctly via a real refetch (we don't
        // have functional_category client-side here) — recordReaction's
        // Supabase call below triggers that refetch regardless of outcome.
        return { ...prev, history, irritatingIngredients, irritatingIngredientNames };
      });
      upsertIngredientReaction(ingredient, r)
        .then(() => getIngredientReactions())
        .then(setReactionsData)
        .catch((err) => {
          console.error("Failed to save ingredient reaction", err);
          getIngredientReactions()
            .then(setReactionsData)
            .catch((refetchErr) =>
              console.error("Failed to reload ingredient reactions", refetchErr),
            );
        });
    },
    removeIngredientSensitivity: (ingredient) => {
      const name = ingredient.toLowerCase();
      setReactionsData((prev) => {
        const { [name]: _removed, ...history } = prev.history;
        const irritatingIngredients = new Set(prev.irritatingIngredients);
        irritatingIngredients.delete(name);
        const irritatingIngredientNames = prev.irritatingIngredientNames.filter(
          (n) => n.toLowerCase() !== name,
        );
        // irritatingCategories can only shrink correctly via a real refetch
        // (removing one ingredient doesn't necessarily remove a category
        // another irritating ingredient still shares) — the call below
        // triggers that refetch regardless of outcome.
        return { ...prev, history, irritatingIngredients, irritatingIngredientNames };
      });
      removeIngredientReaction(ingredient)
        .then(() => getIngredientReactions())
        .then(setReactionsData)
        .catch((err) => {
          console.error("Failed to remove ingredient sensitivity", err);
          getIngredientReactions()
            .then(setReactionsData)
            .catch((refetchErr) =>
              console.error("Failed to reload ingredient reactions", refetchErr),
            );
        });
    },
    // Optimistically update local state, then persist; on failure, refetch
    // from Supabase so the UI can't drift from the real persisted state.
    // Never writes to ingredient_reactions — product reactions stay a fully
    // separate signal (src/lib/data/productReactions.ts).
    recordProductReaction: (productId, r) => {
      setProductReactionsData((prev) => {
        const history = { ...prev.history, [productId]: r };
        const excludedProductIds = new Set(prev.excludedProductIds);
        if (r === "irritating") {
          excludedProductIds.add(productId);
        } else {
          excludedProductIds.delete(productId);
        }
        return { history, excludedProductIds };
      });
      upsertProductReaction(productId, r)
        .then(() => getProductReactions())
        .then(setProductReactionsData)
        .catch((err) => {
          console.error("Failed to save product reaction", err);
          getProductReactions()
            .then(setProductReactionsData)
            .catch((refetchErr) => console.error("Failed to reload product reactions", refetchErr));
        });
    },
    setProductReactionExcluded: (productId, excluded) => {
      setProductReactionsData((prev) => {
        const excludedProductIds = new Set(prev.excludedProductIds);
        if (excluded) {
          excludedProductIds.add(productId);
        } else {
          excludedProductIds.delete(productId);
        }
        return { ...prev, excludedProductIds };
      });
      setProductReactionExcludedRow(productId, excluded).catch((err) => {
        console.error("Failed to update product reaction exclusion", err);
        getProductReactions()
          .then(setProductReactionsData)
          .catch((refetchErr) => console.error("Failed to reload product reactions", refetchErr));
      });
    },
    submitTodaysCheckIn: async (input) => {
      const saved = await upsertTodaysCheckIn(input);
      setTodaysCheckIn(saved);

      // scanCompletedToday/analysis reflect this render's state, which is
      // accurate here: nothing about `analysis` changes as a side effect of
      // checking in, only a scan itself (or the enrichment below) does.
      if (!scanCompletedToday || !analysis) {
        return { hasTodaysScan: false };
      }

      const enriched = await generateAndPersistSkinStrategy({
        analysis,
        symptoms: saved.symptoms,
        scheduleTomorrow: saved.scheduleOption,
        eventTiming: saved.eventTiming,
        ingredientHistory: reactionsData.history,
        irritatingCategories: reactionsData.irritatingCategories,
        irritatingIngredientNames: reactionsData.irritatingIngredientNames,
        shelfCategories: Array.from(new Set(products.map((p) => p.category))),
      });
      if (enriched) setAnalysis(enriched);

      return { hasTodaysScan: true };
    },
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
