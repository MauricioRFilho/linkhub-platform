"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { validateUsername, normalizeUsername } from "@/lib/utils/username";
import { User, AtSign, Loader2, Check, X } from "lucide-react";

/**
 * Onboarding page — shown after first login.
 * Creates profile, theme, and meta records in Supabase.
 */
export default function RegisterPage() {
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(false);
  const [saving, setSaving] = useState(false);

  const supabase = createClient();
  const router = useRouter();

  // Debounced username availability check
  useEffect(() => {
    const normalized = normalizeUsername(username);
    if (!normalized || normalized.length < 3) {
      setUsernameAvailable(null);
      setUsernameError(null);
      return;
    }

    const validationError = validateUsername(normalized);
    if (validationError) {
      setUsernameError(validationError);
      setUsernameAvailable(false);
      return;
    }

    setUsernameError(null);
    setChecking(true);

    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from("profiles")
        .select("username")
        .eq("username", normalized)
        .single();

      const { data: reserved } = await supabase
        .from("reserved_usernames")
        .select("username")
        .eq("username", normalized)
        .single();

      setUsernameAvailable(!data && !reserved);
      setChecking(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [username, supabase]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!displayName.trim() || !usernameAvailable) return;

    setSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      const normalized = normalizeUsername(username);

      // Create profile, theme, and meta in parallel
      const [profileRes, themeRes, metaRes] = await Promise.all([
        supabase.from("profiles").insert({
          id: user.id,
          username: normalized,
          display_name: displayName.trim(),
          bio: null,
          avatar_url: null,
        }),
        supabase.from("themes").insert({
          profile_id: user.id,
          accent_color: "#10b981",
          style: "dark" as const,
          template: "classic" as const,
        }),
        supabase.from("meta").insert({
          profile_id: user.id,
          title: `${displayName.trim()} | Links`,
          description: `Links de ${displayName.trim()}`,
          lang: "pt-BR",
        }),
      ]);

      if (profileRes.error) throw profileRes.error;
      if (themeRes.error) throw themeRes.error;
      if (metaRes.error) throw metaRes.error;

      router.push("/dashboard");
    } catch (err) {
      setUsernameError(
        err instanceof Error ? err.message : "Erro ao criar perfil"
      );
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Crie seu perfil
          </h1>
          <p className="mt-2 text-zinc-400 text-sm">
            Escolha um nome de usuário único para sua página de links.
          </p>
        </div>

        {/* Card */}
        <div className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Display Name */}
            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-zinc-300 mb-1.5">
                Nome
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  id="displayName"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Seu nome"
                  required
                  maxLength={50}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-zinc-800/50 border border-zinc-700/50 text-white placeholder:text-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                />
              </div>
            </div>

            {/* Username */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-zinc-300 mb-1.5">
                Nome de usuário
              </label>
              <div className="relative">
                <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase())}
                  placeholder="seuusername"
                  required
                  maxLength={30}
                  className="w-full pl-10 pr-10 py-3 rounded-xl bg-zinc-800/50 border border-zinc-700/50 text-white placeholder:text-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                />
                {/* Status indicator */}
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {checking && <Loader2 className="w-4 h-4 text-zinc-400 animate-spin" />}
                  {!checking && usernameAvailable === true && (
                    <Check className="w-4 h-4 text-emerald-400" />
                  )}
                  {!checking && usernameAvailable === false && (
                    <X className="w-4 h-4 text-red-400" />
                  )}
                </div>
              </div>

              {/* Preview URL */}
              {username.length >= 3 && !usernameError && (
                <p className="mt-1.5 text-xs text-zinc-500">
                  Seu link: <span className="text-emerald-400">links.codecadence.com.br/@{normalizeUsername(username)}</span>
                </p>
              )}

              {/* Error */}
              {usernameError && (
                <p className="mt-1.5 text-xs text-red-400">{usernameError}</p>
              )}

              {/* Available */}
              {!checking && usernameAvailable && (
                <p className="mt-1.5 text-xs text-emerald-400">✓ Disponível!</p>
              )}

              {/* Taken */}
              {!checking && usernameAvailable === false && !usernameError && (
                <p className="mt-1.5 text-xs text-red-400">Este nome já está em uso.</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={saving || !displayName.trim() || !usernameAvailable}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-600 text-white font-medium text-sm hover:bg-emerald-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Criar meu perfil"
              )}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
