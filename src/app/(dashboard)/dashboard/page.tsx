"use client";

import { useProfile } from "@/lib/hooks/useProfile";
import { Link2, Eye, Palette, Loader2 } from "lucide-react";

export default function DashboardPage() {
  const { data, loading, error } = useProfile();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-zinc-400 animate-spin" />
      </div>
    );
  }

  if (!data) return error ? <p role="alert" className="text-sm text-red-400">{error}</p> : null;

  const { profile, sections, theme } = data;
  const activeLinks = sections.filter((s) => s.active).length;
  const totalLinks = sections.length;

  const stats = [
    {
      label: "Links ativos",
      value: activeLinks,
      total: totalLinks,
      icon: Link2,
      href: "/dashboard/links",
      colorClass: "bg-emerald-500/10 text-emerald-400",
    },
    {
      label: "Template",
      value: theme.template,
      icon: Palette,
      href: "/dashboard/theme",
      colorClass: "bg-sky-500/10 text-sky-400",
    },
    {
      label: "Perfil",
      value: profile.display_name,
      icon: Eye,
      href: "/@" + profile.username,
      colorClass: "bg-amber-500/10 text-amber-400",
      external: true,
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-1">
        Olá, {profile.display_name.split(" ")[0]} 👋
      </h1>
      <p className="text-zinc-400 text-sm mb-8">
        Gerencie seus links e personalize seu perfil.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <a
              key={stat.label}
              href={stat.href}
              target={stat.external ? "_blank" : undefined}
              rel={stat.external ? "noopener noreferrer" : undefined}
              className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-5 hover:border-zinc-700/50 transition-all group"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${stat.colorClass}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-xs text-zinc-500 uppercase tracking-wider">{stat.label}</span>
              </div>
              <p className="text-xl font-semibold text-white">
                {stat.value}
                {stat.total !== undefined && (
                  <span className="text-zinc-500 text-sm font-normal"> / {stat.total}</span>
                )}
              </p>
            </a>
          );
        })}
      </div>
    </div>
  );
}
