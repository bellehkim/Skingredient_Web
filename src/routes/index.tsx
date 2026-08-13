import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Bell,
  ScanFace,
  Plus,
  FlaskConical,
  CalendarHeart,
  ArrowRight,
  Flame,
  Heart,
  Calendar,
  ShieldCheck,
  Ban,
  CheckCircle2,
  Package,
} from "lucide-react";
import { AppShell, PageContainer } from "@/components/app/AppShell";
import { useAppStore } from "@/lib/appStore";
import { updateSkinDirection } from "@/lib/data/analyses";
import type { EventTiming, ScheduleOption } from "@/lib/types";

// Upcoming-plan card labels — sourced entirely from the live scheduleTomorrow
// (type) + eventTiming (timing) state, never a hardcoded date/time. No exact
// clock time is ever shown because the user never enters one.
const EVENT_TYPE_LABEL: Record<ScheduleOption, string> = {
  "important-event": "Important event",
  "outdoor-day": "Outdoor activity",
  travel: "Travel",
  "cosmetic-treatment": "Cosmetic treatment",
  none: "Nothing special scheduled",
};

const EVENT_TIMING_LABEL: Record<EventTiming, string> = {
  tomorrow: "TOMORROW",
  "three-days": "WITHIN 3 DAYS",
  week: "WITHIN A WEEK",
  none: "NO UPCOMING PLANS",
};

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Skingredient — Home" },
      {
        name: "description",
        content:
          "Your daily skin direction, ingredients to prioritize and avoid, and product picks from your shelf.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const {
    user,
    analysis,
    recommendation,
    scheduleTomorrow,
    eventTiming,
    scanCompletedToday,
    setAnalysis,
  } = useAppStore();
  const [retryingDirection, setRetryingDirection] = useState(false);
  const hasUpcomingPlan = scheduleTomorrow !== "none" && eventTiming !== "none";
  const eventWhenLabel = hasUpcomingPlan
    ? EVENT_TIMING_LABEL[eventTiming]
    : EVENT_TIMING_LABEL.none;
  const eventTypeLabel = hasUpcomingPlan
    ? EVENT_TYPE_LABEL[scheduleTomorrow]
    : EVENT_TYPE_LABEL.none;

  // Manual retry only — never runs on mount/refresh/navigation/re-render, only
  // on click. Doesn't touch YouCam or re-run the scan; just re-asks for a
  // sentence from scores already in state, and merges the result back in.
  // Preserves the one-generation-per-analysis rule: this is the sole path
  // that can call Claude again, and only fires on an explicit user action.
  const retryDirection = async () => {
    setRetryingDirection(true);
    try {
      const res = await fetch("/api/skin-direction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          redness: analysis.redness,
          hydration: analysis.hydration,
          acne: analysis.acne,
          oiliness: analysis.oiliness,
          texture: analysis.texture,
          pores: analysis.pores,
        }),
      });
      const body = await res.json();
      if (res.ok && body.skinDirection) {
        // The one narrow exception to "analyses are immutable" — patches
        // skin_direction on the existing row rather than inserting a new
        // one. Only runs if this analysis was actually persisted (analysis.id
        // set); otherwise just update in-memory state as before.
        if (analysis.id) {
          try {
            const updated = await updateSkinDirection(analysis.id, body.skinDirection);
            setAnalysis(updated);
            return;
          } catch (updateError) {
            console.error("Failed to persist retried skin direction", updateError);
          }
        }
        setAnalysis({ ...analysis, skinDirection: body.skinDirection });
      }
    } catch {
      // Stay in the failed state — the "Try again" action remains available.
    } finally {
      setRetryingDirection(false);
    }
  };

  return (
    <AppShell>
      <PageContainer width="wide">
        {/* Header */}
        <header className="flex items-start justify-between">
          <div>
            <h1 className="text-[28px] font-bold leading-tight text-ink lg:text-[32px]">
              {user.name} <span className="align-middle">👋</span>
            </h1>
            <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-sun-light px-3 py-1 text-[12px] font-semibold text-[#a1770b]">
              <Flame size={14} /> {user.streak} day skin check streak
            </div>
          </div>
          <button
            aria-label="Notifications"
            className="relative grid h-11 w-11 place-items-center rounded-full bg-surface-muted lg:hidden"
          >
            <Bell size={20} className="text-ink" />
            <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-coral" />
          </button>
        </header>

        <div className="mt-4 grid items-start gap-6 lg:grid-cols-[1.75fr_1fr]">
          <div className="flex flex-col lg:self-stretch">
            {/* Hero: Today's Skin Direction */}
            <Link
              to="/results"
              className="block overflow-hidden rounded-3xl border border-hairline shadow-soft transition active:scale-[0.995] lg:flex lg:flex-1 lg:flex-col"
            >
              <div
                className="relative p-5 pb-16 text-white lg:p-7 lg:pb-14"
                style={{
                  background: "linear-gradient(135deg, #2FB88A 0%, #7BCB62 55%, #F5E28A 100%)",
                }}
              >
                <div className="absolute -right-6 -top-8 h-32 w-32 rounded-full bg-white/15 blur-2xl" />
                <div className="absolute right-6 top-6 opacity-70">
                  <Leaf />
                </div>
                <p className="text-[11px] font-semibold tracking-[0.18em] text-white/90">
                  TODAY'S SKIN DIRECTION
                </p>
                <h2 className="mt-1 text-[26px] font-bold leading-tight lg:text-[32px]">
                  {recommendation.displayName}
                </h2>
                {analysis.skinDirection ? (
                  <p className="mt-1.5 max-w-[280px] text-[13.5px] leading-relaxed text-white/90 lg:max-w-[420px] lg:text-[14.5px]">
                    {analysis.skinDirection}
                  </p>
                ) : (
                  <div className="mt-1.5 max-w-[280px] lg:max-w-[420px]">
                    <p className="text-[13.5px] leading-relaxed text-white/90 lg:text-[14.5px]">
                      Couldn't generate today's skin direction.
                    </p>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        retryDirection();
                      }}
                      disabled={retryingDirection}
                      className="mt-1 text-[12.5px] font-semibold text-white underline underline-offset-2 disabled:opacity-60"
                    >
                      {retryingDirection ? "Retrying…" : "Try again"}
                    </button>
                  </div>
                )}
                <span className="absolute bottom-5 right-5 inline-flex items-center gap-1.5 rounded-full bg-white/25 px-3 py-1.5 text-[11.5px] font-semibold text-white backdrop-blur">
                  View today's plan <ArrowRight size={13} />
                </span>
              </div>

              {/* Inset ingredient card */}
              <div className="-mt-6 mx-4 rounded-2xl bg-white p-5 shadow-soft lg:mx-5 lg:my-auto lg:grid lg:grid-cols-2 lg:gap-6 lg:p-6">
                <div>
                  <div className="flex items-center gap-1.5 text-[11px] font-bold tracking-[0.14em] text-sage">
                    <ShieldCheck size={13} /> PRIORITIZE
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    {(recommendation.prioritizedIngredients.slice(0, 3).length
                      ? recommendation.prioritizedIngredients.slice(0, 3)
                      : ["Ceramides", "Panthenol", "Glycerin"]
                    ).map((i) => (
                      <IngredientTile key={i} name={i} tone="sage" />
                    ))}
                  </div>
                </div>
                <div className="my-4 border-t border-hairline lg:hidden" />
                <div>
                  <div className="flex items-center gap-1.5 text-[11px] font-bold tracking-[0.14em] text-coral">
                    <Ban size={13} /> AVOID TODAY
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    {(recommendation.avoidedIngredients.slice(0, 3).length
                      ? recommendation.avoidedIngredients.slice(0, 3)
                      : ["Retinol", "AHA", "High Vit C"]
                    ).map((i) => (
                      <IngredientTile key={i} name={i} tone="coral" />
                    ))}
                  </div>
                </div>
              </div>
            </Link>
          </div>

          {/* Secondary column */}
          <div className="mt-3 lg:mt-0 lg:space-y-3">
            <ScanStatusRow completed={scanCompletedToday} />

            {/* Event */}
            <div
              className="mt-3 flex items-center gap-2.5 rounded-2xl px-4 py-2.5 lg:mt-0"
              style={{ background: "linear-gradient(90deg, #FFE1E9 0%, #EDE6FF 100%)" }}
            >
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-white/70">
                <Heart size={15} className="text-coral" fill="currentColor" />
              </div>
              <div className="flex-1">
                <p className="text-[9.5px] font-bold tracking-[0.14em] text-ink-muted">
                  {eventWhenLabel}
                </p>
                <p className="text-[14px] font-semibold text-ink">{eventTypeLabel}</p>
              </div>
              <Calendar size={16} className="text-ink-muted" />
            </div>

            {/* CTA */}
            <Link
              to="/shelf"
              className="mt-5 flex items-center justify-between rounded-2xl border border-hairline bg-surface-muted px-5 py-3.5 text-ink lg:mt-0"
            >
              <span className="inline-flex items-center gap-2.5 text-[14.5px] font-semibold">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-white text-brand">
                  <Package size={16} />
                </span>
                Check products on My Shelf
              </span>
              <ArrowRight size={16} className="text-ink-muted" />
            </Link>

            {/* Quick actions */}
            <div className="mt-6 grid grid-cols-4 gap-2 lg:mt-0 lg:grid-cols-2">
              <QuickAction to="/scan/check-in" label="Scan skin" Icon={ScanFace} tint="brand" />
              <QuickAction to="/shelf/add" label="Add product" Icon={Plus} tint="aqua" />
              <QuickAction to="/ingredients" label="Ingredients" Icon={FlaskConical} tint="sage" />
              <QuickAction to="/routine" label="Routine" Icon={CalendarHeart} tint="sun" />
            </div>
          </div>
        </div>

        <p className="mt-8 text-center text-[11px] text-ink-muted">
          Skingredient provides cosmetic skincare guidance and does not diagnose or treat medical
          conditions.
        </p>
      </PageContainer>
    </AppShell>
  );
}

