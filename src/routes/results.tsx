import { createFileRoute, Link } from "@tanstack/react-router";
import { Calendar } from "lucide-react";
import { AppShell, PageContainer } from "@/components/app/AppShell";
import { MobileHeader } from "@/components/app/MobileHeader";
import { MetricBar } from "@/components/app/MetricBar";
import { useAppStore } from "@/lib/appStore";

export const Route = createFileRoute("/results")({
  head: () => ({ meta: [{ title: "Your Results — Skingredient" }] }),
  component: Results,
});

function Results() {
  const { analysis, recommendation } = useAppStore();
  const score = Math.round(
    100 - (analysis.redness * 0.35 + (100 - analysis.hydration) * 0.3 + analysis.acne * 0.15 + Math.abs(analysis.oiliness - 50) * 0.2) * 0.5,
  );

  return (
    <AppShell title="Your Results" back="/scan">
      <MobileHeader
        title="Your Results"
        back="/scan"
        rightSlot={<Calendar size={18} className="text-ink" />}
      />
      <PageContainer width="wide">
        <div className="grid items-start gap-4 lg:grid-cols-[1.15fr_1fr]">
        {/* Hero result card */}
        <section
          className="relative overflow-hidden rounded-3xl p-5 shadow-soft lg:p-7"
          style={{ background: "linear-gradient(140deg, #D9CCFA 0%, #C6D8FF 60%, #E7F0FF 100%)" }}
        >
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/40 blur-2xl" />
          <p className="text-[11px] font-bold tracking-[0.18em] text-ink/70">OVERALL CONDITION</p>
          <div className="mt-1 flex items-start justify-between">
            <div>
              <h2 className="text-[30px] font-bold text-ink">Reactive</h2>
              <p className="mt-2 max-w-[190px] text-[13px] leading-relaxed text-ink/80">
                Pay attention to redness and strengthen your barrier.
              </p>
            </div>
            <ScoreRing value={score} />
          </div>
        </section>

        {/* Metrics */}
        <section className="mt-4 rounded-3xl border border-hairline bg-white p-2 px-5 shadow-soft lg:mt-0">
          <MetricBar name="Redness" value={analysis.redness} label="High" color="coral" />
          <div className="border-t border-hairline" />
          <MetricBar name="Hydration" value={analysis.hydration} label="Low" color="aqua" />
          <div className="border-t border-hairline" />
          <MetricBar name="Acne" value={analysis.acne} label="Low" color="sage" />
          <div className="border-t border-hairline" />
          <MetricBar name="Oiliness" value={analysis.oiliness} label="Normal" color="sun" />
        </section>
        </div>

        <div className="grid items-start gap-4 lg:grid-cols-2">
        {/* What your skin needs */}
        <section
          className="mt-4 flex items-center gap-4 rounded-3xl p-5 shadow-soft"
          style={{ background: "linear-gradient(120deg, #EAF6FF 0%, #F3F9FF 100%)" }}
        >
          <div>
            <h3 className="text-[16px] font-semibold text-ink">What your skin needs today</h3>
            <p className="mt-1 text-[13px] text-ink-muted">
              Focus on calming and barrier-supporting ingredients.
            </p>
          </div>
          <div className="ml-auto">
            <Bubble />
          </div>
        </section>

        {/* Summary */}
        <section className="mt-4 rounded-3xl border border-hairline bg-white p-5 shadow-soft">
          <h3 className="text-[15px] font-semibold text-ink">Today's plan</h3>
          <p className="mt-1 text-[13px] text-ink-muted">
            Direction: <span className="font-semibold text-ink">{recommendation.displayName}</span> · Risk:{" "}
            <span className="font-semibold text-ink capitalize">{recommendation.riskLevel}</span>
          </p>
          <div className="mt-3">
            <p className="text-[11px] font-bold tracking-[0.14em] text-sage">PRIORITIZE</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {recommendation.prioritizedIngredients.map((i) => (
                <span key={i} className="rounded-full bg-sage-light px-3 py-1 text-[12px] font-medium text-sage">{i}</span>
              ))}
            </div>
          </div>
          <div className="mt-3">
            <p className="text-[11px] font-bold tracking-[0.14em] text-coral">AVOID TODAY</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {recommendation.avoidedIngredients.map((i) => (
                <span key={i} className="rounded-full bg-coral-light px-3 py-1 text-[12px] font-medium text-coral">{i}</span>
              ))}
            </div>
          </div>
        </section>
        </div>

        <Link
          to="/shelf"
          className="mt-5 block rounded-2xl bg-brand py-4 text-center text-[15px] font-semibold text-white shadow-lift lg:mx-auto lg:max-w-[420px]"
        >
          See my product matches
        </Link>
        <Link to="/insights" className="mt-2 block py-3 text-center text-[14px] font-medium text-brand">
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
        <circle cx="40" cy="40" r={r} stroke="white" strokeOpacity=".5" strokeWidth="6" fill="none" />
        <circle cx="40" cy="40" r={r} stroke="#7257E8" strokeWidth="6" fill="none"
          strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off} />
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

function Bubble() {
  return (
    <svg width="72" height="72" viewBox="0 0 72 72">
      <defs>
        <radialGradient id="b" cx=".35" cy=".35">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="60%" stopColor="#CDEEFF" />
          <stop offset="100%" stopColor="#7BB8F0" />
        </radialGradient>
      </defs>
      <circle cx="36" cy="36" r="30" fill="url(#b)" opacity=".9" />
      <circle cx="26" cy="26" r="7" fill="white" opacity=".7" />
    </svg>
  );
}