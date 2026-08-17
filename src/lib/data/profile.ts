import { supabase } from "./supabaseClient";
import { getCurrentUserId } from "./demoUser";
import { isDemoModeActive } from "@/lib/demoMode";
import { getLocalRows, upsertLocalRow } from "./localStore";

interface LocalProfileRow {
  id: string;
  display_name: string | null;
  has_completed_onboarding: boolean;
  onboarding_answers: string[][] | null;
}

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

  if (isDemoModeActive()) {
    const [row] = getLocalRows<LocalProfileRow>("profiles", { id: userId });
    // No local row yet (fresh browser/reset) — same shape a brand-new
    // profiles row would have, without writing anything until an update.
    return {
      id: userId,
      displayName: row?.display_name ?? null,
      hasCompletedOnboarding: row?.has_completed_onboarding ?? false,
      onboardingAnswers: row?.onboarding_answers ?? null,
    };
  }

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

  if (isDemoModeActive()) {
    upsertLocalRow<LocalProfileRow>(
      "profiles",
      { id: userId },
      { has_completed_onboarding: completed },
    );
    return;
  }

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

  if (isDemoModeActive()) {
    upsertLocalRow<LocalProfileRow>("profiles", { id: userId }, { onboarding_answers: answers });
    return;
  }

  const { error } = await supabase
    .from("profiles")
    .update({ onboarding_answers: answers })
    .eq("id", userId);

  if (error) throw error;
}
