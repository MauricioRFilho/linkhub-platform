"use client";

import { useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Section, Database } from "@/types/database";

type NewSection = Omit<Section, "id" | "created_at" | "profile_id">;
type SectionUpdate = Database["public"]["Tables"]["sections"]["Update"];

interface UseLinksReturn {
  saving: boolean;
  error: string | null;
  addSection: (section: NewSection) => Promise<Section | null>;
  updateSection: (id: string, updates: SectionUpdate) => Promise<boolean>;
  deleteSection: (id: string) => Promise<boolean>;
  reorderSections: (orderedIds: string[]) => Promise<boolean>;
  toggleActive: (id: string, active: boolean) => Promise<boolean>;
}

/**
 * CRUD operations for link sections.
 * All mutations respect RLS — only the authenticated user's sections can be modified.
 */
export function useLinks(): UseLinksReturn {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  const addSection = useCallback(
    async (section: NewSection): Promise<Section | null> => {
      setSaving(true);
      setError(null);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Não autenticado");

        const { data, error: err } = await supabase
          .from("sections")
          .insert({ ...section, profile_id: user.id })
          .select()
          .single();

        if (err) throw err;
        return data;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao adicionar");
        return null;
      } finally {
        setSaving(false);
      }
    },
    [supabase]
  );

  const updateSection = useCallback(
    async (id: string, updates: SectionUpdate): Promise<boolean> => {
      setSaving(true);
      setError(null);
      try {
        const { error: err } = await supabase
          .from("sections")
          .update(updates)
          .eq("id", id);

        if (err) throw err;
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao atualizar");
        return false;
      } finally {
        setSaving(false);
      }
    },
    [supabase]
  );

  const deleteSection = useCallback(
    async (id: string): Promise<boolean> => {
      setSaving(true);
      setError(null);
      try {
        const { error: err } = await supabase
          .from("sections")
          .delete()
          .eq("id", id);

        if (err) throw err;
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao deletar");
        return false;
      } finally {
        setSaving(false);
      }
    },
    [supabase]
  );

  const reorderSections = useCallback(
    async (orderedIds: string[]): Promise<boolean> => {
      setSaving(true);
      setError(null);
      try {
        const updates = orderedIds.map((id, index) =>
          supabase.from("sections").update({ sort_order: index }).eq("id", id)
        );

        const results = await Promise.all(updates);
        const failed = results.find((r) => r.error);
        if (failed?.error) throw failed.error;

        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao reordenar");
        return false;
      } finally {
        setSaving(false);
      }
    },
    [supabase]
  );

  const toggleActive = useCallback(
    async (id: string, active: boolean): Promise<boolean> => {
      return updateSection(id, { active });
    },
    [updateSection]
  );

  return { saving, error, addSection, updateSection, deleteSection, reorderSections, toggleActive };
}
