import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { Calendar, ScanFace } from "lucide-react";
import { AppShell, PageContainer } from "@/components/app/AppShell";
import { MobileHeader } from "@/components/app/MobileHeader";
import { MetricBar } from "@/components/app/MetricBar";
import { SkinStrategyCard } from "@/components/app/SkinStrategyCard";
import { useAppStore } from "@/lib/appStore";
import { getMetricStatusText } from "@/lib/metricStatus";
import { deriveOverallCondition } from "@/lib/overallCondition";
import { deriveSkinType } from "@/lib/skinType";
import { METRIC_COLORS } from "@/lib/metricColors";

export const Route = createFileRoute("/results")({
  head: () => ({ meta: [{ title: "Your results — Skingredient" }] }),
  component: Results,
});

function Results() {
  const router = useRouter();
  // Reachable from a fresh scan, Home's "Today's Skin Direction" card, and
  // (via onboarding) the standalone scan step — no single hardcoded
  // destination is correct for all of them, so back retraces actual
  // navigation history instead (same pattern as scan.check-in/onboarding).
  const goBack = () => router.history.back();
  const {
    analysis,
    analysisLoading,
    scanCompletedToday,
    checkInCompletedToday,
    recommendation,
    todaysPicks,
    products,
    addToShelf,
  } = useAppStore();

  // Case A/B: no report without today's scan, regardless of check-in — a
  // completed Skin Scan is the only thing that produces a report. `analysis`
  // may still hold an older (not-today) analysis here; scanCompletedToday,
  // not `analysis !== null`, is the real gate.
  if (!scanCompletedToday) {
    return (
      <AppShell title="Your results" onBack={goBack}>
        <MobileHeader title="Your results" onBack={goBack} />
        <PageContainer width="narrow">
          <NoReportYet checkInCompletedToday={checkInCompletedToday} loading={analysisLoading} />
        </PageContainer>
      </AppShell>
    );
  }

  // Case C/D: scanCompletedToday guarantees analysis is today's real,
  // non-null analysis — this check just gives TypeScript the same
  // narrowing (appStore derives the two from the same state, but not in a
  // way the type system can see across the early return above).
  if (!analysis) return null;

  const {
    score,
    label: conditionLabel,
    description: conditionDescription,
  } = deriveOverallCondition(analysis);
  const skinType = deriveSkinType(analysis);
  const shelfIds = new Set(products.map((p) => p.id));

  return (
    <AppShell title="Your results" onBack={goBack}>
      <MobileHeader
        title="Your results"
        onBack={goBack}
        rightSlot={<Calendar size={18} className="text-ink" />}
      />
      <PageContainer width="wide">
        {/* Case C: real scan, no check-in yet — no AI Skin Strategy, CTA
            instead. Case D: both exist — the real generated (or non-AI
            fallback, if generation failed) strategy. */}
        {checkInCompletedToday ? (
          <SkinStrategyCard strategy={analysis.skinStrategy} />
        ) : (
          <CompleteCheckInCta />
        )}

        <div className="mt-4 grid items-start gap-4 lg:grid-cols-[1.15fr_1fr]">
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
                <p className="text-[13px] font-semibold text-ink/80">{skinType}</p>
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
              label={getMetricStatusText("redness", analysis.redness)}
              color={METRIC_COLORS.redness}
            />
            <div className="border-t border-hairline" />
            <MetricBar
              name="Hydration"
              value={analysis.hydration}
              label={getMetricStatusText("hydration", analysis.hydration)}
              color={METRIC_COLORS.hydration}
            />
            <div className="border-t border-hairline" />
            <MetricBar
              name="Oiliness"
              value={analysis.oiliness}
              label={getMetricStatusText("oiliness", analysis.oiliness)}
              color={METRIC_COLORS.oiliness}
            />
            <div className="border-t border-hairline" />
            <MetricBar
              name="Acne"
              value={analysis.acne}
              label={getMetricStatusText("acne", analysis.acne)}
              color={METRIC_COLORS.acne}
            />
            <div className="border-t border-hairline" />
            <MetricBar
              name="Pores"
              value={analysis.pores}
              label={getMetricStatusText("pores", analysis.pores)}
              color={METRIC_COLORS.pores}
            />
            <div className="border-t border-hairline" />
            <MetricBar
              name="Texture"
              value={analysis.texture}
              label={getMetricStatusText("texture", analysis.texture)}
              color={METRIC_COLORS.texture}
            />
            <div className="border-t border-hairline" />
            <MetricBar
              name="Dark Spots"
              value={analysis.ageSpots}
              label={getMetricStatusText("ageSpots", analysis.ageSpots)}
              color={METRIC_COLORS.ageSpots}
            />
          </section>

          {/* Today's Plan — deterministic, so it's shown in both Case C and
              D. In Case C this is the baseline (no symptoms/schedule
              context yet); in Case D it reflects today's check-in too. */}
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

        {/* Recommended products — from the catalog, matched to today's skin
            concerns (src/lib/productRecommendations.ts). Display only:
            nothing here is on My Shelf until explicitly saved. */}
        {todaysPicks.length > 0 && (
          <section className="mt-4 rounded-3xl border border-hairline bg-white p-5 shadow-soft">
            <h3 className="text-[15px] font-semibold text-ink">Recommended for you</h3>
            <div className="mt-3 space-y-2">
              {todaysPicks.map((p) => {
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
                      onClick={() => addToShelf(p.id)}
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

/** Case A (no check-in, no scan) and Case B (check-in saved, no scan) — a
 * Skin Scan is the only thing that produces a report, so both cases share
 * the same "go scan" CTA; Case B's copy just acknowledges the check-in was
 * saved rather than pretending it doesn't exist. */
function NoReportYet({
  checkInCompletedToday,
  loading,
}: {
  checkInCompletedToday: boolean;
  loading: boolean;
}) {
  if (loading) {
    return <p className="mt-10 text-center text-[13px] text-ink-muted">Loading…</p>;
  }
  return (
    <div className="mt-10 flex flex-col items-center text-center">
      <div className="grid h-16 w-16 place-items-center rounded-full bg-brand-light">
        <ScanFace size={28} className="text-brand" />
      </div>
      <h2 className="mt-4 text-[20px] font-bold text-ink">No report yet</h2>
      <p className="mt-1.5 max-w-[280px] text-[13.5px] leading-relaxed text-ink-muted">
        {checkInCompletedToday
          ? "Today's check-in is saved. Complete a skin scan to see your report."
          : "Complete a skin scan to get your skin analysis report."}
      </p>
      <Link
        to="/scan"
        className="mt-5 rounded-2xl bg-brand px-6 py-3.5 text-[14px] font-semibold text-white shadow-lift"
      >
        Start skin scan
      </Link>
    </div>
  );
}

/** Case C — real scan, no check-in yet: AI Skin Strategy deliberately hasn't
 * been generated (see src/lib/skinStrategyFlow.ts), so this CTA replaces
 * SkinStrategyCard rather than showing a fallback that implies it tried. */
function CompleteCheckInCta() {
  return (
    <section className="mt-4 rounded-3xl border border-dashed border-hairline bg-surface-muted p-5">
      <h3 className="text-[15px] font-semibold text-ink">✨ Today's skin strategy</h3>
      <p className="mt-2 text-[13.5px] leading-relaxed text-ink-muted">
        Complete today's check-in to personalize your skin strategy.
      </p>
      <Link
        to="/scan/check-in"
        className="mt-3 inline-block rounded-full bg-brand px-4 py-2 text-[12.5px] font-semibold text-white"
      >
        Daily check-in
      </Link>
    </section>
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
