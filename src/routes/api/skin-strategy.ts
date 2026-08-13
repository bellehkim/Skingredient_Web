import { createFileRoute } from "@tanstack/react-router";
import { generateSkinStrategy, type SkinStrategyInput } from "@/lib/skinStrategyService";
import type { EventTiming, ScheduleOption } from "@/lib/types";

const SCHEDULE_OPTIONS: ScheduleOption[] = [
  "important-event",
  "outdoor-day",
  "travel",
  "cosmetic-treatment",
  "none",
];

const EVENT_TIMINGS: EventTiming[] = ["tomorrow", "three-days", "week", "none"];

function isValidBody(body: unknown): body is SkinStrategyInput {
  if (!body || typeof body !== "object") return false;
  const b = body as Record<string, unknown>;

  const scores = b.scores as Record<string, unknown> | undefined;
  const scoresValid =
    !!scores &&
    ["redness", "hydration", "oiliness", "acne", "pores", "texture", "ageSpots"].every(
      (key) => typeof scores[key] === "number",
    );

  const overallCondition = b.overallCondition as Record<string, unknown> | undefined;
  const overallConditionValid =
    !!overallCondition &&
    typeof overallCondition.score === "number" &&
    typeof overallCondition.label === "string";

  return (
    scoresValid &&
    overallConditionValid &&
    typeof b.skinType === "string" &&
    Array.isArray(b.concerns) &&
    b.concerns.every((c) => typeof c === "string") &&
    typeof b.scheduleTomorrow === "string" &&
    SCHEDULE_OPTIONS.includes(b.scheduleTomorrow as ScheduleOption) &&
    typeof b.eventTiming === "string" &&
    EVENT_TIMINGS.includes(b.eventTiming as EventTiming) &&
    Array.isArray(b.shelfCategories) &&
    b.shelfCategories.every((c) => typeof c === "string")
  );
}

// Called once, client-side, right after a scan completes and before the
// analysis is persisted (src/routes/scan.index.tsx) — never on page
// load/refresh/History open, and never retried automatically on failure.
export const Route = createFileRoute("/api/skin-strategy")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = await request.json().catch(() => null);
        if (!isValidBody(body)) {
          return Response.json(
            { error: "Missing or invalid skin strategy input" },
            { status: 400 },
          );
        }

        const skinStrategy = await generateSkinStrategy(body);
        if (!skinStrategy) {
          return Response.json({ error: "Skin strategy generation failed" }, { status: 502 });
        }

        return Response.json({ skinStrategy });
      },
    },
  },
});
