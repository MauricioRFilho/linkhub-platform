"use client";

import { useState } from "react";
import { useProfile } from "@/lib/hooks/useProfile";
import { useLinks } from "@/lib/hooks/useLinks";
import {
  Plus,
  Trash2,
  ExternalLink,
  Loader2,
  Check,
  AlertCircle,
  GripVertical,
} from "lucide-react";
import type { SectionType } from "@/types/database";

export default function LinksManagerPage() {
  const { data, loading, refetch } = useProfile();
  const { addSection, updateSection, deleteSection, toggleActive, saving } = useLinks();

  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newSubtitle, setNewSubtitle] = useState("");
  const [newType, setNewType] = useState<SectionType>("link");
  const [newEmoji, setNewEmoji] = useState("");

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-zinc-400 animate-spin" />
      </div>
    );
  }

  if (!data) return null;

  const { sections, profile } = data;

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const res = await addSection({
      title: newTitle.trim(),
      url: newUrl.trim() || null,
      subtitle: newSubtitle.trim() || null,
      type: newType,
      emoji: newEmoji.trim() || null,
      thumbnail_url: null,
      store: null,
      sort_order: sections.length,
      active: true,
    });

    if (res) {
      setNewTitle("");
      setNewUrl("");
      setNewSubtitle("");
      setNewEmoji("");
      setIsAdding(false);
      await refetch();
    }
  }

  async function handleToggle(id: string, current: boolean) {
    await toggleActive(id, !current);
    await refetch();
  }

  async function handleDelete(id: string) {
    if (!confirm("Tem certeza que deseja excluir este item?")) return;
    await deleteSection(id);
    await refetch();
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Meus Links & Seções</h1>
          <p className="text-zinc-400 text-sm">
            Adicione e organize os links visíveis no seu perfil público.
          </p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Novo Link
        </button>
      </div>

      {/* Modal / Inline Add Form */}
      {isAdding && (
        <form
          onSubmit={handleAdd}
          className="mb-8 p-5 rounded-2xl bg-zinc-900 border border-emerald-500/30 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">Adicionar novo item</h2>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="text-xs text-zinc-500 hover:text-zinc-300"
            >
              Cancelar
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Título *</label>
              <input
                type="text"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Ex: Meu GitHub ou Newsletter"
                className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">URL (destino)</label>
              <input
                type="url"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Subtítulo (opcional)</label>
              <input
                type="text"
                value={newSubtitle}
                onChange={(e) => setNewSubtitle(e.target.value)}
                placeholder="Ex: Atualizado toda semana"
                className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="flex gap-2">
              <div className="w-1/3">
                <label className="block text-xs text-zinc-400 mb-1">Emoji</label>
                <input
                  type="text"
                  maxLength={4}
                  value={newEmoji}
                  onChange={(e) => setNewEmoji(e.target.value)}
                  placeholder="🚀"
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-sm focus:outline-none focus:border-emerald-500 text-center"
                />
              </div>
              <div className="w-2/3">
                <label className="block text-xs text-zinc-400 mb-1">Tipo</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as SectionType)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-sm focus:outline-none focus:border-emerald-500"
                >
                  <option value="link">Link padrão</option>
                  <option value="product">Produto / Destaque</option>
                  <option value="header">Cabeçalho / Seção</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-4 py-2 rounded-xl text-xs text-zinc-400 hover:text-white"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              Salvar Link
            </button>
          </div>
        </form>
      )}

      {/* Sections List */}
      <div className="space-y-3">
        {sections.length === 0 ? (
          <div className="text-center py-16 bg-zinc-900/30 border border-dashed border-zinc-800 rounded-2xl">
            <p className="text-zinc-500 text-sm mb-3">Nenhum link cadastrado ainda.</p>
            <button
              onClick={() => setIsAdding(true)}
              className="text-xs px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 hover:text-white"
            >
              Criar meu primeiro link
            </button>
          </div>
        ) : (
          sections.map((section) => (
            <div
              key={section.id}
              className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                section.active
                  ? "bg-zinc-900/60 border-zinc-800/80 hover:border-zinc-700"
                  : "bg-zinc-950/40 border-zinc-900 opacity-60"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <GripVertical className="w-4 h-4 text-zinc-600 cursor-grab shrink-0" />
                {section.emoji && (
                  <span className="text-lg shrink-0">{section.emoji}</span>
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-white truncate">
                      {section.title}
                    </p>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 capitalize">
                      {section.type}
                    </span>
                  </div>
                  {section.url && (
                    <a
                      href={section.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-zinc-500 hover:text-zinc-400 truncate flex items-center gap-1 mt-0.5"
                    >
                      {section.url}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                {/* Active switch */}
                <button
                  onClick={() => handleToggle(section.id, section.active)}
                  className={`text-xs px-3 py-1 rounded-full font-medium transition-colors ${
                    section.active
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      : "bg-zinc-800 text-zinc-500"
                  }`}
                >
                  {section.active ? "Ativo" : "Oculto"}
                </button>

                {/* Delete button */}
                <button
                  onClick={() => handleDelete(section.id)}
                  className="p-2 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  title="Excluir"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
