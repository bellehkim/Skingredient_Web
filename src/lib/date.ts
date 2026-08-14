/**
 * Canonical "today" string (zero-padded YYYY-MM-DD, local time) — the one
 * definition of "today" shared by every day-boundary comparison in the app:
 * daily_checkins.check_in_date (src/lib/data/checkins.ts) and "is this
 * analysis's analyzed_at today" (src/lib/appStore.tsx). Local time, not UTC,
 * so it matches what the user actually experiences as "today".
 */
export function todayDateString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
