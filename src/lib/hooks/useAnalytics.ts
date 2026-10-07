"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { ClickStat } from "@/types/database";

export interface AnalyticsSummary {
  statsBySection: Record<string, { totalClicks: number; totalCopies: number; last7d: number }>;
  totalClicks: number;
  totalCopies: number;
  last7dClicks: number;
  topSections: { sectionId: string; total: number; last7d: number }[];
}

/**
 * Fetches click/copy statistics for the authenticated user's blocks.
 */
export function useAnalytics() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<AnalyticsSummary>({
    statsBySection: {},
    totalClicks: 0,
    totalCopies: 0,
    last7dClicks: 0,
    topSections: [],
  });

  const supabase = createClient();

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      const { data, error: err } = await supabase
        .from("section_click_stats")
        .select("*")
        .eq("profile_id", user.id);

      if (err) throw err;

      const raw = (data as ClickStat[]) ?? [];
      const statsBySection: AnalyticsSummary["statsBySection"] = {};
      let totalClicks = 0;
      let totalCopies = 0;
      let last7dClicks = 0;

      for (const row of raw) {
        if (!statsBySection[row.section_id]) {
          statsBySection[row.section_id] = { totalClicks: 0, totalCopies: 0, last7d: 0 };
        }
        if (row.kind === "click") {
          statsBySection[row.section_id].totalClicks += row.total;
          totalClicks += row.total;
        } else if (row.kind === "copy") {
          statsBySection[row.section_id].totalCopies += row.total;
          totalCopies += row.total;
        }
        statsBySection[row.section_id].last7d += row.last_7d;
        last7dClicks += row.last_7d;
      }

      const topSections = Object.entries(statsBySection)
        .map(([sectionId, stat]) => ({
          sectionId,
          total: stat.totalClicks + stat.totalCopies,
          last7d: stat.last7d,
        }))
        .sort((a, b) => b.total - a.total);

      setSummary({
        statsBySection,
        totalClicks,
        totalCopies,
        last7dClicks,
        topSections,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar estatísticas");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void fetchStats(); }, 0);
    return () => window.clearTimeout(timer);
  }, [fetchStats]);

  return { loading, error, summary, refetch: fetchStats };
}