function IngredientTile({ name, tone }: { name: string; tone: "sage" | "coral" }) {
  const cls = tone === "sage" ? "bg-sage-light text-sage" : "bg-coral-light text-coral";
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className={`grid h-11 w-11 place-items-center rounded-full ${cls}`}>
        <Droplet />
      </div>
      <span className="text-center text-[11.5px] font-medium leading-tight text-ink">{name}</span>
    </div>
  );
}

function ScanStatusRow({ completed }: { completed: boolean }) {
  if (completed) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-sage/25 bg-sage-light px-4 py-3">
        <CheckCircle2 size={18} className="text-sage" />
        <p className="flex-1 text-[13.5px] font-semibold text-sage">Today's skin check completed</p>
      </div>
    );
  }
  return (
    <Link
      to="/scan/check-in"
      className="flex items-center gap-3 rounded-2xl border border-brand/20 bg-brand-light px-4 py-3"
    >
      <ScanFace size={18} className="text-brand" />
      <div className="flex-1">
        <p className="text-[13.5px] font-semibold text-brand">Today's skin check is waiting</p>
        <p className="text-[11.5px] text-brand/80">Tap to complete today's scan</p>
      </div>
      <ArrowRight size={16} className="text-brand" />
    </Link>
  );
}

function QuickAction({
  to,
  label,
  Icon,
  tint,
}: {
  to: string;
  label: string;
  Icon: React.ComponentType<{ size?: number; className?: string }>;
  tint: "brand" | "aqua" | "sage" | "sun";
}) {
  const bg = {
    brand: "bg-brand-light text-brand",
    aqua: "bg-aqua-light text-aqua",
    sage: "bg-sage-light text-sage",
    sun: "bg-sun-light text-[#a1770b]",
  }[tint];
  return (
    <Link
      to={to}
      className="flex flex-col items-center gap-2 rounded-2xl border border-hairline bg-white p-3"
    >
      <div className={`grid h-10 w-10 place-items-center rounded-xl ${bg}`}>
        <Icon size={18} />
      </div>
      <span className="text-center text-[11px] font-medium leading-tight text-ink">{label}</span>
    </Link>
  );
}

function Leaf() {
  return (
    <svg width="42" height="42" viewBox="0 0 24 24" fill="none">
      <path d="M20 4C11 4 4 11 4 20c9 0 16-7 16-16Z" fill="white" opacity=".9" />
      <path d="M4 20C10 14 14 10 20 4" stroke="#2FB88A" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}
function Droplet() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2s6 7.5 6 12a6 6 0 1 1-12 0c0-4.5 6-12 6-12Z" />
    </svg>
  );
}
