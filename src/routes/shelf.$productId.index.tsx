import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Heart, CheckCircle2, ListChecks, CalendarPlus, Sun, Moon } from "lucide-react";
import { AppShell, PageContainer } from "@/components/app/AppShell";
import { MobileHeader } from "@/components/app/MobileHeader";
import { StatusBadge } from "@/components/app/StatusBadge";
import { IngredientChip } from "@/components/app/IngredientChip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useAppStore } from "@/lib/appStore";
import { isStrongActive } from "@/lib/routineComposer";
import type { Reaction } from "@/lib/data/ingredientReactions";
import type { RoutineTimeOfDay } from "@/lib/data/routineItems";
import type { Product } from "@/lib/types";

// Deliberately shelf.$productId.index.tsx, not shelf.$productId.tsx: a
// literal shelf.$productId.tsx file would make TanStack Router treat it as
// the *parent layout* for shelf.$productId.ingredients.tsx (nested under it
// via getParentRoute), which silently never renders that child page unless
// this parent also renders an <Outlet/> — same convention shelf.index.tsx
// and profile.index.tsx already use for exactly this reason.
export const Route = createFileRoute("/shelf/$productId/")({
  head: () => ({ meta: [{ title: "Product — Skingredient" }] }),
  component: ProductDetail,
});

const REACTION_LABELS = {
  helpful: "Helpful",
  neutral: "Neutral",
  irritating: "Irritating",
  unknown: "Not sure yet",
} as const;

const REACTION_TYPE_BY_LABEL: Record<
  (typeof REACTION_LABELS)[keyof typeof REACTION_LABELS],
  Reaction
> = {
  Helpful: "helpful",
  Neutral: "neutral",
  Irritating: "irritating",
  "Not sure yet": "unknown",
};

