"use client";

import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Link2,
  User,
  Palette,
  LayoutDashboard,
  LogOut,
  ExternalLink,
  BarChart3,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Visão Geral", icon: LayoutDashboard },
  { href: "/dashboard/links", label: "Conteúdo", icon: Link2 },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/dashboard/profile", label: "Perfil", icon: User },
  { href: "/dashboard/theme", label: "Tema", icon: Palette },
] as const;

interface DashboardLayoutProps {
  children: React.ReactNode;
  username?: string;
}

/**
 * Dashboard layout with sidebar navigation.
 * Sidebar collapses to bottom nav on mobile.
 */
export default function DashboardLayout({
  children,
  username,
}: DashboardLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 border-r border-zinc-800/50 flex-col bg-zinc-950">
        {/* Logo */}
        <div className="p-6 border-b border-zinc-800/50">
          <h1 className="text-xl font-bold text-white tracking-tight">
            Link<span className="text-emerald-400">Hub</span>
          </h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const isActive =
              href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(href);

            return (
              <a
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? "bg-emerald-500/10 text-emerald-400"
                    : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </a>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800/50 space-y-1">
          {username && (
            <a
              href={`/@${username}`}
              target="_blank"
              rel="noopener"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-zinc-400 hover:text-white hover:bg-zinc-800/50 transition-all"
            >
              <ExternalLink className="w-4 h-4" />
              Ver meu perfil
            </a>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-all w-full"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto p-6 md:p-8">{children}</div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-zinc-950/95 backdrop-blur-xl border-t border-zinc-800/50 z-50">
        <div className="flex items-center justify-around py-2 px-4">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const isActive =
              href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(href);

            return (
              <a
                key={href}
                href={href}
                className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-xs transition-all ${
                  isActive
                    ? "text-emerald-400"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{label}</span>
              </a>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
