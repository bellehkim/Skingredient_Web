import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { Calendar } from "lucide-react";
import { AppShell, PageContainer } from "@/components/app/AppShell";
import { getMetricStatusText } from "@/lib/metricStatus";
import { getAnalysisHistory } from "@/lib/data/analyses";
import { deriveOverallCondition } from "@/lib/overallCondition";
import { deriveSkinType } from "@/lib/skinType";
import { METRIC_COLORS } from "@/lib/metricColors";
import { isScriptedPresentationDemo } from "@/lib/demoMode";
import { DEMO_ANALYSIS_HISTORY } from "@/data/demoFixture";
import type { SkinAnalysisResult } from "@/lib/types";

const HISTORY_LIST_LIMIT = 5;
const TREND_WINDOW_DAYS = 7;

// One config entry per selectable trend metric — the chart component itself
// stays generic and just reads whichever entry is selected, rather than
// having separate chart markup per metric.
type TrendMetricKey =
  "redness" | "hydration" | "oiliness" | "acne" | "pores" | "texture" | "ageSpots";

const TREND_METRICS: Record<
  TrendMetricKey,
  { label: string; color: string; accessor: (a: SkinAnalysisResult) => number }
> = {
  redness: { label: "Redness", color: METRIC_COLORS.redness, accessor: (a) => a.redness },
  hydration: { label: "Hydration", color: METRIC_COLORS.hydration, accessor: (a) => a.hydration },
  oiliness: { label: "Oiliness", color: METRIC_COLORS.oiliness, accessor: (a) => a.oiliness },
  acne: { label: "Acne", color: METRIC_COLORS.acne, accessor: (a) => a.acne },
  pores: { label: "Pores", color: METRIC_COLORS.pores, accessor: (a) => a.pores },
  texture: { label: "Texture", color: METRIC_COLORS.texture, accessor: (a) => a.texture },
  ageSpots: { label: "Dark Spots", color: METRIC_COLORS.ageSpots, accessor: (a) => a.ageSpots },
};

const insightsSearchSchema = z.object({
  // Which tab was active — kept in the URL (not just component state) so the
  // back link from /history/$analysisId can return to the History tab
  // specifically, rather than always landing back on the Trend tab default.
  // Optional (rather than defaulted via .catch()) so existing plain
  // <Link to="/insights"> call sites don't need to start passing search.
  tab: z.enum(["trend", "history"]).optional(),
});

export const Route = createFileRoute("/insights")({
  head: () => ({ meta: [{ title: "Insights — Skingredient" }] }),
  validateSearch: insightsSearchSchema,
  component: Insights,
});

