// src/hooks/useUserProfile.ts
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { FullProfile } from '../types';

export const useUserProfile = (userId: string | undefined) => {
  const [profile, setProfile] = useState<FullProfile | null>(null);
  const [passions, setPassions] = useState<string[]>([]);
  const [languages, setLanguages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select(`*, locations(*)`)
        .eq('id', userId)
        .single();

      if (profileError) throw new Error(profileError.message);
      setProfile(profileData as FullProfile);

      const [passionRes, languageRes] = await Promise.all([
        supabase.from('profile_passions').select('passions(name)').eq('profile_id', userId),
        supabase.from('profile_languages').select('languages(name)').eq('profile_id', userId)
      ]);

      if (passionRes.error) throw new Error(passionRes.error.message);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setPassions(passionRes.data?.map((p: any) => p.passions.name) || []);

      if (languageRes.error) throw new Error(languageRes.error.message);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setLanguages(languageRes.data?.map((l: any) => l.languages.name) || []);

    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return { profile, passions, languages, loading, error, refresh: fetchProfile };
};