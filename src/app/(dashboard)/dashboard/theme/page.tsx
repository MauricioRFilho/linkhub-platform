"use client";

import { useState } from "react";
import { useProfile } from "@/lib/hooks/useProfile";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Check, Sparkles, Sun, Moon } from "lucide-react";
import type { ThemeTemplate, ThemeStyle } from "@/types/database";

const PALETTE = [
  { name: "Emerald", hex: "#10b981" },
  { name: "Cyan", hex: "#06b6d4" },
  { name: "Violet", hex: "#8b5cf6" },
  { name: "Rose", hex: "#f43f5e" },
  { name: "Amber", hex: "#f59e0b" },
  { name: "Sky", hex: "#0ea5e9" },
  { name: "Indigo", hex: "#6366f1" },
];

const TEMPLATES: { id: ThemeTemplate; label: string; desc: string }[] = [
  { id: "classic", label: "Classic", desc: "Cartões equilibrados e identidade visual versátil." },
  { id: "minimal", label: "Minimal", desc: "Linhas discretas e foco no conteúdo." },
  { id: "bold", label: "Bold", desc: "Bordas fortes e títulos de alto contraste." },
  { id: "neon", label: "Neon", desc: "Destaques luminosos e visual contemporâneo." },
  { id: "editorial", label: "Editorial", desc: "Tipografia serifada e apresentação de portfólio." },
];

export default function ThemeCustomizerPage() {
  const { data, loading, error, refetch } = useProfile();
  const supabase = createClient();

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [accentColor, setAccentColor] = useState<string | null>(null);
  const [template, setTemplate] = useState<ThemeTemplate | null>(null);
  const [style, setStyle] = useState<ThemeStyle | null>(null);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-zinc-400 animate-spin" />
      </div>
    );
  }

  if (!data) return error ? <p role="alert" className="text-sm text-red-400">{error}</p> : null;

  const selectedAccent = accentColor ?? data.theme.accent_color;
  const selectedTemplate = template ?? data.theme.template;
  const selectedStyle = style ?? data.theme.style;

  async function handleSave() {
    setSaving(true);
    setSuccess(false);
    setSaveError(null);

    try {
      const { error } = await supabase
        .from("themes")
        .update({
          accent_color: selectedAccent,
          template: selectedTemplate,
          style: selectedStyle,
        })
        .eq("profile_id", data!.profile.id);

      if (error) throw error;

      setSuccess(true);
      await refetch();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Erro ao salvar tema");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Aparência & Tema</h1>
          <p className="text-zinc-400 text-sm">
            Personalize as cores, modo visual e estilo dos seus links.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-all disabled:opacity-50 shadow-sm"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : success ? (
            <Check className="w-4 h-4 text-emerald-200" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          {success ? "Salvo!" : "Salvar Alterações"}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Controls Column */}
        <div className="md:col-span-2 space-y-8">
          {/* Template Choice */}
          <div>
            <h2 className="text-sm font-semibold text-white mb-3">Estilo de Template</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {TEMPLATES.map((tmpl) => (
                <button
                  key={tmpl.id}
                  type="button"
                  onClick={() => setTemplate(tmpl.id)}
                  className={`p-4 rounded-xl text-left border transition-all ${
                    selectedTemplate === tmpl.id
                      ? "bg-zinc-900 border-emerald-500 ring-1 ring-emerald-500/50"
                      : "bg-zinc-950/60 border-zinc-800 hover:border-zinc-700"
                  }`}
                >
                  <p className="text-sm font-medium text-white">{tmpl.label}</p>
                  <p className="text-xs text-zinc-400 mt-1">{tmpl.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Accent Color Palette */}
          <div>
            <h2 className="text-sm font-semibold text-white mb-3">Cor de Destaque (Accent)</h2>
            <div className="flex flex-wrap items-center gap-3">
              {PALETTE.map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  onClick={() => setAccentColor(c.hex)}
                  className={`w-9 h-9 rounded-full transition-transform flex items-center justify-center ${
                    selectedAccent.toLowerCase() === c.hex.toLowerCase()
                      ? "scale-110 ring-2 ring-white ring-offset-2 ring-offset-zinc-950"
                      : "hover:scale-105"
                  }`}
                  style={{ backgroundColor: c.hex }}
                  title={c.name}
                >
                  {selectedAccent.toLowerCase() === c.hex.toLowerCase() && (
                    <Check className="w-4 h-4 text-white drop-shadow" />
                  )}
                </button>
              ))}

              <div className="flex items-center gap-2 ml-2 pl-3 border-l border-zinc-800">
                <input
                  type="color"
                  value={selectedAccent}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="w-8 h-8 rounded-lg bg-transparent cursor-pointer border-0"
                />
                <span className="text-xs font-mono text-zinc-400 uppercase">
                  {selectedAccent}
                </span>
              </div>
            </div>
          </div>

          {/* Style Mode */}
          <div>
            <h2 className="text-sm font-semibold text-white mb-3">Modo Visual</h2>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setStyle("dark")}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                  selectedStyle === "dark"
                    ? "bg-zinc-900 border-emerald-500 text-white"
                    : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white"
                }`}
              >
                <Moon className="w-4 h-4" />
                Escuro (Dark)
              </button>
              <button
                type="button"
                onClick={() => setStyle("light")}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                  selectedStyle === "light"
                    ? "bg-zinc-900 border-emerald-500 text-white"
                    : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white"
                }`}
              >
                <Sun className="w-4 h-4" />
                Claro (Light)
              </button>
            </div>
          </div>
        </div>

        {/* Live Preview Column */}
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6 flex flex-col items-center">
          <p className="text-xs text-zinc-500 font-medium mb-6 uppercase tracking-wider">
            Pré-visualização
          </p>

          <div
            data-public-profile=""
            data-style={selectedStyle}
            data-template={selectedTemplate}
            className="theme-preview public-profile w-full max-w-[280px] rounded-3xl p-5 border flex flex-col items-center shadow-xl transition-all"
            style={{ "--accent": selectedAccent } as React.CSSProperties}
          >
            {/* Avatar mock */}
            <div
              className="public-profile-avatar w-16 h-16 rounded-full flex items-center justify-center font-bold text-lg mb-3 shadow-md"
              style={{ backgroundColor: `${selectedAccent}20`, color: selectedAccent, border: `2px solid ${selectedAccent}` }}
            >
              {data.profile.display_name.charAt(0)}
            </div>

            <p className="public-profile-title font-semibold text-sm">{data.profile.display_name}</p>
            <p className="text-[11px] text-zinc-400 text-center mt-1 max-w-[200px] line-clamp-2">
              {data.profile.bio || "Seu link na bio em minutos"}
            </p>

            {/* Mock Link Button */}
            <div className="w-full mt-5 space-y-2">
              <div
                className="public-profile-link-card w-full py-2.5 px-3 rounded-xl text-center text-xs font-medium transition-all shadow-sm"
                style={{
                  backgroundColor: `${selectedAccent}15`,
                  border: `1px solid ${selectedAccent}40`,
                  color: selectedAccent,
                }}
              >
                Meu Portfólio
              </div>
              <div
                className="theme-preview-secondary-link public-profile-link-card w-full py-2.5 px-3 rounded-xl text-center text-xs font-medium"
              >
                Canal no YouTube
              </div>
            </div>

            <div className="mt-6 text-[9px] text-zinc-500">
              Template: <span className="capitalize">{selectedTemplate}</span>
            </div>
          </div>
        </div>
      </div>
      {saveError && <p role="alert" className="mt-4 text-sm text-red-400">{saveError}</p>}
    </div>
  );
}
