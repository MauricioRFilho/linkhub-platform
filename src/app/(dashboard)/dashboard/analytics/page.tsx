"use client";

import { useAnalytics } from "@/lib/hooks/useAnalytics";
import { useProfile } from "@/lib/hooks/useProfile";
import {
  BarChart3,
  MousePointerClick,
  TicketPercent,
  Calendar,
  Loader2,
  TrendingUp,
  AlertCircle,
} from "lucide-react";

export default function AnalyticsDashboardPage() {
  const { summary, loading: statsLoading, error: statsError } = useAnalytics();
  const { data: profileData, loading: profileLoading } = useProfile();

  const loading = statsLoading || profileLoading;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-zinc-400 animate-spin" />
      </div>
    );
  }

  const sectionsMap = new Map((profileData?.sections ?? []).map((s) => [s.id, s]));

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-emerald-400" />
          Analytics & Conversão
        </h1>
        <p className="text-zinc-400 text-sm">
          Acompanhe cliques, cupons copiados e o desempenho dos seus blocos e recomendações (100% anônimo e em tempo real).
        </p>
      </div>

      {statsError && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {statsError}
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Cliques Totais</span>
            <MousePointerClick className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-3xl font-extrabold text-white">{summary.totalClicks}</p>
          <p className="text-xs text-zinc-500 mt-1">Interações em links e produtos</p>
        </div>

        <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Cupons Copiados</span>
            <TicketPercent className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-3xl font-extrabold text-white">{summary.totalCopies}</p>
          <p className="text-xs text-zinc-500 mt-1">Cópias diretas de cupons</p>
        </div>

        <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Últimos 7 Dias</span>
            <TrendingUp className="w-4 h-4 text-sky-400" />
          </div>
          <p className="text-3xl font-extrabold text-white">{summary.last7dClicks}</p>
          <p className="text-xs text-zinc-500 mt-1">Interações recentes ativas</p>
        </div>
      </div>

      {/* Top Blocks Breakdown */}
      <div className="rounded-2xl bg-zinc-900/50 border border-zinc-800/80 p-6">
        <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-zinc-400" />
          Desempenho por Bloco
        </h2>

        {summary.topSections.length === 0 ? (
          <div className="text-center py-12 text-zinc-500 text-sm">
            Nenhum clique ou cópia registrado ainda. Compartilhe o link do seu perfil para começar a medir!
          </div>
        ) : (
          <div className="divide-y divide-zinc-800/60">
            {summary.topSections.map((item) => {
              const sec = sectionsMap.get(item.sectionId);
              const title = sec?.title ?? "Bloco removido ou arquivado";
              const type = sec?.type ?? "item";
              const stat = summary.statsBySection[item.sectionId];

              return (
                <div key={item.sectionId} className="py-3.5 flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-white truncate">{title}</p>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 capitalize">
                        {type}
                      </span>
                    </div>
                    {sec?.subtitle && (
                      <p className="text-xs text-zinc-500 truncate mt-0.5">{sec.subtitle}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-6 shrink-0 text-right">
                    {stat?.totalCopies > 0 && (
                      <div>
                        <span className="text-xs text-amber-400 font-semibold">{stat.totalCopies}</span>
                        <span className="text-[11px] text-zinc-500 block">cópias</span>
                      </div>
                    )}
                    <div>
                      <span className="text-xs text-zinc-300 font-semibold">{stat?.totalClicks ?? 0}</span>
                      <span className="text-[11px] text-zinc-500 block">cliques</span>
                    </div>
                    <div className="min-w-[48px]">
                      <span className="text-sm text-emerald-400 font-bold">{item.total}</span>
                      <span className="text-[11px] text-zinc-500 block">total</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
