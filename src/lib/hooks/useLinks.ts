"use client";

import { useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Section, Database, Json } from "@/types/database";
import type { Preset } from "@/lib/blocks/presets";

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
  applyPreset: (preset: Preset, currentSectionsCount: number) => Promise<boolean>;
  duplicateSection: (section: Section, children?: Section[]) => Promise<boolean>;
}

/**
 * CRUD operations for blocks and panels.
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

  const applyPreset = useCallback(
    async (preset: Preset, currentSectionsCount: number): Promise<boolean> => {
      setSaving(true);
      setError(null);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Não autenticado");

        // 1. Create panel
        const { data: panel, error: panelErr } = await supabase
          .from("sections")
          .insert({
            profile_id: user.id,
            type: preset.panel.type,
            title: preset.panel.title,
            layout: preset.panel.layout ?? "spotlight",
            config: (preset.panel.config ?? {}) as Json,
            ends_at: preset.panel.ends_at ?? null,
            sort_order: currentSectionsCount,
            active: true,
          })
          .select()
          .single();

        if (panelErr || !panel) throw panelErr ?? new Error("Falha ao criar painel do preset");

        // 2. Create children
        if (preset.children.length > 0) {
          const childrenInserts = preset.children.map((child, idx) => ({
            profile_id: user.id,
            parent_id: panel.id,
            type: child.type,
            title: child.title,
            subtitle: child.subtitle ?? null,
            url: child.url ?? null,
            emoji: child.emoji ?? null,
            store: child.store ?? null,
            config: (child.config ?? {}) as Json,
            sort_order: idx,
            active: true,
          }));

          const { error: childrenErr } = await supabase
            .from("sections")
            .insert(childrenInserts);

          if (childrenErr) throw childrenErr;
        }

        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao aplicar preset");
        return false;
      } finally {
        setSaving(false);
      }
    },
    [supabase]
  );

  const duplicateSection = useCallback(
    async (section: Section, children?: Section[]): Promise<boolean> => {
      setSaving(true);
      setError(null);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Não autenticado");

        // Duplicate parent
        const { data: newParent, error: err } = await supabase
          .from("sections")
          .insert({
            profile_id: user.id,
            parent_id: section.parent_id,
            type: section.type,
            title: `${section.title} (cópia)`,
            subtitle: section.subtitle,
            url: section.url,
            emoji: section.emoji,
            thumbnail_url: section.thumbnail_url,
            store: section.store,
            layout: section.layout,
            config: section.config,
            starts_at: section.starts_at,
            ends_at: section.ends_at,
            sort_order: section.sort_order + 1,
            active: false, // Inactive so user can tweak first
          })
          .select()
          .single();

        if (err || !newParent) throw err ?? new Error("Falha ao duplicar item");

        // Duplicate children if any
        if (children && children.length > 0) {
          const childrenInserts = children.map((c, idx) => ({
            profile_id: user.id,
            parent_id: newParent.id,
            type: c.type,
            title: c.title,
            subtitle: c.subtitle,
            url: c.url,
            emoji: c.emoji,
            thumbnail_url: c.thumbnail_url,
            store: c.store,
            layout: c.layout,
            config: c.config,
            starts_at: c.starts_at,
            ends_at: c.ends_at,
            sort_order: idx,
            active: true,
          }));

          const { error: childErr } = await supabase.from("sections").insert(childrenInserts);
          if (childErr) throw childErr;
        }

        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao duplicar");
        return false;
      } finally {
        setSaving(false);
      }
    },
    [supabase]
  );

  return {
    saving,
    error,
    addSection,
    updateSection,
    deleteSection,
    reorderSections,
    toggleActive,
    applyPreset,
    duplicateSection,
  };
}
