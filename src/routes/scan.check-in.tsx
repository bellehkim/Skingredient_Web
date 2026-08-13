import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { useMemo, useState } from "react";
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

export const Route = createFileRoute("/scan/check-in")({
  head: () => ({ meta: [{ title: "Daily check-in — Skingredient" }] }),
  component: CheckIn,
});

function CheckIn() {
  const navigate = useNavigate();
  const router = useRouter();
  // Reachable from Home's "Today's skin check" banner, Home's "Scan skin"
  // quick action, and /scan's "Daily check-in" link — no single hardcoded
  // back destination is correct for all three, so back retraces actual
  // navigation history instead (see MobileHeader/DesktopTopBar's onBack).
  const goBack = () => router.history.back();
  const { setSymptoms, setScheduleTomorrow, setEventTiming, markScanCompleted } = useAppStore();
  const [selFeel, setSelFeel] = useState<string[]>([]);
  const [selTried, setSelTried] = useState<string[]>([]);
  // Single-select — one event type/timing, not several combined — unlike the
  // multi-select feelings/tried chips above.
  const [selWhat, setSelWhat] = useState<string | null>(null);
  const [selTiming, setSelTiming] = useState<string | null>(null);
  const needsTiming = selWhat !== null && selWhat !== "Nothing special";
  const canContinue = !needsTiming || selTiming !== null;

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

        <h3 className="mt-8 text-[17px] font-semibold text-ink">Did you try anything new?</h3>
        <ChipGrid
          options={tried}
          selected={selTried}
          onToggle={(v) => toggle(selTried, setSelTried, v)}
        />

        <h3 className="mt-8 text-[17px] font-semibold text-ink">What's happening?</h3>
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
            <h3 className="mt-8 text-[17px] font-semibold text-ink">When is it?</h3>
            <ChipGrid
              options={timingOptions}
              selected={selTiming ? [selTiming] : []}
              onToggle={(v) => setSelTiming(v)}
            />
          </>
        )}
      </PageContainer>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-hairline bg-white px-5 py-4">
        <button
          disabled={!canContinue}
          onClick={() => {
            const mapped = selFeel.map((s) => s.toLowerCase().replace(/\s+/g, "-"));
            setSymptoms(mapped);
            setScheduleTomorrow(resolveScheduleOption(selWhat));
            setEventTiming(needsTiming ? resolveEventTiming(selTiming) : "none");
            markScanCompleted();
            navigate({ to: "/scan" });
          }}
          className="mx-auto block w-full max-w-[400px] rounded-2xl bg-[#9d86fc] py-4 text-[15px] font-semibold text-white shadow-lift disabled:opacity-60"
        >
          Continue to skin scan
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
              on ? "border-[#9d86fc] bg-[#9d86fc] text-white" : "border-hairline bg-white text-ink"
            }`}
          >
            {o}
          </button>
        );
      })}
    </div>
  );
}
