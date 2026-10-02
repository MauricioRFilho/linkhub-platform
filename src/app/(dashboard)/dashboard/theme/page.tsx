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
  { id: "classic", label: "Classic", desc: "Design equilibrado com cartões elegantes e avatar em destaque." },
  { id: "minimal", label: "Minimal", desc: "Tipografia limpa, linhas finas e foco total no conteúdo." },
  { id: "bold", label: "Bold", desc: "Bordas marcadas, alto contraste e elementos visuais de impacto." },
  { id: "neon", label: "Neon", desc: "Glow pulsante e gradientes futuristas com estética cyberpunk." },
];

export default function ThemeCustomizerPage() {
  const { data, loading, refetch } = useProfile();
  const supabase = createClient();

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [accentColor, setAccentColor] = useState<string>("#10b981");
  const [template, setTemplate] = useState<ThemeTemplate>("classic");
  const [style, setStyle] = useState<ThemeStyle>("dark");
  const [initialized, setInitialized] = useState(false);

  // Sync state once data loads
  if (data && !initialized) {
    setAccentColor(data.theme.accent_color);
    setTemplate(data.theme.template);
    setStyle(data.theme.style);
    setInitialized(true);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-zinc-400 animate-spin" />
      </div>
    );
  }

  if (!data) return null;

  async function handleSave() {
    setSaving(true);
    setSuccess(false);

    try {
      const { error } = await supabase
        .from("themes")
        .update({
          accent_color: accentColor,
          template: template,
          style: style,
        })
        .eq("profile_id", data!.profile.id);

      if (error) throw error;

      setSuccess(true);
      await refetch();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro ao salvar tema");
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
                    template === tmpl.id
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
                    accentColor.toLowerCase() === c.hex.toLowerCase()
                      ? "scale-110 ring-2 ring-white ring-offset-2 ring-offset-zinc-950"
                      : "hover:scale-105"
                  }`}
                  style={{ backgroundColor: c.hex }}
                  title={c.name}
                >
                  {accentColor.toLowerCase() === c.hex.toLowerCase() && (
                    <Check className="w-4 h-4 text-white drop-shadow" />
                  )}
                </button>
              ))}

              <div className="flex items-center gap-2 ml-2 pl-3 border-l border-zinc-800">
                <input
                  type="color"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="w-8 h-8 rounded-lg bg-transparent cursor-pointer border-0"
                />
                <span className="text-xs font-mono text-zinc-400 uppercase">
                  {accentColor}
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
                  style === "dark"
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
                  style === "light"
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
            className={`w-full max-w-[280px] rounded-3xl p-5 border flex flex-col items-center shadow-xl transition-all ${
              style === "dark" ? "bg-zinc-950 border-zinc-800 text-white" : "bg-white border-zinc-200 text-zinc-900"
            }`}
          >
            {/* Avatar mock */}
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center font-bold text-lg mb-3 shadow-md"
              style={{ backgroundColor: `${accentColor}20`, color: accentColor, border: `2px solid ${accentColor}` }}
            >
              {data.profile.display_name.charAt(0)}
            </div>

            <p className="font-semibold text-sm">{data.profile.display_name}</p>
            <p className="text-[11px] text-zinc-400 text-center mt-1 max-w-[200px] line-clamp-2">
              {data.profile.bio || "Seu link na bio em minutos"}
            </p>

            {/* Mock Link Button */}
            <div className="w-full mt-5 space-y-2">
              <div
                className="w-full py-2.5 px-3 rounded-xl text-center text-xs font-medium transition-all shadow-sm"
                style={{
                  backgroundColor: `${accentColor}15`,
                  border: `1px solid ${accentColor}40`,
                  color: accentColor,
                }}
              >
                Meu Portfólio
              </div>
              <div
                className="w-full py-2.5 px-3 rounded-xl text-center text-xs font-medium bg-zinc-800/40 border border-zinc-700/40 text-zinc-400"
              >
                Canal no YouTube
              </div>
            </div>

            <div className="mt-6 text-[9px] text-zinc-500">
              Template: <span className="capitalize">{template}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
