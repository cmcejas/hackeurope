import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  updated_at: string;
  onboarding_completed_at: string | null;
  had_allergies: boolean | null;
  respiratory_issues: boolean | null;
  immunocompromised: boolean | null;
};

export type OnboardingAnswers = {
  hadAllergies: boolean;
  respiratoryIssues: boolean;
  immunocompromised: boolean;
};

export function useProfile(userId: string | undefined) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(!!userId);

  const fetchProfile = useCallback(async (id: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, created_at, updated_at, onboarding_completed_at, had_allergies, respiratory_issues, immunocompromised')
      .eq('id', id)
      .single();
    setLoading(false);
    if (error) {
      setProfile(null);
      return;
    }
    setProfile(data as Profile);
  }, []);

  useEffect(() => {
    if (!userId) {
      setProfile(null);
      setLoading(false);
      return;
    }
    fetchProfile(userId);
  }, [userId, fetchProfile]);

  const completeOnboarding = useCallback(
    async (answers: OnboardingAnswers) => {
      if (!userId) return;
      const now = new Date().toISOString();
      const { error } = await supabase
        .from('profiles')
        .update({
          onboarding_completed_at: now,
          had_allergies: answers.hadAllergies,
          respiratory_issues: answers.respiratoryIssues,
          immunocompromised: answers.immunocompromised,
        })
        .eq('id', userId);
      if (!error) {
        setProfile((prev) =>
          prev
            ? {
                ...prev,
                onboarding_completed_at: now,
                had_allergies: answers.hadAllergies,
                respiratory_issues: answers.respiratoryIssues,
                immunocompromised: answers.immunocompromised,
              }
            : null
        );
      }
      return error;
    },
    [userId]
  );

  return { profile, loading, completeOnboarding, refetch: fetchProfile };
}
