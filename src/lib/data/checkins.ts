import { supabase } from "./supabaseClient";
import { getCurrentUserId } from "./demoUser";
import { todayDateString } from "@/lib/date";
import type { EventTiming, ScheduleOption } from "@/lib/types";

export interface TodaysCheckIn {
  symptoms: string[];
  scheduleOption: ScheduleOption;
  eventTiming: EventTiming;
}

interface CheckInRow {
  symptoms: string[];
  schedule_option: ScheduleOption;
  event_timing: EventTiming;
}

function rowToCheckIn(row: CheckInRow): TodaysCheckIn {
  return {
    symptoms: row.symptoms,
    scheduleOption: row.schedule_option,
    eventTiming: row.event_timing,
  };
}

/** Today's Daily Check-in (src/routes/scan.check-in.tsx), or null if the
 * user hasn't checked in yet today. Never reads yesterday's row — the date
 * boundary is check_in_date = today (src/lib/date.ts), enforced server-side. */
export async function getTodaysCheckIn(): Promise<TodaysCheckIn | null> {
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from("daily_checkins")
    .select("symptoms, schedule_option, event_timing")
    .eq("user_id", userId)
    .eq("check_in_date", todayDateString())
    .maybeSingle();

  if (error) throw error;
  return data ? rowToCheckIn(data as CheckInRow) : null;
}

/** Every calendar day this user has ever checked in on ("YYYY-MM-DD"
 * strings), for streak calculation (src/lib/streak.ts) — not scoped to
 * today like getTodaysCheckIn(). */
export async function getCheckInDates(): Promise<string[]> {
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from("daily_checkins")
    .select("check_in_date")
    .eq("user_id", userId);

  if (error) throw error;
  return (data as { check_in_date: string }[]).map((row) => row.check_in_date);
}

/**
 * Upserts today's check-in, keyed by (user_id, check_in_date) — submitting
 * again today updates today's row rather than creating a duplicate. One row
 * per user per day, never a log.
 */
export async function upsertTodaysCheckIn(input: TodaysCheckIn): Promise<TodaysCheckIn> {
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from("daily_checkins")
    .upsert(
      {
        user_id: userId,
        check_in_date: todayDateString(),
        symptoms: input.symptoms,
        schedule_option: input.scheduleOption,
        event_timing: input.eventTiming,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,check_in_date" },
    )
    .select("symptoms, schedule_option, event_timing")
    .single();

  if (error) throw error;
  return rowToCheckIn(data as CheckInRow);
}
