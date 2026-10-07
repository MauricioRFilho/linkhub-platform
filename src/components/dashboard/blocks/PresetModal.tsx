"use client";

import { getPresets, type Preset } from "@/lib/blocks/presets";
import { Sparkles, X, Check, ArrowRight } from "lucide-react";

interface PresetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (preset: Preset) => Promise<void>;
  applying: boolean;
}

export default function PresetModal({
  isOpen,
  onClose,
  onSelect,
  applying,
}: PresetModalProps) {
  if (!isOpen) return null;

  const presets = getPresets();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Sparkles className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-white">Modelos Prontos por Nicho</h2>
              <p className="text-xs text-zinc-400">
                Gere painéis e blocos com 1 clique para preencher com seus links.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={applying}
            className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3.5 my-6 max-h-[60vh] overflow-y-auto pr-1">
          {presets.map((preset) => (
            <div
              key={preset.id}
              className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800/80 hover:border-emerald-500/50 hover:bg-zinc-950 transition-all flex flex-col justify-between gap-3 group"
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold text-white text-sm group-hover:text-emerald-400 transition-colors">
                    {preset.label}
                  </h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300">
                    {preset.children.length + 1} blocos
                  </span>
                </div>
                <p className="text-xs text-zinc-400">{preset.description}</p>
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">
                    Painel: {preset.panel.layout}
                  </span>
                  {preset.children.map((c, i) => (
                    <span
                      key={i}
                      className="text-[10px] px-2 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800"
                    >
                      {c.type}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-zinc-900 flex justify-end">
                <button
                  type="button"
                  disabled={applying}
                  onClick={() => onSelect(preset)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  <Check className="w-3.5 h-3.5" />
                  Aplicar Modelo
                  <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end pt-2 border-t border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-white"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
