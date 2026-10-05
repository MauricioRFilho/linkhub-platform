"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Profile, Social, Theme, Section, Meta } from "@/types/database";

interface ProfileData {
  profile: Profile;
  socials: Social[];
  theme: Theme;
  sections: Section[];
  meta: Meta;
}

interface UseProfileReturn {
  data: ProfileData | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Fetches all data for the authenticated user's profile.
 * Used in the dashboard for editing.
 */
export function useProfile(): UseProfileReturn {
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      const [profileRes, socialsRes, themeRes, sectionsRes, metaRes] =
        await Promise.all([
          supabase.from("profiles").select("*").eq("id", user.id).single(),
          supabase.from("socials").select("*").eq("profile_id", user.id).order("sort_order"),
          supabase.from("themes").select("*").eq("profile_id", user.id).single(),
          supabase.from("sections").select("*").eq("profile_id", user.id).order("sort_order"),
          supabase.from("meta").select("*").eq("profile_id", user.id).single(),
        ]);

      if (profileRes.error) throw profileRes.error;
      if (socialsRes.error) throw socialsRes.error;
      if (themeRes.error || !themeRes.data) throw themeRes.error ?? new Error("Tema do perfil não encontrado");
      if (sectionsRes.error) throw sectionsRes.error;
      if (metaRes.error || !metaRes.data) throw metaRes.error ?? new Error("Configuração de SEO não encontrada");

      setData({
        profile: profileRes.data,
        socials: socialsRes.data,
        theme: themeRes.data,
        sections: sectionsRes.data,
        meta: metaRes.data,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar perfil");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void fetchProfile(); }, 0);
    return () => window.clearTimeout(timer);
  }, [fetchProfile]);

  return { data, loading, error, refetch: fetchProfile };
}
