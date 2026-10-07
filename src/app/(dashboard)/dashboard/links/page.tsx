"use client";

import { useState } from "react";
import { useProfile } from "@/lib/hooks/useProfile";
import { useLinks } from "@/lib/hooks/useLinks";
import { useAnalytics } from "@/lib/hooks/useAnalytics";
import { scheduleStatus } from "@/lib/blocks/schedule";
import { buildTree, type WithChildren } from "@/lib/blocks/tree";
import { parseVideoUrl } from "@/lib/blocks/config";
import type { Section, Json } from "@/types/database";
import type { Preset } from "@/lib/blocks/presets";
import {
  Plus,
  Trash2,
  ExternalLink,
  Loader2,
  AlertCircle,
  Pencil,
  ArrowUp,
  ArrowDown,
  Sparkles,
  Layout,
  Copy,
  Clock,
  MousePointerClick,
} from "lucide-react";

import PresetModal from "@/components/dashboard/blocks/PresetModal";
import BlockEditorForm, { type FormValues } from "@/components/dashboard/blocks/BlockEditorForm";

export default function LinksManagerPage() {
  const { data, loading: profileLoading, error: profileError, refetch } = useProfile();
  const {
    addSection,
    updateSection,
    deleteSection,
    toggleActive,
    reorderSections,
    applyPreset,
    duplicateSection,
    saving,
    error: linksError,
  } = useLinks();
  const { summary: analyticsSummary } = useAnalytics();

  const [isPresetModalOpen, setIsPresetModalOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [addingParentId, setAddingParentId] = useState<string | null>(null);
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-zinc-400 animate-spin" />
      </div>
    );
  }

  if (!data) {
    return profileError ? (
      <p role="alert" className="text-sm text-red-400">
        {profileError}
      </p>
    ) : null;
  }

  const rawSections = data.sections;
  const tree = buildTree(rawSections);
  const panels = rawSections.filter((s) => s.type === "panel");

  async function handleApplyPreset(preset: Preset) {
    setActionError(null);
    const success = await applyPreset(preset, rawSections.length);
    if (success) {
      setIsPresetModalOpen(false);
      await refetch();
    }
  }

  async function handleDuplicate(section: Section, children?: Section[]) {
    setActionError(null);
    const success = await duplicateSection(section, children);
    if (success) {
      await refetch();
    }
  }

  async function handleSaveForm(values: FormValues): Promise<boolean> {
    setActionError(null);
    try {
      // Build config JSON based on type
      let config: Json = {};
      if (values.type === "product") {
        config = {
          price: values.productPrice || undefined,
          oldPrice: values.productOldPrice || undefined,
          badge: values.productBadge || undefined,
        };
      } else if (values.type === "coupon") {
        config = {
          code: values.couponCode,
          discount: values.couponDiscount || undefined,
          validUntil: values.couponValidUntil || undefined,
        };
      } else if (values.type === "community") {
        config = {
          platform: values.communityPlatform,
          cta: values.communityCta || undefined,
          members: values.communityMembers || undefined,
        };
      } else if (values.type === "video") {
        const parsed = parseVideoUrl(values.videoUrl);
        if (parsed) {
          config = { provider: parsed.provider, videoId: parsed.videoId };
        }
      } else if (values.type === "text") {
        config = { markdown: values.textMarkdown };
      } else if (values.type === "panel") {
        config = { showCountdown: values.panelShowCountdown };
      }

      if (editingSection) {
        const ok = await updateSection(editingSection.id, {
          title: values.title,
          subtitle: values.subtitle || null,
          url: values.url || null,
          emoji: values.emoji || null,
          thumbnail_url: values.thumbnailUrl || null,
          store: values.store || null,
          type: values.type,
          layout: values.type === "panel" ? values.layout : null,
          parent_id: values.parentId,
          config,
          starts_at: values.startsAt || null,
          ends_at: values.endsAt || null,
        });
        if (ok) {
          setEditingSection(null);
          await refetch();
          return true;
        }
      } else {
        const added = await addSection({
          title: values.title,
          subtitle: values.subtitle || null,
          url: values.url || null,
          emoji: values.emoji || null,
          thumbnail_url: values.thumbnailUrl || null,
          store: values.store || null,
          type: values.type,
          layout: values.type === "panel" ? values.layout : null,
          parent_id: values.parentId,
          config,
          starts_at: values.startsAt || null,
          ends_at: values.endsAt || null,
          sort_order: rawSections.length,
          active: true,
        });
        if (added) {
          setIsAdding(false);
          setAddingParentId(null);
          await refetch();
          return true;
        }
      }
      return false;
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Erro ao salvar bloco");
      return false;
    }
  }

  async function handleToggle(id: string, current: boolean) {
    if (await toggleActive(id, !current)) await refetch();
  }

  async function handleDelete(id: string, isPanel: boolean) {
    const msg = isPanel
      ? "Excluir este painel também excluirá todos os blocos dentro dele. Tem certeza?"
      : "Tem certeza que deseja excluir este item?";
    if (!confirm(msg)) return;
    if (await deleteSection(id)) await refetch();
  }

  async function moveItem(items: Section[], index: number, direction: -1 | 1) {
    const destination = index + direction;
    if (destination < 0 || destination >= items.length) return;
    const reordered = [...items];
    [reordered[index], reordered[destination]] = [reordered[destination], reordered[index]];

    // Create a complete list of reordered IDs respecting the global sort_order
    const updatedOrder = [...rawSections];
    const itemA = items[index];
    const itemB = items[destination];
    const globalIdxA = updatedOrder.findIndex((s) => s.id === itemA.id);
    const globalIdxB = updatedOrder.findIndex((s) => s.id === itemB.id);

    if (globalIdxA !== -1 && globalIdxB !== -1) {
      [updatedOrder[globalIdxA], updatedOrder[globalIdxB]] = [
        updatedOrder[globalIdxB],
        updatedOrder[globalIdxA],
      ];
      if (await reorderSections(updatedOrder.map((s) => s.id))) await refetch();
    }
  }

  function renderStatusBadge(section: Section) {
    const status = scheduleStatus(section);
    switch (status) {
      case "live":
        return (
          <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            No ar
          </span>
        );
      case "scheduled":
        return (
          <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock className="w-3 h-3" />
            Agendado
          </span>
        );
      case "expired":
        return (
          <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
            <Clock className="w-3 h-3" />
            Expirado
          </span>
        );
      case "hidden":
        return (
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-500">
            Oculto
          </span>
        );
    }
  }

  function renderBlockRow(
    section: Section,
    index: number,
    siblingList: Section[],
    isNested = false
  ) {
    const stat = analyticsSummary.statsBySection[section.id];
    const totalInteractions = (stat?.totalClicks ?? 0) + (stat?.totalCopies ?? 0);

    return (
      <div
        key={section.id}
        className={`flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl border transition-all ${
          isNested ? "bg-zinc-950/80 border-zinc-800/60 ml-4 md:ml-6" : "bg-zinc-900/60 border-zinc-800/80"
        } ${section.active ? "hover:border-zinc-700" : "opacity-60"}`}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {section.emoji && <span className="text-lg shrink-0">{section.emoji}</span>}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-medium text-white truncate">{section.title}</p>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 capitalize">
                {section.type}
              </span>
              {renderStatusBadge(section)}
            </div>
            {section.subtitle && (
              <p className="text-xs text-zinc-400 truncate mt-0.5">{section.subtitle}</p>
            )}
            {section.url && (
              <a
                href={section.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-zinc-500 hover:text-zinc-300 truncate flex items-center gap-1 mt-0.5"
              >
                {section.url}
                <ExternalLink className="w-3 h-3 shrink-0" />
              </a>
            )}
          </div>
        </div>

        {/* Right action bar */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Quick stats indicator */}
          {totalInteractions > 0 && (
            <span
              title={`${stat?.totalClicks ?? 0} cliques, ${stat?.totalCopies ?? 0} cópias`}
              className="mr-2 flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md"
            >
              <MousePointerClick className="w-3 h-3" />
              {totalInteractions}
            </span>
          )}

          <button
            type="button"
            onClick={() => moveItem(siblingList, index, -1)}
            disabled={saving || index === 0}
            aria-label={`Mover ${section.title} para cima`}
            className="p-1.5 rounded-lg text-zinc-500 hover:text-white disabled:opacity-30"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => moveItem(siblingList, index, 1)}
            disabled={saving || index === siblingList.length - 1}
            aria-label={`Mover ${section.title} para baixo`}
            className="p-1.5 rounded-lg text-zinc-500 hover:text-white disabled:opacity-30"
          >
            <ArrowDown className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => handleDuplicate(section)}
            title="Duplicar item"
            className="p-1.5 rounded-lg text-zinc-500 hover:text-emerald-400 hover:bg-emerald-500/10"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              setAddingParentId(null);
              setIsAdding(false);
              setEditingSection(section);
            }}
            aria-label={`Editar ${section.title}`}
            className="p-1.5 rounded-lg text-zinc-500 hover:text-sky-400 hover:bg-sky-500/10"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => handleToggle(section.id, section.active)}
            disabled={saving}
            className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${
              section.active
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                : "bg-zinc-800 text-zinc-500"
            }`}
          >
            {section.active ? "Ativo" : "Oculto"}
          </button>
          <button
            type="button"
            onClick={() => handleDelete(section.id, false)}
            disabled={saving}
            aria-label={`Excluir ${section.title}`}
            className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Conteúdo & Painéis</h1>
          <p className="text-zinc-400 text-sm">
            Monte sua árvore de links, produtos da semana, cupons e comunidades de forma 100% dinâmica.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsPresetModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-900 border border-emerald-500/30 hover:border-emerald-500 text-emerald-400 hover:text-emerald-300 text-xs font-semibold transition-all shadow-sm"
          >
            <Sparkles className="w-4 h-4" />
            Modelos Prontos
          </button>
          <button
            type="button"
            onClick={() => {
              setEditingSection(null);
              setAddingParentId(null);
              setIsAdding(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors shadow-md shadow-emerald-950"
          >
            <Plus className="w-4 h-4" />
            Novo Bloco / Painel
          </button>
        </div>
      </div>

      {/* Editor Form (Active when adding or editing) */}
      {(isAdding || editingSection) && (
        <BlockEditorForm
          initialSection={editingSection}
          parentId={addingParentId}
          availablePanels={panels}
          onSave={handleSaveForm}
          onCancel={() => {
            setIsAdding(false);
            setAddingParentId(null);
            setEditingSection(null);
          }}
          saving={saving}
        />
      )}

      {(actionError || linksError) && (
        <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {actionError || linksError}
        </div>
      )}

      {/* Hierarchical Blocks Tree */}
      <div className="space-y-4">
        {tree.length === 0 ? (
          <div className="text-center py-16 bg-zinc-900/30 border border-dashed border-zinc-800 rounded-2xl space-y-3">
            <p className="text-zinc-400 text-sm">Nenhum bloco ou painel cadastrado ainda.</p>
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setIsPresetModalOpen(true)}
                className="text-xs px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 font-semibold"
              >
                ✨ Começar com um Modelo Pronto
              </button>
              <button
                type="button"
                onClick={() => setIsAdding(true)}
                className="text-xs px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 hover:text-white"
              >
                Criar do Zero
              </button>
            </div>
          </div>
        ) : (
          tree.map((node, index) => {
            if (node.type === "panel") {
              const panel = node as WithChildren<Section>;
              const topList = tree.map((t) => t as Section);

              return (
                <div
                  key={panel.id}
                  className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 space-y-3"
                >
                  {/* Panel Header Card */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-zinc-800/80">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                        <Layout className="w-4 h-4" />
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-sm font-bold text-white truncate">{panel.title}</h2>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-emerald-400 font-mono uppercase">
                            {panel.layout}
                          </span>
                          {renderStatusBadge(panel)}
                        </div>
                        {panel.subtitle && (
                          <p className="text-xs text-zinc-400 mt-0.5 truncate">{panel.subtitle}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingSection(null);
                          setAddingParentId(panel.id);
                          setIsAdding(true);
                        }}
                        className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white font-medium transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Adicionar Bloco Aqui
                      </button>
                      <button
                        type="button"
                        onClick={() => moveItem(topList, index, -1)}
                        disabled={saving || index === 0}
                        aria-label="Mover painel para cima"
                        className="p-1.5 rounded-lg text-zinc-500 hover:text-white disabled:opacity-30"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveItem(topList, index, 1)}
                        disabled={saving || index === topList.length - 1}
                        aria-label="Mover painel para baixo"
                        className="p-1.5 rounded-lg text-zinc-500 hover:text-white disabled:opacity-30"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDuplicate(panel, panel.children)}
                        title="Duplicar painel e blocos"
                        className="p-1.5 rounded-lg text-zinc-500 hover:text-emerald-400 hover:bg-emerald-500/10"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setAddingParentId(null);
                          setIsAdding(false);
                          setEditingSection(panel);
                        }}
                        aria-label="Editar painel"
                        className="p-1.5 rounded-lg text-zinc-500 hover:text-sky-400 hover:bg-sky-500/10"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggle(panel.id, panel.active)}
                        className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                          panel.active
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : "bg-zinc-800 text-zinc-500"
                        }`}
                      >
                        {panel.active ? "Ativo" : "Oculto"}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(panel.id, true)}
                        aria-label="Excluir painel"
                        className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Children blocks inside panel */}
                  <div className="space-y-2 pt-1">
                    {panel.children.length === 0 ? (
                      <p className="text-xs text-zinc-500 italic pl-4 py-2">
                        Painel vazio. Clique em &quot;Adicionar Bloco Aqui&quot; para inserir produtos, cupons ou links dentro dele.
                      </p>
                    ) : (
                      panel.children.map((child, cIdx) =>
                        renderBlockRow(child, cIdx, panel.children, true)
                      )
                    )}
                  </div>
                </div>
              );
            }

            // Top-level standalone block
            return renderBlockRow(node, index, tree as Section[], false);
          })
        )}
      </div>

      {/* Preset Modal */}
      <PresetModal
        isOpen={isPresetModalOpen}
        onClose={() => setIsPresetModalOpen(false)}
        onSelect={handleApplyPreset}
        applying={saving}
      />
    </div>
  );
}
