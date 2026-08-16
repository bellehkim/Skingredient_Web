import type { Product } from "@/lib/types";

/**
 * The "Recommended for you" card list — shared by src/routes/results.tsx
 * (today's live picks) and src/routes/history.$analysisId.tsx (a past date's
 * frozen product-id snapshot resolved against the current catalog). Purely
 * presentational: callers decide where `products` and `shelfIds` come from,
 * so a historical view can never accidentally recompute today's live
 * recommendation, and "Save to shelf" always acts on the real, current
 * shelf regardless of which date is being viewed.
 */
export function RecommendedForYouSection({
  products,
  shelfIds,
  onSave,
}: {
  products: Product[];
  shelfIds: Set<string>;
  onSave: (productId: string) => void;
}) {
  if (products.length === 0) return null;

  return (
    <section className="mt-4 rounded-3xl border border-hairline bg-white p-5 shadow-soft">
      <h3 className="text-[15px] font-semibold text-ink">Recommended for you</h3>
      <div className="mt-3 space-y-2">
        {products.map((p) => {
          const saved = shelfIds.has(p.id);
          return (
            <div
              key={p.id}
              className="flex items-center justify-between gap-3 rounded-2xl border border-hairline p-3"
            >
              <div className="min-w-0">
                <p className="truncate text-[13px] text-ink-muted">
                  {p.brand} · {p.category}
                </p>
                <p className="truncate text-[14px] font-semibold text-ink">{p.name}</p>
                <p className="mt-0.5 text-[12px] text-ink-muted">{p.reason}</p>
                {p.keyIngredients.length > 0 && (
                  <p className="mt-1 text-[11.5px] font-medium text-ink">
                    Contains: {p.keyIngredients.join(", ")}
                  </p>
                )}
              </div>
              <button
                onClick={() => onSave(p.id)}
                disabled={saved}
                className={`shrink-0 rounded-full px-3.5 py-2 text-[12.5px] font-semibold ${
                  saved ? "bg-surface-muted text-ink-muted" : "bg-brand text-white"
                }`}
              >
                {saved ? "Saved" : "Save to shelf"}
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
