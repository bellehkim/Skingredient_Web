import { createFileRoute, Link } from "@tanstack/react-router";
import { Calendar } from "lucide-react";
import { AppShell, PageContainer } from "@/components/app/AppShell";
import { MobileHeader } from "@/components/app/MobileHeader";
import { MetricBar } from "@/components/app/MetricBar";
import { useAppStore } from "@/lib/appStore";
import { getMetricLabel } from "@/lib/metricStatus";
import { deriveOverallCondition } from "@/lib/overallCondition";
import { deriveSkinType } from "@/lib/skinType";
import { METRIC_COLORS } from "@/lib/metricColors";

export const Route = createFileRoute("/results")({
  head: () => ({ meta: [{ title: "Your Results — Skingredient" }] }),
  component: Results,
});

function Results() {
  const { analysis, recommendation, recommendedProducts, products, addToShelf } = useAppStore();
  const {
    score,
    label: conditionLabel,
    description: conditionDescription,
  } = deriveOverallCondition(analysis);
  const skinType = deriveSkinType(analysis);
  const shelfIds = new Set(products.map((p) => p.id));
  const recommendedPicks = recommendedProducts.filter((p) => p.status === "use-today").slice(0, 4);

  return (
    <AppShell title="Your Results" back="/scan">
      <MobileHeader
        title="Your Results"
        back="/scan"
        rightSlot={<Calendar size={18} className="text-ink" />}
      />
      <PageContainer width="wide">
        <div className="grid items-start gap-4 lg:grid-cols-[1.15fr_1fr]">
          {/* Overall Condition */}
          <section
            className="relative overflow-hidden rounded-3xl p-5 shadow-soft lg:col-start-1 lg:row-start-1 lg:p-7"
            style={{ background: "linear-gradient(140deg, #D9CCFA 0%, #C6D8FF 60%, #E7F0FF 100%)" }}
          >
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/40 blur-2xl" />
            <p className="text-[11px] font-bold tracking-[0.18em] text-ink/70">OVERALL CONDITION</p>
            <div className="mt-1 flex items-start justify-between">
              <div>
                <h2 className="text-[30px] font-bold text-ink">{conditionLabel}</h2>
                <p className="mt-3 text-[10px] font-bold tracking-[0.14em] text-ink/50">
                  SKIN TYPE
                </p>
                <p className="text-[13px] font-semibold text-ink/80">{skinType.label}</p>
                <p className="mt-2 max-w-[190px] text-[13px] leading-relaxed text-ink/80">
                  {conditionDescription}
                </p>
              </div>
              <ScoreRing value={score} />
            </div>
          </section>

          {/* Metrics — all 7 */}
          <section className="mt-4 rounded-3xl border border-hairline bg-white p-2 px-5 shadow-soft lg:col-start-2 lg:row-start-1 lg:row-span-2 lg:mt-0">
            <MetricBar
              name="Redness"
              value={analysis.redness}
              label={getMetricLabel(analysis.redness)}
              color={METRIC_COLORS.redness}
            />
            <div className="border-t border-hairline" />
            <MetricBar
              name="Hydration"
              value={analysis.hydration}
              label={getMetricLabel(analysis.hydration)}
              color={METRIC_COLORS.hydration}
            />
            <div className="border-t border-hairline" />
            <MetricBar
              name="Oiliness"
              value={analysis.oiliness}
              label={getMetricLabel(analysis.oiliness)}
              color={METRIC_COLORS.oiliness}
            />
            <div className="border-t border-hairline" />
            <MetricBar
              name="Acne"
              value={analysis.acne}
              label={getMetricLabel(analysis.acne)}
              color={METRIC_COLORS.acne}
            />
            <div className="border-t border-hairline" />
            <MetricBar
              name="Pores"
              value={analysis.pores}
              label={getMetricLabel(analysis.pores)}
              color={METRIC_COLORS.pores}
            />
            <div className="border-t border-hairline" />
            <MetricBar
              name="Texture"
              value={analysis.texture}
              label={getMetricLabel(analysis.texture)}
              color={METRIC_COLORS.texture}
            />
            <div className="border-t border-hairline" />
            <MetricBar
              name="Dark Spots"
              value={analysis.ageSpots}
              label={getMetricLabel(analysis.ageSpots)}
              color={METRIC_COLORS.ageSpots}
            />
          </section>

          {/* Today's Plan — moved directly under Overall Condition */}
          <section className="mt-4 rounded-3xl border border-hairline bg-white p-5 shadow-soft lg:col-start-1 lg:row-start-2">
            <h3 className="text-[15px] font-semibold text-ink">Today's plan</h3>
            <p className="mt-1 text-[13px] text-ink-muted">
              Direction:{" "}
              <span className="font-semibold text-ink">{recommendation.displayName}</span> · Risk:{" "}
              <span className="font-semibold text-ink capitalize">{recommendation.riskLevel}</span>
            </p>
            <div className="mt-3">
              <p className="text-[11px] font-bold tracking-[0.14em] text-sage">PRIORITIZE</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {recommendation.prioritizedIngredients.map((i) => (
                  <span
                    key={i}
                    className="rounded-full bg-sage-light px-3 py-1 text-[12px] font-medium text-sage"
                  >
                    {i}
                  </span>
                ))}
              </div>
            </div>
            <div className="mt-3">
              <p className="text-[11px] font-bold tracking-[0.14em] text-coral">AVOID TODAY</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {recommendation.avoidedIngredients.map((i) => (
                  <span
                    key={i}
                    className="rounded-full bg-coral-light px-3 py-1 text-[12px] font-medium text-coral"
                  >
                    {i}
                  </span>
                ))}
              </div>
            </div>
          </section>
        </div>

        {/* Recommended products — from the catalog, matched to today's plan.
            Display only: nothing here is on My Shelf until explicitly saved. */}
        {recommendedPicks.length > 0 && (
          <section className="mt-4 rounded-3xl border border-hairline bg-white p-5 shadow-soft">
            <h3 className="text-[15px] font-semibold text-ink">Recommended for you</h3>
            <div className="mt-3 space-y-2">
              {recommendedPicks.map((p) => {
                const saved = shelfIds.has(p.id);
                return (
                  <div
                    key={p.id}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-hairline p-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[13px] text-ink-muted">{p.brand}</p>
                      <p className="truncate text-[14px] font-semibold text-ink">{p.name}</p>
                      <p className="mt-0.5 text-[12px] text-ink-muted">{p.reason}</p>
                    </div>
                    <button
                      onClick={() => addToShelf(p.id)}
                      disabled={saved}
                      className={`shrink-0 rounded-full px-3.5 py-2 text-[12.5px] font-semibold ${
                        saved ? "bg-surface-muted text-ink-muted" : "bg-brand text-white"
                      }`}
                    >
                      {saved ? "Saved" : "Save to Shelf"}
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <Link
          to="/shelf"
          className="mt-5 block rounded-2xl bg-brand py-4 text-center text-[15px] font-semibold text-white shadow-lift lg:mx-auto lg:max-w-[420px]"
        >
          See my product matches
        </Link>
        <Link
          to="/insights"
          className="mt-2 block py-3 text-center text-[14px] font-medium text-brand"
        >
          View detailed analysis
        </Link>
      </PageContainer>
    </AppShell>
  );
}

function ScoreRing({ value }: { value: number }) {
  const r = 34;
  const c = 2 * Math.PI * r;
  const off = c - (Math.min(100, Math.max(0, value)) / 100) * c;
  return (
    <div className="relative h-[86px] w-[86px]">
      <svg viewBox="0 0 80 80" className="h-full w-full -rotate-90">
        <circle
          cx="40"
          cy="40"
          r={r}
          stroke="white"
          strokeOpacity=".5"
          strokeWidth="6"
          fill="none"
        />
        <circle
          cx="40"
          cy="40"
          r={r}
          stroke="#7257E8"
          strokeWidth="6"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={off}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center leading-none">
        <div className="text-center">
          <div className="text-[24px] font-bold text-ink">{value}</div>
          <div className="text-[10px] font-medium text-ink-muted">/100</div>
        </div>
      </div>
    </div>
  );
}
