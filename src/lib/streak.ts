import { todayDateString } from "@/lib/date";

/**
 * Consecutive-day check-in streak (Home's "day skin check streak" and
 * Insights' "day streak" badges). Duolingo-style: counts backward from
 * today, or from yesterday if today's check-in hasn't happened yet (the day
 * isn't over, so it doesn't break the streak on its own) — for as long as
 * each preceding calendar day has a check-in. The first missing day stops
 * the count.
 */
export function calculateCheckInStreak(checkInDates: string[], today: Date = new Date()): number {
  const dates = new Set(checkInDates);
  const cursor = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  if (!dates.has(todayDateString(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
  }

  let streak = 0;
  while (dates.has(todayDateString(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}
