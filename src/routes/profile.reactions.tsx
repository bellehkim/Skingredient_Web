import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { AppShell, PageContainer } from "@/components/app/AppShell";
import { MobileHeader } from "@/components/app/MobileHeader";
import {
  getProductReactionHistory,
  type ProductReactionHistoryEntry,
} from "@/lib/data/productReactions";

export const Route = createFileRoute("/profile/reactions")({
  head: () => ({ meta: [{ title: "Product reaction history — Skingredient" }] }),
  component: ProductReactionHistory,
});

const REACTION_LABELS = {
  helpful: "Helpful",
  neutral: "Neutral",
  irritating: "Irritating",
  unknown: "Not sure yet",
} as const;

const REACTION_CLS = {
  helpful: "text-sage",
  neutral: "text-ink-muted",
  irritating: "text-coral",
  unknown: "text-ink-muted",
} as const;

/**
 * Minimal MVP list — brand, product name, reaction, date, and (for a
 * reported-irritating product) whether it's currently excluded from
 * recommendations. No filters/sorting/pagination: just enough to visibly
 * prove a product reaction was remembered. Deliberately product-level only
 * — Ingredient Sensitivities (src/routes/profile.sensitivities.tsx) is a
 * fully separate page reading src/lib/data/ingredientReactions.ts instead.
 */
function ProductReactionHistory() {
  const [entries, setEntries] = useState<ProductReactionHistoryEntry[] | null>(null);

  useEffect(() => {
    getProductReactionHistory()
      .then(setEntries)
      .catch((err) => {
        console.error("Failed to load product reaction history", err);
        setEntries([]);
      });
  }, []);

  return (
    <AppShell title="Product reaction history" back="/profile">
      <MobileHeader title="Product reaction history" back="/profile" />
      <PageContainer width="narrow">
        {entries === null ? (
          <p className="mt-6 text-center text-[13px] text-ink-muted">Loading…</p>
        ) : entries.length === 0 ? (
          <div className="mt-10 flex flex-col items-center text-center">
            <div className="grid h-14 w-14 place-items-center rounded-full bg-surface-muted">
              <AlertTriangle size={22} className="text-ink-muted" />
            </div>
            <h2 className="mt-4 text-[16px] font-semibold text-ink">
              No product reactions recorded yet.
            </h2>
            <p className="mt-1.5 max-w-[280px] text-[13px] leading-relaxed text-ink-muted">
              Report how a product felt from its shelf detail page and it'll show up here.
            </p>
          </div>
        ) : (
          <ul className="mt-4 divide-y divide-hairline overflow-hidden rounded-3xl border border-hairline bg-white shadow-soft">
            {entries.map((e) => (
              <li key={e.productId} className="px-4 py-3.5">
                <p className="text-[13px] text-ink-muted">{e.brand}</p>
                <p className="text-[15px] font-semibold text-ink">{e.productName}</p>

                {e.reactionType === "irritating" && (
                  <p className="mt-1.5 text-[10.5px] font-bold tracking-[0.1em] text-coral">
                    REACTION REPORTED
                  </p>
                )}

                <div className="mt-1 flex items-center justify-between">
                  <span className={`text-[12.5px] font-semibold ${REACTION_CLS[e.reactionType]}`}>
                    {REACTION_LABELS[e.reactionType]} ·{" "}
                    {new Date(e.createdAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>

                {e.reactionType === "irritating" && (
                  <p
                    className={`mt-1.5 text-[12px] font-medium ${
                      e.excludedFromRecommendations ? "text-coral" : "text-ink-muted"
                    }`}
                  >
                    {e.excludedFromRecommendations
                      ? "Excluded from recommendations"
                      : "Kept in recommendations"}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </PageContainer>
    </AppShell>
  );
}
