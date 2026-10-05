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
  const [serverUsernameError, setServerUsernameError] = useState<string | null>(null);
  const [availability, setAvailability] = useState<{ username: string; available: boolean } | null>(null);
  const [availabilityError, setAvailabilityError] = useState<{ username: string; message: string } | null>(null);
  const [checkingUsername, setCheckingUsername] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const supabase = createClient();
  const router = useRouter();

  const normalizedUsername = normalizeUsername(username);
  const validationError = normalizedUsername.length >= 3
    ? validateUsername(normalizedUsername)
    : null;
  const usernameAvailable = validationError
    ? false
    : availability?.username === normalizedUsername
      ? availability.available
      : null;
  const checking = checkingUsername === normalizedUsername;
  const usernameError = serverUsernameError || validationError ||
    (availabilityError?.username === normalizedUsername ? availabilityError.message : null);

  // Debounced availability check; the result is keyed to the current value to avoid stale responses.
  useEffect(() => {
    if (normalizedUsername.length < 3 || validationError) return;
    let current = true;

    const timer = setTimeout(async () => {
      setCheckingUsername(normalizedUsername);
      try {
        const { data: existing, error: profileError } = await supabase
        .from("profiles")
        .select("username")
        .eq("username", normalizedUsername)
        .maybeSingle();

        const { data: reserved, error: reservedError } = await supabase
        .from("reserved_usernames")
        .select("username")
        .eq("username", normalizedUsername)
        .maybeSingle();

        if (profileError) throw profileError;
        if (reservedError) throw reservedError;
        if (current) {
          setAvailability({ username: normalizedUsername, available: !existing && !reserved });
          setAvailabilityError(null);
        }
      } catch {
        if (current) setAvailabilityError({ username: normalizedUsername, message: "Não foi possível verificar agora. Tente novamente." });
      } finally {
        if (current) setCheckingUsername((value) => value === normalizedUsername ? null : value);
      }
    }, 450);

    return () => { current = false; clearTimeout(timer); };
  }, [normalizedUsername, supabase, validationError]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!displayName.trim() || !usernameAvailable) return;

    setSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      // The database trigger creates theme and meta in the same transaction.
      const { error } = await supabase.from("profiles").insert({
        id: user.id,
        username: normalizedUsername,
        display_name: displayName.trim(),
        bio: null,
        avatar_url: null,
      });

      if (error) throw error;

      router.push("/dashboard");
    } catch (err) {
      setServerUsernameError(
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
                  onChange={(e) => { setUsername(e.target.value.toLowerCase()); setServerUsernameError(null); }}
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
                  Seu endereço: <span className="text-emerald-400">@{normalizeUsername(username)}</span>
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
