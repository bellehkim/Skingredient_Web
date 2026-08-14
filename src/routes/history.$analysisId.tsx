import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell, PageContainer } from "@/components/app/AppShell";
import { MobileHeader } from "@/components/app/MobileHeader";
import { MetricBar } from "@/components/app/MetricBar";
import { getAnalysisById } from "@/lib/data/analyses";
import { getMetricStatusText } from "@/lib/metricStatus";
import { deriveOverallCondition } from "@/lib/overallCondition";
import { deriveSkinType } from "@/lib/skinType";
import { METRIC_COLORS } from "@/lib/metricColors";
import type { SkinAnalysisResult } from "@/lib/types";

export const Route = createFileRoute("/history/$analysisId")({
  head: () => ({ meta: [{ title: "Past analysis — Skingredient" }] }),
  component: HistoryDetail,
});

/**
 * Read-only detail view for one past skin_analyses row — never regenerates
 * YouCam/Claude output, just re-derives Overall Condition/Skin Type from the
 * stored metrics via the same deterministic helpers results.tsx uses.
 * Deliberately not the /results route/component: that page is wired to
 * appStore's live "today" analysis plus today's recommendation and product
 * matches, none of which apply to browsing an old record.
 */
function HistoryDetail() {
  const { analysisId } = Route.useParams();
  const [analysis, setAnalysis] = useState<SkinAnalysisResult | null | undefined>(undefined);

  useEffect(() => {
    getAnalysisById(analysisId)
      .then(setAnalysis)
      .catch((err) => {
        console.error("Failed to load past analysis", err);
        setAnalysis(null);
      });
  }, [analysisId]);

  if (analysis === undefined) {
    return (
      <AppShell title="Past analysis" back="/insights?tab=history">
        <MobileHeader title="Past analysis" back="/insights?tab=history" />
        <PageContainer width="wide">
          <p className="mt-6 text-center text-[13px] text-ink-muted">Loading…</p>
        </PageContainer>
      </AppShell>
    );
  }

  if (analysis === null) {
    return (
      <AppShell title="Past analysis" back="/insights?tab=history">
        <MobileHeader title="Past analysis" back="/insights?tab=history" />
        <PageContainer width="wide">
          <p className="mt-6 text-center text-[13px] text-ink-muted">
            This analysis couldn't be found.
          </p>
        </PageContainer>
      </AppShell>
    );
  }

  const { score, label: conditionLabel, description } = deriveOverallCondition(analysis);
  const skinType = deriveSkinType(analysis);
  const date = new Date(analysis.analyzedAt).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <AppShell title="Past analysis" back="/insights?tab=history">
      <MobileHeader title="Past analysis" back="/insights?tab=history" />
      <PageContainer width="wide">
        <p className="text-[12px] font-medium text-ink-muted">{date}</p>

        <div className="mt-3 grid items-start gap-4 lg:grid-cols-[1.15fr_1fr]">
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
                  {description}
                </p>
              </div>
              <ScoreRing value={score} />
            </div>
          </section>

          <section className="rounded-3xl border border-hairline bg-white p-2 px-5 shadow-soft lg:col-start-2 lg:row-start-1 lg:row-span-2">
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

          {/* Recorded at scan time (src/lib/data/analyses.ts) — not
              recomputed here, since the live recommendation engine also
              depends on today's symptoms/schedule, not just this analysis's
              scores. Absent for analyses saved before this field existed. */}
          {analysis.recommendationSnapshot && (
            <section className="mt-4 rounded-3xl border border-hairline bg-white p-5 shadow-soft lg:col-start-1 lg:row-start-2 lg:mt-0">
              <h3 className="text-[15px] font-semibold text-ink">Today's plan</h3>
              <p className="mt-1 text-[13px] text-ink-muted">
                Direction:{" "}
                <span className="font-semibold text-ink">
                  {analysis.recommendationSnapshot.displayName}
                </span>{" "}
                · Risk:{" "}
                <span className="font-semibold text-ink capitalize">
                  {analysis.recommendationSnapshot.riskLevel}
                </span>
              </p>
              <div className="mt-3">
                <p className="text-[11px] font-bold tracking-[0.14em] text-sage">PRIORITIZE</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {analysis.recommendationSnapshot.prioritizedIngredients.map((i) => (
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
                  {analysis.recommendationSnapshot.avoidedIngredients.map((i) => (
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
          )}
        </div>
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
