import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ShieldAlert } from "lucide-react";
import { AppShell, PageContainer } from "@/components/app/AppShell";
import { MobileHeader } from "@/components/app/MobileHeader";
import { useAppStore } from "@/lib/appStore";
import { labelsToCategories } from "@/lib/productMatching";
import {
  getProductFullIngredients,
  type ProductFullIngredients,
} from "@/lib/data/catalog";

export const Route = createFileRoute("/shelf/$productId/ingredients")({
  head: () => ({ meta: [{ title: "Full ingredient list — Skingredient" }] }),
  component: FullIngredientList,
});

function FullIngredientList() {
  const { productId } = Route.useParams();
  const { recommendation, ingredientHistory } = useAppStore();
  const [data, setData] = useState<ProductFullIngredients | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const backTo = `/shelf/${productId}`;

  useEffect(() => {
    let cancelled = false;
    getProductFullIngredients(productId)
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((err) => {
        console.error("Failed to load full ingredient list", err);
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [productId]);

  // Same label -> functional_category bridge Today's Plan/Shelf/Routine all
  // already use, so "in today's plan" here can never disagree with them.
  const todaysPlanCategories = labelsToCategories(recommendation.prioritizedIngredients);

  const keyIngredients = data?.ingredients.filter((i) => i.commonName !== null) ?? [];

  return (
    <AppShell title="Full ingredient list" back={backTo}>
      <MobileHeader title="Full ingredient list" back={backTo} />
      <PageContainer width="narrow">
        {loading ? (
          <p className="mt-6 text-center text-[13px] text-ink-muted">Loading…</p>
        ) : !data || data.ingredients.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-hairline p-4 text-center">
            <p className="text-[13px] text-ink">
              {error
                ? "Couldn't load the ingredient list. Please try again."
                : "A verified full ingredient list isn't available for this product yet."}
            </p>
          </div>
        ) : (
          <>
            {/* Product context */}
            <div className="mt-5">
              <p className="text-[13px] text-ink-muted">{data.brand}</p>
              <h1 className="mt-1 text-[22px] font-bold leading-tight text-ink">
                {data.productName}
              </h1>
            </div>

            {/* Key ingredients */}
            {keyIngredients.length > 0 && (
              <section className="mt-6">
                <p className="text-[11px] font-bold tracking-[0.14em] text-ink-muted">
                  KEY INGREDIENTS
                </p>
                <div className="mt-2.5 grid grid-cols-2 gap-2">
                  {keyIngredients.map((i) => (
                    <div
                      key={i.inciName}
                      className="rounded-2xl border border-hairline bg-white p-3"
                    >
                      <p className="text-[13px] font-semibold text-ink">{i.commonName}</p>
                      {i.benefits && i.benefits.length > 0 && (
                        <p className="mt-0.5 text-[11.5px] text-ink-muted">
                          {i.benefits.slice(0, 2).join(" · ")}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* All ingredients */}
            <section className="mt-6 pb-8">
              <p className="text-[11px] font-bold tracking-[0.14em] text-ink-muted">
                ALL INGREDIENTS
              </p>
              <p className="mt-1.5 text-[12px] leading-relaxed text-ink-muted">
                Listed in order of concentration, as declared by the manufacturer.
              </p>
              <ul className="mt-3 divide-y divide-hairline overflow-hidden rounded-2xl border border-hairline bg-white">
                {data.ingredients.map((i, index) => {
                  const inTodaysPlan = i.functionalCategories.some((c) =>
                    todaysPlanCategories.has(c),
                  );
                  const isSensitivity =
                    ingredientHistory[i.inciName.toLowerCase()] === "irritating";
                  const subtitle =
                    i.commonName && i.benefits && i.benefits.length > 0
                      ? i.benefits.slice(0, 2).join(" · ")
                      : null;

                  return (
                    <li key={i.inciName} className="flex items-start gap-3 p-3.5">
                      <span className="mt-0.5 w-5 shrink-0 text-[11px] font-medium text-ink-muted">
                        {index + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[13.5px] font-medium text-ink">{i.inciName}</p>
                        {subtitle && (
                          <p className="mt-0.5 text-[12px] text-ink-muted">{subtitle}</p>
                        )}
                        {isSensitivity ? (
                          <p className="mt-1 flex items-center gap-1 text-[11.5px] font-semibold text-coral">
                            <ShieldAlert size={12} /> Personal sensitivity
                          </p>
                        ) : (
                          inTodaysPlan && (
                            <p className="mt-1 text-[11.5px] font-semibold text-sage">
                              ✓ In today's plan
                            </p>
                          )
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          </>
        )}
      </PageContainer>
    </AppShell>
  );
}
