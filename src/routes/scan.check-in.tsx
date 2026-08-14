import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { z } from "zod";
import { MobileHeader } from "@/components/app/MobileHeader";
import { AppShell, PageContainer } from "@/components/app/AppShell";
import { SafetyNotice } from "@/components/app/SafetyNotice";
import { useAppStore } from "@/lib/appStore";
import { resolveEventTiming, resolveScheduleOption } from "@/lib/scheduleAdjustments";

const feelings = [
  "Dry",
  "Tight",
  "Stinging",
  "Burning",
  "Itchy",
  "Oily",
  "New breakouts",
  "Red",
  "Feels normal",
];
const tried = ["New product", "New active ingredient", "Cosmetic treatment", "Nothing new"];
const whatsHappening = [
  "Nothing special",
  "Important event",
  "Outdoor activity",
  "Travel",
  "Cosmetic treatment",
];
const timingOptions = ["Tomorrow", "Within 3 days", "Within a week"];

const checkInSearchSchema = z.object({
  // Carried through from onboarding (see onboarding.tsx) so submit can send
  // the user on to the standalone scan page (/scan?onboarding=true) instead
  // of the normal one — same flag, same pattern as scan.index.tsx/results.tsx.
  onboarding: z.boolean().optional(),
});

export const Route = createFileRoute("/scan/check-in")({
  head: () => ({ meta: [{ title: "Daily check-in — Skingredient" }] }),
  validateSearch: checkInSearchSchema,
  component: CheckIn,
});

function CheckIn() {
  const { onboarding: fromOnboarding } = Route.useSearch();
  const navigate = useNavigate();
  const router = useRouter();
  // Reachable from Home's "Today's skin check" banner, Home's "Scan skin"
  // quick action, and /scan's "Daily check-in" link — no single hardcoded
  // back destination is correct for all three, so back retraces actual
  // navigation history instead (see MobileHeader/DesktopTopBar's onBack).
  const goBack = () => router.history.back();
  const { submitTodaysCheckIn, scanCompletedToday } = useAppStore();
  const [selFeel, setSelFeel] = useState<string[]>([]);
  const [selTried, setSelTried] = useState<string[]>([]);
  // Single-select — one event type/timing, not several combined — unlike the
  // multi-select feelings/tried chips above.
  const [selWhat, setSelWhat] = useState<string | null>(null);
  const [selTiming, setSelTiming] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const needsTiming = selWhat !== null && selWhat !== "Nothing special";
  // Requires an actual pick in every section — including "What's happening?"
  // itself: needsTiming stays false before anything is chosen there too, so
  // that condition alone can't be the only gate or Continue would enable
  // with the event-type question never answered at all.
  const canContinue =
    selFeel.length > 0 &&
    selTried.length > 0 &&
    selWhat !== null &&
    (!needsTiming || selTiming !== null);

  const warn = useMemo(
    () => selFeel.some((s) => ["Burning", "Stinging"].includes(s)) || selFeel.includes("Swelling"),
    [selFeel],
  );

  const toggle = (arr: string[], set: (v: string[]) => void, v: string) =>
    set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  return (
    <AppShell hideNav title="Daily check-in" onBack={goBack}>
      <MobileHeader title="Daily check-in" onBack={goBack} />
      <PageContainer width="narrow" className="pb-32">
        <h2 className="text-[22px] font-bold text-ink lg:text-[26px]">
          How does your skin feel today?
        </h2>
        <p className="mt-1 text-[13px] text-ink-muted">Select any that apply.</p>
        <ChipGrid
          options={feelings}
          selected={selFeel}
          onToggle={(v) => toggle(selFeel, setSelFeel, v)}
        />

        {warn && (
          <div className="mt-5">
            <SafetyNotice>
              Your skin may be highly reactive today. Skingredient will pause strong active
              ingredient recommendations and focus on gentle barrier support.
            </SafetyNotice>
          </div>
        )}

        <h3 className="mt-8 text-[22px] font-bold text-ink lg:text-[26px]">
          Did you try anything new?
        </h3>
        <p className="mt-1 text-[13px] text-ink-muted">Select any that apply.</p>
        <ChipGrid
          options={tried}
          selected={selTried}
          onToggle={(v) => toggle(selTried, setSelTried, v)}
        />

        <h3 className="mt-8 text-[22px] font-bold text-ink lg:text-[26px]">What's happening?</h3>
        <ChipGrid
          options={whatsHappening}
          selected={selWhat ? [selWhat] : []}
          onToggle={(v) => {
            setSelWhat(v);
            if (v === "Nothing special") setSelTiming(null);
          }}
        />

        {needsTiming && (
          <>
            <h3 className="mt-8 text-[22px] font-bold text-ink lg:text-[26px]">When is it?</h3>
            <ChipGrid
              options={timingOptions}
              selected={selTiming ? [selTiming] : []}
              onToggle={(v) => setSelTiming(v)}
            />
          </>
        )}
      </PageContainer>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-hairline bg-white px-5 py-4">
        {submitError && (
          <p className="mx-auto mb-2 max-w-[400px] text-center text-[12.5px] text-coral">
            {submitError}
          </p>
        )}
        <button
          disabled={!canContinue || submitting}
          onClick={async () => {
            if (!canContinue || submitting) return;
            setSubmitError(null);
            setSubmitting(true);
            try {
              const mapped = selFeel.map((s) => s.toLowerCase().replace(/\s+/g, "-"));
              // If today's scan already exists, this also generates (or, if a
              // strategy already exists, just refreshes the deterministic
              // snapshot for) AI Skin Strategy and patches that same analysis
              // row — never a second one — so Results is fully personalized
              // the moment we land there, no refresh needed.
              const { hasTodaysScan } = await submitTodaysCheckIn({
                symptoms: mapped,
                scheduleOption: resolveScheduleOption(selWhat),
                eventTiming: needsTiming ? resolveEventTiming(selTiming) : "none",
              });
              if (hasTodaysScan) {
                navigate({ to: "/results" });
              } else {
                navigate({ to: "/scan", search: { onboarding: fromOnboarding } });
              }
            } catch (err) {
              console.error("Failed to save check-in", err);
              setSubmitError("Couldn't save your check-in. Please try again.");
              setSubmitting(false);
            }
          }}
          className="mx-auto block w-full max-w-[400px] rounded-2xl bg-brand py-4 text-[15px] font-semibold text-white shadow-lift disabled:cursor-not-allowed disabled:opacity-40"
        >
          {submitting
            ? "Saving…"
            : scanCompletedToday
              ? "Save check-in & view results"
              : "Continue to skin scan"}
        </button>
      </div>
    </AppShell>
  );
}

function ChipGrid({
  options,
  selected,
  onToggle,
}: {
  options: string[];
  selected: string[];
  onToggle: (v: string) => void;
}) {
  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {options.map((o) => {
        const on = selected.includes(o);
        return (
          <button
            key={o}
            onClick={() => onToggle(o)}
            className={`rounded-full border px-4 py-2 text-[13px] font-medium transition ${
              on ? "border-brand bg-brand text-white" : "border-hairline bg-white text-ink"
            }`}
          >
            {o}
          </button>
        );
      })}
    </div>
  );
}
