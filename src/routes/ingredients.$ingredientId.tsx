import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, PageContainer } from "@/components/app/AppShell";
import { MobileHeader } from "@/components/app/MobileHeader";
import { useAppStore } from "@/lib/appStore";
import { ShieldAlert, Info } from "lucide-react";
import type { ProductStatus } from "@/lib/types";

export const Route = createFileRoute("/ingredients/$ingredientId")({
  head: () => ({ meta: [{ title: "Ingredient — Skingredient" }] }),
  component: IngredientDetail,
});

const STATUS_LINE: Record<ProductStatus, { text: string; cls: string }> = {
  "use-today": { text: "✓ Fits today's plan", cls: "text-sage" },
  optional: { text: "✓ Optional today", cls: "text-[#a1770b]" },
  "skip-today": { text: "⚠ Skip today", cls: "text-coral" },
  "reaction-reported": { text: "⚠ Reaction reported", cls: "text-coral" },
};

function IngredientDetail() {
  const { ingredientId } = Route.useParams();
  const { ingredientLibrary, products, ingredientHistory } = useAppStore();
  // Demo-only product photos aren't committed (see src/data/productImages.ts)
  // — per-product so one 404 doesn't affect other cards, falls back to the
  // empty ring box on a clone without that local-only folder.
  const [failedImageIds, setFailedImageIds] = useState<Set<string>>(new Set());

  // ingredientLibrary loads asynchronously (appStore fetches it once on
  // mount) — on first render (including SSR) it's still empty, which must
  // not be mistaken for "this ingredient doesn't exist". Only throw
  // notFound() once the library has actually loaded and genuinely has no
  // matching entry.
  if (ingredientLibrary.length === 0) {
    return (
      <AppShell title="Ingredient" back="/ingredients">
        <MobileHeader title="Ingredient" back="/ingredients" />
        <PageContainer>
          <p className="mt-6 text-center text-[13px] text-ink-muted">Loading…</p>
        </PageContainer>
      </AppShell>
    );
  }

  const entry = ingredientLibrary.find((e) => e.id === ingredientId);
  if (!entry) throw notFound();

  const nameKey = entry.inciName.toLowerCase();
  const personalSensitivity = ingredientHistory[nameKey] === "irritating";
  // product.keyIngredients are inci_name strings — match against inciName,
  // not the friendlier display name.
  const matchedProducts = products.filter((p) =>
    p.keyIngredients.some((k) => k.toLowerCase() === nameKey),
  );

  return (
    <AppShell
      title={entry.name}
      back="/ingredients"
      breadcrumb={[{ label: "Ingredients", to: "/ingredients" }, { label: entry.name }]}
    >
      <MobileHeader title={entry.name} back="/ingredients" />
      <PageContainer>
        <div className="grid items-start gap-8 lg:grid-cols-[1.35fr_1fr]">
          <div>
            {/* What it does */}
            <section className="mt-6">
              <p className="text-[11px] font-bold tracking-[0.14em] text-ink-muted">WHAT IT DOES</p>
              <p className="mt-2.5 text-[14px] leading-relaxed text-ink">{entry.description}</p>
            </section>

            {/* Benefits */}
            <section className="mt-6">
              <p className="text-[11px] font-bold tracking-[0.14em] text-ink-muted">BENEFITS</p>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {entry.benefits.map((b) => (
                  <span
                    key={b}
                    className="rounded-full bg-brand-light px-3 py-1.5 text-[12.5px] font-medium text-brand"
                  >
                    {b}
                  </span>
                ))}
              </div>
            </section>

            {/* Best for */}
            <section className="mt-6">
              <p className="text-[11px] font-bold tracking-[0.14em] text-ink-muted">BEST FOR</p>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {entry.bestFor.map((b) => (
                  <span
                    key={b}
                    className="rounded-full bg-sage-light px-3 py-1.5 text-[12.5px] font-medium text-sage"
                  >
                    {b}
                  </span>
                ))}
              </div>
            </section>

            {/* Caution */}
            <section className="mt-6">
              <p className="text-[11px] font-bold tracking-[0.14em] text-ink-muted">CAUTION</p>
              {personalSensitivity ? (
                <div className="mt-3">
                  <div className="flex items-center gap-2 text-coral">
                    <ShieldAlert size={16} />
                    <p className="text-[12.5px] font-bold tracking-[0.06em]">
                      PERSONAL SENSITIVITY
                    </p>
                  </div>
                  <p className="mt-2 text-[13px] text-ink">
                    You've previously reported irritation to this ingredient.
                  </p>
                </div>
              ) : (
                <div className="mt-2.5 flex items-start gap-2 text-ink-muted">
                  <Info size={16} className="mt-0.5 shrink-0" />
                  <p className="text-[13px] leading-relaxed">{entry.caution}</p>
                </div>
              )}
            </section>
          </div>

          {/* Found on My Shelf */}
          <section className="mt-6">
            <p className="text-[11px] font-bold tracking-[0.14em] text-ink-muted">
              FOUND ON MY SHELF
            </p>
            {matchedProducts.length > 0 ? (
              <ul className="mt-3 space-y-2">
                {matchedProducts.map((p) => (
                  <li key={p.id}>
                    <Link
                      to="/shelf/$productId"
                      params={{ productId: p.id }}
                      className="flex items-center gap-3 rounded-2xl border border-hairline bg-white p-3 shadow-soft"
                    >
                      <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-xl bg-white ring-1 ring-hairline">
                        {p.imageUrl && !failedImageIds.has(p.id) && (
                          <img
                            src={p.imageUrl}
                            alt={`${p.brand} ${p.name}`}
                            loading="lazy"
                            width={56}
                            height={56}
                            className="h-full min-h-0 w-full min-w-0 object-contain p-1.5"
                            onError={() =>
                              setFailedImageIds((prev) => new Set(prev).add(p.id))
                            }
                          />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[12.5px] text-ink-muted">{p.brand}</p>
                        <p className="truncate text-[14px] font-semibold text-ink">{p.name}</p>
                        <p
                          className={`mt-0.5 text-[12px] font-semibold ${STATUS_LINE[p.status].cls}`}
                        >
                          {STATUS_LINE[p.status].text}
                        </p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="mt-3 rounded-2xl border border-dashed border-hairline p-4">
                <p className="text-[13px] text-ink">
                  You don't currently own products containing this ingredient.
                </p>
                <Link
                  to="/shelf"
                  className="mt-2 inline-block text-[13px] font-semibold text-brand"
                >
                  Find compatible products →
                </Link>
              </div>
            )}
          </section>
        </div>
      </PageContainer>
    </AppShell>
  );
}
