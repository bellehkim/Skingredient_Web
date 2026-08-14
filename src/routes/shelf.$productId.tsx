import { createFileRoute, notFound, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Heart, CheckCircle2, ListChecks, CalendarPlus } from "lucide-react";
import { AppShell, PageContainer } from "@/components/app/AppShell";
import { MobileHeader } from "@/components/app/MobileHeader";
import { StatusBadge } from "@/components/app/StatusBadge";
import { IngredientChip } from "@/components/app/IngredientChip";
import { useAppStore } from "@/lib/appStore";
import type { Reaction } from "@/lib/data/ingredientReactions";

export const Route = createFileRoute("/shelf/$productId")({
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
  } = useAppStore();
  const product = products.find((p) => p.id === productId);
  const [fav, setFav] = useState(false);
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

            <section className="mt-6 space-y-2 lg:grid lg:grid-cols-1 lg:gap-2 lg:space-y-0">
              <button className="flex w-full items-center justify-center gap-2 rounded-2xl bg-brand py-3.5 text-[14px] font-semibold text-white">
                <CalendarPlus size={16} /> Add to routine
              </button>
              <button className="flex w-full items-center justify-center gap-2 rounded-2xl border border-hairline bg-white py-3.5 text-[14px] font-semibold text-ink">
                <CheckCircle2 size={16} /> Mark as used
              </button>
              <button className="flex w-full items-center justify-center gap-2 rounded-2xl border border-hairline bg-white py-3.5 text-[14px] font-semibold text-ink">
                <ListChecks size={16} /> View full ingredient list
              </button>
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
    </AppShell>
  );
}
