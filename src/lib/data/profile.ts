import { supabase } from "./supabaseClient";
import { getCurrentUserId } from "./demoUser";

export interface Profile {
  id: string;
  displayName: string | null;
  hasCompletedOnboarding: boolean;
}

interface ProfileRow {
  id: string;
  display_name: string | null;
  has_completed_onboarding: boolean;
}

export async function getProfile(): Promise<Profile | null> {
  const userId = await getCurrentUserId();

  const { data, error } = await supabase.from("profiles").select().eq("id", userId).maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const row = data as ProfileRow;
  return {
    id: row.id,
    displayName: row.display_name,
    hasCompletedOnboarding: row.has_completed_onboarding,
  };
}

export async function setOnboardingCompleted(completed: boolean): Promise<void> {
  const userId = await getCurrentUserId();

  const { error } = await supabase
    .from("profiles")
    .update({ has_completed_onboarding: completed })
    .eq("id", userId);

  if (error) throw error;
}
