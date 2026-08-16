import { supabase } from "./supabaseClient";
import { getCurrentUserId } from "./demoUser";

export interface Profile {
  id: string;
  displayName: string | null;
  hasCompletedOnboarding: boolean;
  /** One entry per onboarding step (src/routes/onboarding.tsx STEPS),
   * stored as-is — not yet consumed by recommendationEngine.ts. */
  onboardingAnswers: string[][] | null;
}

interface ProfileRow {
  id: string;
  display_name: string | null;
  has_completed_onboarding: boolean;
  onboarding_answers: string[][] | null;
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
    onboardingAnswers: row.onboarding_answers,
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

/**
 * Persists the raw onboarding survey answers (src/routes/onboarding.tsx) to
 * profiles.onboarding_answers — profile-level preference data only. Never
 * feeds ingredient_reactions or recommendationEngine.ts.
 */
export async function saveOnboardingAnswers(answers: string[][]): Promise<void> {
  const userId = await getCurrentUserId();

  const { error } = await supabase
    .from("profiles")
    .update({ onboarding_answers: answers })
    .eq("id", userId);

  if (error) throw error;
}
