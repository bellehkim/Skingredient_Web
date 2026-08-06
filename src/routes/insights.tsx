import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { Flame, Calendar } from "lucide-react";
import { AppShell, PageContainer } from "@/components/app/AppShell";
import { mockRednessTrend } from "@/data/mockData";
import { getMetricLabel } from "@/lib/metricStatus";

export const Route = createFileRoute("/insights")({
  head: () => ({ meta: [{ title: "Insights — Skingredient" }] }),
  component: Insights,
});

function Insights() {
  const [tab, setTab] = useState<"trend" | "history">("trend");

  return (
    <AppShell
      title="Insights"
      actions={
        <span className="inline-flex items-center gap-1 rounded-full bg-sun-light px-3 py-1.5 text-[12.5px] font-semibold text-[#a1770b]">
          <Flame size={13} /> 12 day streak
        </span>
      }
    >
      <PageContainer width="wide">
        <header className="flex items-center justify-between lg:hidden">
          <h1 className="text-[26px] font-bold text-ink">Insights</h1>
          <span className="inline-flex items-center gap-1 rounded-full bg-sun-light px-3 py-1 text-[12px] font-semibold text-[#a1770b]">
            <Flame size={13} /> 12 day streak
          </span>
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

        <div className="mt-4 grid items-start gap-4 lg:grid-cols-[2fr_1fr]">
          <section className="rounded-3xl border border-hairline bg-white p-4 shadow-soft lg:p-6">
            <div className="flex items-center justify-between">
              <p className="text-[16px] font-semibold text-ink">Redness</p>
              <span className="rounded-full bg-surface-muted px-2 py-1 text-[11px] font-medium text-ink-muted">
                7 days
              </span>
            </div>
            <div className="mt-3 h-48 lg:h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={mockRednessTrend}
                  margin={{ top: 10, right: 6, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="rd" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#FF626A" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="#FF626A" stopOpacity="0" />
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
                    contentStyle={{ borderRadius: 12, border: "1px solid #e8ecf2", fontSize: 12 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#FF626A"
                    strokeWidth={2.5}
                    fill="url(#rd)"
                    dot={{ r: 3, fill: "#FF626A" }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>

          <div className="grid grid-cols-3 gap-2 lg:grid-cols-1 lg:gap-3">
            <Metric
              name="Hydration"
              value={48}
              label={getMetricLabel(48)}
              ring="#2798F2"
              bg="#EAF6FF"
            />
            <Metric name="Acne" value={68} label={getMetricLabel(68)} ring="#45B887" bg="#E8F8F1" />
            <Metric
              name="Oiliness"
              value={48}
              label={getMetricLabel(48)}
              ring="#F5B82E"
              bg="#FFF7D8"
            />
          </div>
        </div>

        <section
          className="relative mt-4 overflow-hidden rounded-3xl p-5 lg:p-7"
          style={{ background: "linear-gradient(120deg, #EEEAFE 0%, #F6F3FF 100%)" }}
        >
          <div className="absolute -right-6 -bottom-6 h-32 w-32 rounded-full bg-white/50 blur-2xl" />
          <p className="text-[15px] font-semibold text-ink">This week's summary 🎉</p>
          <p className="mt-1.5 text-[13px] leading-relaxed text-ink-muted">
            Redness is improving. Keep focusing on barrier care and hydration.
          </p>
          <Link
            to="/insights"
            className="mt-3 inline-flex items-center gap-1 text-[13px] font-semibold text-brand"
          >
            <Calendar size={13} /> Compare with last week
          </Link>
        </section>
      </PageContainer>
    </AppShell>
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