function ProductDetail() {
  const { productId } = Route.useParams();
  const {
    products,
    productsLoading,
    removeFromShelf,
    ingredientLibrary,
    productReactionHistory,
    recordProductReaction,
    excludedProductIds,
    setProductReactionExcluded,
    catalog,
    routineItems,
    addToRoutine,
    removeFromRoutine,
  } = useAppStore();
  const product = products.find((p) => p.id === productId);
  const [fav, setFav] = useState(false);
  const [routineDialogOpen, setRoutineDialogOpen] = useState(false);
  const [routineConfirmation, setRoutineConfirmation] = useState<string | null>(null);
  const navigate = useNavigate();

  // products loads asynchronously (appStore fetches catalog/shelf/custom
  // products once on mount) — on first render (including a hard refresh)
  // it's still empty, which must not be mistaken for "this product doesn't
  // exist". Only throw notFound() once loading has actually finished and
  // there's genuinely no match (same pattern as ingredients.$ingredientId).
  if (!product) {
    if (productsLoading) {
      return (
        <AppShell title="Product" back="/shelf">
          <MobileHeader title="Product detail" back="/shelf" />
          <PageContainer>
            <p className="mt-6 text-center text-[13px] text-ink-muted">Loading…</p>
          </PageContainer>
        </AppShell>
      );
    }
    throw notFound();
  }

  // product.keyIngredients are always inci_name strings (from the catalog),
  // so match against inciName here, not the library's friendlier name.
  // Ingredients outside the curated ~20 (e.g. Fragrance, Titanium Dioxide)
  // simply have no match — their chip stays plain, non-clickable text.
  const ingredientIdByInciName = new Map(
    ingredientLibrary.map((entry) => [entry.inciName.toLowerCase(), entry.id]),
  );

  // Product-level reaction (src/lib/data/productReactions.ts) — the single
  // source of truth for this card, read straight from appStore so it
  // survives a refresh with no separate local-state derivation needed.
  // Deliberately never touches ingredient_reactions/Ingredient Sensitivities.
  const reactionType = productReactionHistory[product.id];
  const reaction = reactionType ? REACTION_LABELS[reactionType] : null;
  const isExcluded = excludedProductIds.has(product.id);

  // This exact product's current manual routine placement — a Set since
  // "Both" is just "am" and "pm" both present, not a third stored value.
  const productRoutineTimes = new Set(
    routineItems.filter((item) => item.productId === product.id).map((item) => item.timeOfDay),
  );
  const routineStatusText =
    productRoutineTimes.size === 2
      ? "Morning + Evening"
      : productRoutineTimes.has("am")
        ? "Morning"
        : productRoutineTimes.has("pm")
          ? "Evening"
          : null;

  return (
    <AppShell
      title={product.name}
      back="/shelf"
      breadcrumb={[{ label: "My shelf", to: "/shelf" }, { label: product.brand }]}
    >
      <MobileHeader
        title="Product detail"
        back="/shelf"
        rightSlot={
          <button
            aria-label="Favorite"
            onClick={() => setFav((v) => !v)}
            className="grid h-9 w-9 place-items-center rounded-full"
          >
            <Heart
              size={20}
              className={fav ? "text-coral" : "text-ink-muted"}
              fill={fav ? "currentColor" : "none"}
            />
          </button>
        }
      />
      <PageContainer>
        <div className="grid items-start gap-8 lg:grid-cols-[1fr_1.1fr]">
          <div className="grid h-64 w-full place-items-center rounded-3xl border border-hairline bg-white lg:sticky lg:top-6 lg:h-[400px]">
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={`${product.brand} ${product.name}`}
                width={512}
                height={512}
                className="h-full w-full object-contain p-6"
              />
            ) : (
              <svg width="90" height="120" viewBox="0 0 52 72" fill="none">
                <rect x="14" y="4" width="24" height="8" rx="2" fill="#ffffff" stroke="#c9d3e0" />
                <rect x="8" y="14" width="36" height="52" rx="8" fill="#ffffff" stroke="#c9d3e0" />
                <rect x="12" y="30" width="28" height="14" rx="3" fill="#e8ecf2" />
              </svg>
            )}
          </div>

          <div>
            <div className="mt-5 lg:mt-0">
              <p className="text-[13px] text-ink-muted">{product.brand}</p>
              <h1 className="mt-1 text-[24px] font-bold leading-tight text-ink lg:text-[28px]">
                {product.name}
              </h1>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {product.keyIngredients.map((i) => (
                  <IngredientChip
                    key={i}
                    label={i}
                    tone="brand"
                    ingredientId={ingredientIdByInciName.get(i.toLowerCase())}
                  />
                ))}
              </div>
              <div className="mt-3">
                <StatusBadge status={product.status} />
              </div>
            </div>

            <section className="mt-6">
              <h2 className="text-[16px] font-semibold text-ink">Why this product</h2>
              {product.benefitTags && product.benefitTags.length > 0 && (
                <ul className="mt-3 space-y-2">
                  {product.benefitTags.map((b) => (
                    <li
                      key={b}
                      className="flex items-center gap-2.5 rounded-2xl bg-surface-muted px-3.5 py-2.5"
                    >
                      <CheckCircle2 size={16} className="shrink-0 text-sage" />
                      <span className="text-[13.5px] font-medium text-ink">{b}</span>
                    </li>
                  ))}
                </ul>
              )}
              {product.concern && (
                <div className="mt-3 rounded-2xl bg-coral-light p-3 text-[13px] text-ink">
                  {product.concern}
                </div>
              )}
            </section>

            {routineStatusText && (
              <p className="mt-6 text-[12.5px] font-medium text-ink-muted">
                In routine: <span className="text-ink">{routineStatusText}</span>
              </p>
            )}

            <section className={`${routineStatusText ? "mt-3" : "mt-6"} space-y-2 lg:grid lg:grid-cols-1 lg:gap-2 lg:space-y-0`}>
              <button
                onClick={() => setRoutineDialogOpen(true)}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-brand py-3.5 text-[14px] font-semibold text-white"
              >
                <CalendarPlus size={16} /> {routineStatusText ? "Edit routine" : "Add to routine"}
              </button>
              <button className="flex w-full items-center justify-center gap-2 rounded-2xl border border-hairline bg-white py-3.5 text-[14px] font-semibold text-ink">
                <CheckCircle2 size={16} /> Mark as used
              </button>
              <Link
                to="/shelf/$productId/ingredients"
                params={{ productId: product.id }}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-hairline bg-white py-3.5 text-[14px] font-semibold text-ink"
              >
                <ListChecks size={16} /> View full ingredient list
              </Link>
              <button
                onClick={() => {
                  removeFromShelf(product.id);
                  navigate({ to: "/shelf" });
                }}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-hairline bg-white py-3.5 text-[14px] font-semibold text-coral"
              >
                Remove from shelf
              </button>
            </section>

            {routineConfirmation && (
              <p className="mt-3 flex items-center gap-1.5 text-[12.5px] font-semibold text-sage">
                <CheckCircle2 size={14} /> {routineConfirmation}
              </p>
            )}
          </div>
        </div>

        <section className="mt-6 rounded-3xl border border-hairline bg-white p-4 shadow-soft">
          <p className="text-[14px] font-semibold text-ink">How did your skin react?</p>
          <div className="mt-3 grid grid-cols-2 gap-2 lg:grid-cols-4">
            {(["Helpful", "Neutral", "Irritating", "Not sure yet"] as const).map((r) => (
              <button
                key={r}
                onClick={() => recordProductReaction(product.id, REACTION_TYPE_BY_LABEL[r])}
                className={`rounded-xl border py-2.5 text-[13px] font-medium ${
                  reaction === r
                    ? "border-brand bg-brand text-white"
                    : "border-hairline bg-white text-ink"
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          {reactionType === "irritating" && (
            <div className="mt-4 border-t border-hairline pt-4">
              <p className="flex items-center gap-1.5 text-[13px] font-semibold text-sage">
                <CheckCircle2 size={15} /> Reaction saved
              </p>
              <p className="mt-0.5 text-[12.5px] text-ink-muted">
                Added to your product reaction history.
              </p>

              <p className="mt-4 text-[13px] font-medium text-ink">
                Exclude this product from your routine and recommendations?
              </p>
              <p className="mt-1 text-[11px] text-ink-muted">
                Since you reported irritation, we recommend no longer suggesting or routining this
                product.
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  onClick={() => setProductReactionExcluded(product.id, true)}
                  className={`rounded-xl border py-2.5 text-[13px] font-medium ${
                    isExcluded
                      ? "border-brand bg-brand text-white"
                      : "border-hairline bg-white text-ink"
                  }`}
                >
                  Exclude product
                </button>
                <button
                  onClick={() => setProductReactionExcluded(product.id, false)}
                  className={`rounded-xl border py-2.5 text-[13px] font-medium ${
                    !isExcluded
                      ? "border-brand bg-brand text-white"
                      : "border-hairline bg-white text-ink"
                  }`}
                >
                  Keep it anyway
                </button>
              </div>
            </div>
          )}
        </section>

        <p className="mt-6 text-center text-[11px] text-ink-muted">
          Skingredient provides cosmetic skincare guidance and does not diagnose medical conditions.
        </p>
      </PageContainer>

      <AddToRoutineDialog
        open={routineDialogOpen}
        onOpenChange={setRoutineDialogOpen}
        product={product}
        catalog={catalog}
        currentTimes={productRoutineTimes}
        isExcluded={isExcluded}
        onSave={(additions, removals) => {
          for (const t of removals) removeFromRoutine(product.id, t);
          if (additions.length > 0) {
            addToRoutine(product.id, additions);
            setRoutineConfirmation(
              additions.length === 2
                ? "Added to your morning and evening routine."
                : additions[0] === "am"
                  ? "Added to your morning routine."
                  : "Added to your evening routine.",
            );
          }
          setRoutineDialogOpen(false);
        }}
      />
    </AppShell>
  );
}

function AddToRoutineDialog({
  open,
  onOpenChange,
  product,
  catalog,
  currentTimes,
  isExcluded,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product;
  catalog: Parameters<typeof isStrongActive>[1];
  currentTimes: Set<RoutineTimeOfDay>;
  isExcluded: boolean;
  onSave: (additions: RoutineTimeOfDay[], removals: RoutineTimeOfDay[]) => void;
}) {
  const [selected, setSelected] = useState<Set<RoutineTimeOfDay>>(new Set());
  const [confirmingExcluded, setConfirmingExcluded] = useState(false);

  // Reseed local toggle state from the product's real current placement
  // every time the sheet opens — a plain useEffect on `open`, not an
  // onOpenChange hook, since `open` can flip to true from the parent's own
  // "Add to routine"/"Edit routine" button click, which never calls
  // onOpenChange itself (Radix only invokes that for its own close
  // interactions like Escape/overlay click).
  const [wasOpen, setWasOpen] = useState(false);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setSelected(new Set(currentTimes));
      setConfirmingExcluded(false);
    }
  }

  const toggle = (t: RoutineTimeOfDay) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t);
      else next.add(t);
      return next;
    });
  };

  const additions = Array.from(selected).filter((t) => !currentTimes.has(t)) as RoutineTimeOfDay[];
  const removals = Array.from(currentTimes).filter((t) => !selected.has(t)) as RoutineTimeOfDay[];
  const morningWarning = selected.has("am") && isStrongActive(product, catalog);
  const eveningWarning = selected.has("pm") && product.category === "Sunscreen";

  const handleSaveTap = () => {
    if (additions.length > 0 && isExcluded && !confirmingExcluded) {
      setConfirmingExcluded(true);
      return;
    }
    onSave(additions, removals);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[380px] rounded-3xl border border-hairline bg-white p-6 shadow-lift">
        {confirmingExcluded ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-[17px] font-bold text-ink">Add to routine</DialogTitle>
            </DialogHeader>
            <p className="text-[13px] leading-relaxed text-ink">
              You previously reported irritation with this product.
            </p>
            <DialogFooter>
              <button
                onClick={() => setConfirmingExcluded(false)}
                className="w-full rounded-2xl border border-hairline bg-white py-3 text-[14px] font-semibold text-ink sm:w-auto sm:px-6"
              >
                Cancel
              </button>
              <button
                onClick={() => onSave(additions, removals)}
                className="w-full rounded-2xl bg-brand py-3 text-[14px] font-semibold text-white sm:w-auto sm:px-6"
              >
                Add anyway
              </button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-[17px] font-bold text-ink">Add to routine</DialogTitle>
            </DialogHeader>
            <p className="text-[13px] text-ink-muted">Choose when to use this product.</p>
            <div className="mt-1 grid grid-cols-2 gap-2">
              <button
                onClick={() => toggle("am")}
                className={`flex items-center justify-center gap-1.5 rounded-xl border py-2.5 text-[13px] font-medium ${
                  selected.has("am")
                    ? "border-brand bg-brand text-white"
                    : "border-hairline bg-white text-ink"
                }`}
              >
                <Sun size={14} /> Morning
              </button>
              <button
                onClick={() => toggle("pm")}
                className={`flex items-center justify-center gap-1.5 rounded-xl border py-2.5 text-[13px] font-medium ${
                  selected.has("pm")
                    ? "border-brand bg-brand text-white"
                    : "border-hairline bg-white text-ink"
                }`}
              >
                <Moon size={14} /> Evening
              </button>
            </div>
            {(morningWarning || eveningWarning) && (
              <p className="text-[11.5px] leading-relaxed text-ink-muted">
                {morningWarning
                  ? "This product contains an active typically used in the evening."
                  : "Sunscreen is typically used in the morning."}
              </p>
            )}
            <DialogFooter>
              <button
                onClick={() => onOpenChange(false)}
                className="w-full rounded-2xl border border-hairline bg-white py-3 text-[14px] font-semibold text-ink sm:w-auto sm:px-6"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveTap}
                disabled={additions.length === 0 && removals.length === 0}
                className="w-full rounded-2xl bg-brand py-3 text-[14px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto sm:px-6"
              >
                Save
              </button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
