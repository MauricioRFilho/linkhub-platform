"use client";

import { useState } from "react";
import { useProfile } from "@/lib/hooks/useProfile";
import { useLinks } from "@/lib/hooks/useLinks";
import { Plus, Trash2, ExternalLink, Loader2, Check, AlertCircle, Pencil, ArrowUp, ArrowDown } from "lucide-react";
import type { Section, SectionType } from "@/types/database";
import { safeImageSource } from "@/lib/utils/public-url";

interface SectionDraft {
  title: string;
  url: string;
  thumbnailUrl: string;
  subtitle: string;
  type: SectionType;
  emoji: string;
  store: string;
}

const EMPTY_DRAFT: SectionDraft = { title: "", url: "", thumbnailUrl: "", subtitle: "", type: "link", emoji: "", store: "" };

function validatedUrl(raw: string, type: SectionType): string | null {
  const value = raw.trim();
  if (!value && type === "header") return null;
  if (!value) throw new Error("Informe uma URL para links e produtos.");
  let parsed: URL;
  try { parsed = new URL(value); } catch { throw new Error("Informe uma URL válida, incluindo https://."); }
  const allowed = type === "link" ? ["http:", "https:", "mailto:", "tel:"] : ["http:", "https:"];
  if (!allowed.includes(parsed.protocol)) throw new Error("Use um destino http(s) válido para este item.");
  return value;
}

function validatedThumbnailUrl(raw: string): string | null {
  const value = raw.trim();
  if (!value) return null;
  if (!safeImageSource(value)) throw new Error("Use uma imagem com URL http(s) válida.");
  return value;
}