function Insights() {
  const { tab = "trend" } = Route.useSearch();
  const navigate = Route.useNavigate();
  const setTab = (t: "trend" | "history") => navigate({ search: { tab: t } });
  const [history, setHistory] = useState<SkinAnalysisResult[] | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<TrendMetricKey>("redness");

  // Demo Mode (src/lib/demoMode.ts, DEV-only session flag) completely
  // replaces this fetch with the fixture — getAnalysisHistory() is not
  // called at all in that branch, so fixture rows can never mix with real
  // Supabase history. Real Mode is otherwise byte-for-byte what it was
  // before Demo Mode existed.
  //
  // Read-only: getAnalysisHistory() only selects already-saved skin_analyses
  // rows — it never calls YouCam/Claude. Fetched once on mount, not
  // re-triggered by opening/reopening an older analysis. Fetches more than
  // the History tab displays so the trend chart's "Last 7 Days" filter below
  // has enough rows to actually filter from, rather than just being capped
  // at whatever the History list shows.
  useEffect(() => {
    if (isScriptedPresentationDemo()) {
      setHistory(DEMO_ANALYSIS_HISTORY);
      return;
    }
    getAnalysisHistory()
      .then(setHistory)
      .catch((err) => {
        console.error("Failed to load analysis history", err);
        setHistory([]);
      });
  }, []);

  const metric = TREND_METRICS[selectedMetric];

  // Current Snapshot cards: the 3 lowest-scoring (most concerning) metrics
  // from the latest analysis — history[0], since getAnalysisHistory() is
  // already newest-first. Reuses TREND_METRICS for label/color (no new
  // config) and the existing Metric card component unchanged; bg is just
  // the same color at low opacity via a hex alpha suffix, not a new palette.
  const snapshotMetrics = useMemo(() => {
    const latest = history && history.length > 0 ? history[0] : null;
    if (!latest) return [];
    return (Object.keys(TREND_METRICS) as TrendMetricKey[])
      .map((key) => ({ key, ...TREND_METRICS[key], value: TREND_METRICS[key].accessor(latest) }))
      .sort((a, b) => a.value - b.value)
      .slice(0, 3);
  }, [history]);

  // Real analysis history, filtered to the last 7 calendar days (matching
  // the "Last 7 Days" badge) — not just "the N most recent scans", which
  // could span any length of time. Oldest first so the chart reads
  // left-to-right chronologically.
  const chartData = useMemo(() => {
    if (!history) return null;
    const cutoff = Date.now() - TREND_WINDOW_DAYS * 24 * 60 * 60 * 1000;
    return history
      .filter((a) => new Date(a.analyzedAt).getTime() >= cutoff)
      .slice()
      .reverse()
      .map((a) => ({
        day: new Date(a.analyzedAt).toLocaleDateString(undefined, {
          month: "numeric",
          day: "numeric",
        }),
        value: metric.accessor(a),
      }));
  }, [history, metric]);

  // "This week's summary" card: real data only, not a static message. Reuses
  // the same 7-day window as the trend chart. Needs at least 2 analyses in
  // that window to compare a start point against an end point; otherwise the
  // card doesn't render at all (same "not enough data yet" gating the chart
  // above already uses via chartData.length < 2).
  const weeklySummary = useMemo(() => {
    if (!history) return null;
    const cutoff = Date.now() - TREND_WINDOW_DAYS * 24 * 60 * 60 * 1000;
    const window = history
      .filter((a) => new Date(a.analyzedAt).getTime() >= cutoff)
      .slice()
      .reverse(); // oldest first
    if (window.length < 2) return null;
    const earliest = window[0];
    const latest = window[window.length - 1];
    // All fields are "higher = healthier" (src/lib/overallCondition.ts
    // convention), so the metric with the largest positive delta is the
    // one that improved the most this week.
    const deltas = (Object.keys(TREND_METRICS) as TrendMetricKey[]).map((key) => ({
      key,
      label: TREND_METRICS[key].label,
      delta: TREND_METRICS[key].accessor(latest) - TREND_METRICS[key].accessor(earliest),
    }));
    const best = deltas.reduce((a, b) => (b.delta > a.delta ? b : a));
    if (best.delta > 0) {
      return `${best.label} is improving. Keep focusing on barrier care and hydration.`;
    }
    return "Your skin has stayed steady this week. Keep up your routine.";
  }, [history]);

  return (
    <AppShell title="Insights">
      <PageContainer width="wide">
        <header className="lg:hidden">
          <h1 className="text-[26px] font-bold text-ink">Insights</h1>
        </header>

        <div className="mt-4 grid grid-cols-2 gap-1 rounded-full bg-surface-muted p-1 lg:mt-0 lg:max-w-[280px]">
          {(["trend", "history"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-full py-2 text-[13px] font-semibold capitalize ${
                tab === t ? "bg-brand text-white shadow-soft" : "text-ink-muted"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === "trend" && (
          <>
            <div className="mt-4 grid items-start gap-4 lg:grid-cols-[2fr_1fr]">
              <section className="rounded-3xl border border-hairline bg-white p-4 shadow-soft lg:p-6">
                <div className="flex items-center gap-2">
                  <label htmlFor="trend-metric" className="text-[11px] font-medium text-ink-muted">
                    Metric
                  </label>
                  <select
                    id="trend-metric"
                    value={selectedMetric}
                    onChange={(e) => setSelectedMetric(e.target.value as TrendMetricKey)}
                    className="rounded-full border border-hairline bg-white px-3 py-1 text-[13px] font-semibold text-ink"
                  >
                    {Object.entries(TREND_METRICS).map(([key, m]) => (
                      <option key={key} value={key}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <p className="text-[16px] font-semibold text-ink">{metric.label}</p>
                  <span className="rounded-full bg-surface-muted px-2 py-1 text-[11px] font-medium text-ink-muted">
                    Last 7 days
                  </span>
                </div>

                {chartData === null ? (
                  <p className="mt-8 text-center text-[13px] text-ink-muted">Loading…</p>
                ) : chartData.length < 2 ? (
                  <p className="mt-8 text-center text-[13px] text-ink-muted">
                    More analyses are needed to show meaningful trends.
                  </p>
                ) : (
                  <div className="mt-3 h-48 lg:h-[320px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={chartData ?? []}
                        margin={{ top: 10, right: 6, left: -20, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="trend-gradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={metric.color} stopOpacity="0.35" />
                            <stop offset="100%" stopColor={metric.color} stopOpacity="0" />
                          </linearGradient>
                        </defs>
                        <CartesianGrid stroke="#F0F2F7" vertical={false} />
                        <XAxis
                          dataKey="day"
                          tickLine={false}
                          axisLine={false}
                          tick={{ fill: "#667085", fontSize: 11 }}
                        />
                        <YAxis
                          domain={[0, 100]}
                          tickLine={false}
                          axisLine={false}
                          tick={{ fill: "#667085", fontSize: 11 }}
                        />
                        <Tooltip
                          cursor={{ stroke: "#e8ecf2" }}
                          contentStyle={{
                            borderRadius: 12,
                            border: "1px solid #e8ecf2",
                            fontSize: 12,
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="value"
                          stroke={metric.color}
                          strokeWidth={2.5}
                          fill="url(#trend-gradient)"
                          dot={{ r: 3, fill: metric.color }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </section>

              {snapshotMetrics.length > 0 && (
                <div className="grid grid-cols-3 gap-2 lg:grid-cols-1 lg:gap-3">
                  {snapshotMetrics.map((m) => (
                    <Metric
                      key={m.key}
                      name={m.label}
                      value={m.value}
                      label={getMetricStatusText(m.key, m.value)}
                      ring={m.color}
                      bg={`${m.color}22`}
                    />
                  ))}
                </div>
              )}
            </div>

            {weeklySummary && (
              <section
                className="relative mt-4 overflow-hidden rounded-3xl p-5 lg:p-7"
                style={{ background: "linear-gradient(120deg, #EEEAFE 0%, #F6F3FF 100%)" }}
              >
                <div className="absolute -right-6 -bottom-6 h-32 w-32 rounded-full bg-white/50 blur-2xl" />
                <p className="text-[15px] font-semibold text-ink">This week's summary 🎉</p>
                <p className="mt-1.5 text-[13px] leading-relaxed text-ink-muted">
                  {weeklySummary}
                </p>
                <Link
                  to="/insights"
                  className="mt-3 inline-flex items-center gap-1 text-[13px] font-semibold text-brand"
                >
                  <Calendar size={13} /> Compare with last week
                </Link>
              </section>
            )}
          </>
        )}

        {tab === "history" && (
          <HistoryList analyses={history ? history.slice(0, HISTORY_LIST_LIMIT) : null} />
        )}
      </PageContainer>
    </AppShell>
  );
}

function HistoryList({ analyses }: { analyses: SkinAnalysisResult[] | null }) {
  if (analyses === null) {
    return <p className="mt-6 text-center text-[13px] text-ink-muted">Loading…</p>;
  }

  if (analyses.length === 0) {
    return <p className="mt-6 text-center text-[13px] text-ink-muted">No skin analyses yet.</p>;
  }

  return (
    <div className="mt-4 space-y-2">
      {analyses.map((a) => {
        const { score, label } = deriveOverallCondition(a);
        const skinType = deriveSkinType(a);
        const date = new Date(a.analyzedAt).toLocaleString(undefined, {
          dateStyle: "medium",
          timeStyle: "short",
        });
        return (
          <Link
            key={a.id}
            to="/history/$analysisId"
            params={{ analysisId: a.id! }}
            className="flex items-center justify-between gap-3 rounded-2xl border border-hairline bg-white p-4 shadow-soft"
          >
            <div className="min-w-0">
              <p className="text-[12px] text-ink-muted">{date}</p>
              <p className="mt-0.5 text-[14.5px] font-semibold text-ink">{label}</p>
              <p className="mt-0.5 text-[12.5px] text-ink-muted">Skin type: {skinType}</p>
            </div>
            <div className="shrink-0 text-right">
              <div className="text-[20px] font-bold text-ink">{score}</div>
              <div className="text-[10px] font-medium text-ink-muted">/100</div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

function Metric({
  name,
  value,
  label,
  ring,
  bg,
}: {
  name: string;
  value: number;
  label: string;
  ring: string;
  bg: string;
}) {
  const r = 22;
  const c = 2 * Math.PI * r;
  const off = c - (value / 100) * c;
  return (
    <div className="rounded-3xl border border-hairline bg-white p-3 text-center shadow-soft">
      <p className="text-[12.5px] font-semibold text-ink">{name}</p>
      <div className="relative mx-auto mt-2 h-16 w-16">
        <svg viewBox="0 0 60 60" className="h-full w-full -rotate-90">
          <circle cx="30" cy="30" r={r} stroke={bg} strokeWidth="5" fill="none" />
          <circle
            cx="30"
            cy="30"
            r={r}
            stroke={ring}
            strokeWidth="5"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={off}
          />
        </svg>
        <div className="absolute inset-0 grid place-items-center text-[15px] font-bold text-ink">
          {value}
        </div>
      </div>
      <p className="mt-1 text-[11px] font-semibold" style={{ color: ring }}>
        {label}
      </p>
    </div>
  );
}
