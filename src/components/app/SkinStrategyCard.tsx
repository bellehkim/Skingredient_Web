/** Exported so tests (and any other caller that needs to distinguish "a real
 * strategy" from "the fallback") can reference the exact same string rather
 * than duplicating this literal — see src/data/demoFixture.test.ts, which
 * asserts DEMO_SKIN_STRATEGY never accidentally collapses to this. */
export const SKIN_STRATEGY_FALLBACK_TEXT =
  "Focus on today's recommended ingredients and keep your routine consistent.";

/**
 * Shows the stored "Today's Skin Strategy" AI paragraph (src/lib/skinStrategyService.ts)
 * — generated once at scan time and persisted with the analysis, never
 * regenerated here. Shared by Results (today's analysis) and History (a past
 * analysis) so both surfaces render the exact same stored text. If generation
 * failed, shows a minimal non-AI fallback rather than retrying.
 */
export function SkinStrategyCard({ strategy }: { strategy?: string | null }) {
  return (
    <section className="mt-4 rounded-3xl border border-hairline bg-white p-5 shadow-soft">
      <h3 className="text-[15px] font-semibold text-ink">✨ Today's skin strategy</h3>
      <p className="mt-2 text-[13.5px] leading-relaxed text-ink-muted">
        {strategy ?? SKIN_STRATEGY_FALLBACK_TEXT}
      </p>
    </section>
  );
}