export default function LinksManagerPage() {
  const { data, loading, error: profileError, refetch } = useProfile();
  const { addSection, updateSection, deleteSection, toggleActive, reorderSections, saving, error } = useLinks();
  const [isAdding, setIsAdding] = useState(false);
  const [draft, setDraft] = useState<SectionDraft>(EMPTY_DRAFT);
  const [editing, setEditing] = useState<Section | null>(null);
  const [editDraft, setEditDraft] = useState<SectionDraft>(EMPTY_DRAFT);
  const [formError, setFormError] = useState<string | null>(null);

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 text-zinc-400 animate-spin" /></div>;
  if (!data) return profileError ? <p role="alert" className="text-sm text-red-400">{profileError}</p> : null;
  const sections = data.sections;

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    try {
      const url = validatedUrl(draft.url, draft.type);
      const added = await addSection({
        title: draft.title.trim(), url, subtitle: draft.subtitle.trim() || null,
        type: draft.type, emoji: draft.emoji.trim() || null,
        thumbnail_url: validatedThumbnailUrl(draft.thumbnailUrl),
        store: draft.type === "product" ? draft.store || "Destaque" : null,
        sort_order: sections.length, active: true,
      });
      if (!added) return;
      setDraft(EMPTY_DRAFT);
      setIsAdding(false);
      await refetch();
    } catch (err) { setFormError(err instanceof Error ? err.message : "Não foi possível adicionar o item."); }
  }

  function beginEdit(section: Section) {
    setFormError(null);
    setEditing(section);
    setEditDraft({
      title: section.title,
      url: section.url ?? "",
      thumbnailUrl: section.thumbnail_url ?? "",
      subtitle: section.subtitle ?? "",
      type: section.type,
      emoji: section.emoji ?? "",
      store: section.store ?? "",
    });
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setFormError(null);
    try {
      const updated = await updateSection(editing.id, {
        title: editDraft.title.trim(),
        url: validatedUrl(editDraft.url, editDraft.type),
        thumbnail_url: validatedThumbnailUrl(editDraft.thumbnailUrl),
        subtitle: editDraft.subtitle.trim() || null,
        type: editDraft.type,
        emoji: editDraft.emoji.trim() || null,
        store: editDraft.type === "product" ? editDraft.store || "Destaque" : null,
      });
      if (!updated) return;
      setEditing(null);
      await refetch();
    } catch (err) { setFormError(err instanceof Error ? err.message : "Não foi possível atualizar o item."); }
  }

  async function handleToggle(id: string, current: boolean) {
    if (await toggleActive(id, !current)) await refetch();
  }

  async function handleDelete(id: string) {
    if (!confirm("Tem certeza que deseja excluir este item?")) return;
    if (await deleteSection(id)) await refetch();
  }

  async function moveSection(index: number, direction: -1 | 1) {
    const destination = index + direction;
    if (destination < 0 || destination >= sections.length) return;
    const reordered = [...sections];
    [reordered[index], reordered[destination]] = [reordered[destination], reordered[index]];
    if (await reorderSections(reordered.map((section) => section.id))) await refetch();
  }

  function renderEditor(values: SectionDraft, setValues: (next: SectionDraft) => void, onSubmit: (e: React.FormEvent) => Promise<void>, heading: string, onCancel: () => void) {
    return (
      <form onSubmit={onSubmit} className="mb-6 p-5 rounded-2xl bg-zinc-900 border border-emerald-500/30 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">{heading}</h2>
          <button type="button" onClick={onCancel} className="text-xs text-zinc-400 hover:text-white">Cancelar</button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="block text-xs text-zinc-400">Título *
            <input type="text" required maxLength={120} value={values.title} onChange={(e) => setValues({ ...values, title: e.target.value })} className="mt-1 w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-sm focus:outline-none focus:border-emerald-500" />
          </label>
          <label className="block text-xs text-zinc-400">URL {values.type !== "header" && "*"}
            <input type="url" required={values.type !== "header"} value={values.url} onChange={(e) => setValues({ ...values, url: e.target.value })} placeholder="https://..." className="mt-1 w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-sm focus:outline-none focus:border-emerald-500" />
          </label>
          <label className="block text-xs text-zinc-400">Subtítulo
            <input type="text" maxLength={160} value={values.subtitle} onChange={(e) => setValues({ ...values, subtitle: e.target.value })} className="mt-1 w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-sm focus:outline-none focus:border-emerald-500" />
          </label>
          <label className="block text-xs text-zinc-400">Imagem de capa (URL opcional)
            <input type="url" value={values.thumbnailUrl} onChange={(e) => setValues({ ...values, thumbnailUrl: e.target.value })} placeholder="https://..." className="mt-1 w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-sm focus:outline-none focus:border-emerald-500" />
          </label>
          <div className="grid grid-cols-[90px_1fr] gap-3">
            <label className="block text-xs text-zinc-400">Emoji
              <input type="text" maxLength={4} value={values.emoji} onChange={(e) => setValues({ ...values, emoji: e.target.value })} placeholder="🚀" className="mt-1 w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-sm text-center focus:outline-none focus:border-emerald-500" />
            </label>
            <label className="block text-xs text-zinc-400">Tipo
              <select value={values.type} onChange={(e) => setValues({ ...values, type: e.target.value as SectionType })} className="mt-1 w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-sm focus:outline-none focus:border-emerald-500">
                <option value="link">Link</option><option value="product">Produto / destaque</option><option value="header">Cabeçalho / seção</option>
              </select>
            </label>
          </div>
          {values.type === "product" && (
            <label className="block text-xs text-zinc-400">Loja
              <select value={values.store} onChange={(e) => setValues({ ...values, store: e.target.value })} className="mt-1 w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-sm focus:outline-none focus:border-emerald-500">
                <option value="">Destaque</option><option value="amazon">Amazon</option><option value="shopee">Shopee</option><option value="mercadolivre">Mercado Livre</option>
              </select>
            </label>
          )}
        </div>
        {(formError || error) && <p role="alert" className="text-sm text-red-400">{formError || error}</p>}
        <div className="flex justify-end">
          <button type="submit" disabled={saving || !values.title.trim()} className="flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold disabled:opacity-50">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
            Salvar item
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between gap-4 mb-8">
        <div><h1 className="text-2xl font-bold text-white mb-1">Meus Links & Seções</h1><p className="text-zinc-400 text-sm">Edite, ordene e escolha o que aparece no seu perfil.</p></div>
        <button type="button" onClick={() => { setEditing(null); setIsAdding(true); }} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-colors"><Plus className="w-4 h-4" />Novo item</button>
      </div>

      {isAdding && renderEditor(draft, setDraft, handleAdd, "Adicionar item", () => { setIsAdding(false); setFormError(null); })}
      {editing && renderEditor(editDraft, setEditDraft, handleUpdate, "Editar item", () => { setEditing(null); setFormError(null); })}
      {error && !formError && <p role="alert" className="mb-4 text-sm text-red-400">{error}</p>}

      <div className="space-y-3">
        {sections.length === 0 ? (
          <div className="text-center py-16 bg-zinc-900/30 border border-dashed border-zinc-800 rounded-2xl"><p className="text-zinc-500 text-sm mb-3">Nenhum item cadastrado ainda.</p><button type="button" onClick={() => setIsAdding(true)} className="text-xs px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 hover:text-white">Criar meu primeiro link</button></div>
        ) : sections.map((section, index) => (
          <div key={section.id} className={`flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl border transition-all ${section.active ? "bg-zinc-900/60 border-zinc-800/80 hover:border-zinc-700" : "bg-zinc-950/40 border-zinc-900 opacity-60"}`}>
            <div className="flex items-center gap-3 min-w-0 flex-1">
              {section.emoji && <span className="text-lg shrink-0">{section.emoji}</span>}
              <div className="min-w-0"><div className="flex items-center gap-2"><p className="text-sm font-medium text-white truncate">{section.title}</p><span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 capitalize">{section.type}</span></div>
                {section.url && <a href={section.url} target="_blank" rel="noopener noreferrer" className="text-xs text-zinc-500 hover:text-zinc-300 truncate flex items-center gap-1 mt-0.5">{section.url}<ExternalLink className="w-3 h-3 shrink-0" /></a>}
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button type="button" onClick={() => moveSection(index, -1)} disabled={saving || index === 0} aria-label={`Mover ${section.title} para cima`} className="p-2 rounded-lg text-zinc-500 hover:text-white disabled:opacity-30"><ArrowUp className="w-4 h-4" /></button>
              <button type="button" onClick={() => moveSection(index, 1)} disabled={saving || index === sections.length - 1} aria-label={`Mover ${section.title} para baixo`} className="p-2 rounded-lg text-zinc-500 hover:text-white disabled:opacity-30"><ArrowDown className="w-4 h-4" /></button>
              <button type="button" onClick={() => beginEdit(section)} aria-label={`Editar ${section.title}`} className="p-2 rounded-lg text-zinc-500 hover:text-sky-400 hover:bg-sky-500/10"><Pencil className="w-4 h-4" /></button>
              <button type="button" onClick={() => handleToggle(section.id, section.active)} disabled={saving} className={`text-xs px-3 py-1 rounded-full font-medium transition-colors ${section.active ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-zinc-800 text-zinc-500"}`}>{section.active ? "Ativo" : "Oculto"}</button>
              <button type="button" onClick={() => handleDelete(section.id)} disabled={saving} aria-label={`Excluir ${section.title}`} className="p-2 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
      </div>
      {sections.length > 0 && <p className="mt-4 flex items-center gap-2 text-xs text-zinc-500"><AlertCircle className="w-3.5 h-3.5" />Itens ocultos continuam salvos e podem ser reativados quando quiser.</p>}
    </div>
  );
}
