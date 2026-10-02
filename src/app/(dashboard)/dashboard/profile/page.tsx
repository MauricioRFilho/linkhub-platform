"use client";

import { useState } from "react";
import { useProfile } from "@/lib/hooks/useProfile";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Check, User, Link as LinkIcon, Sparkles } from "lucide-react";

const SUPPORTED_SOCIALS = [
  { platform: "github", label: "GitHub", placeholder: "https://github.com/..." },
  { platform: "linkedin", label: "LinkedIn", placeholder: "https://linkedin.com/in/..." },
  { platform: "instagram", label: "Instagram", placeholder: "https://instagram.com/..." },
  { platform: "twitter", label: "Twitter / X", placeholder: "https://x.com/..." },
  { platform: "youtube", label: "YouTube", placeholder: "https://youtube.com/@..." },
  { platform: "strava", label: "Strava", placeholder: "https://strava.com/athletes/..." },
  { platform: "website", label: "Website", placeholder: "https://..." },
];

export default function ProfileSettingsPage() {
  const { data, loading, refetch } = useProfile();
  const supabase = createClient();

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [socialMap, setSocialMap] = useState<Record<string, string>>({});
  const [initialized, setInitialized] = useState(false);

  if (data && !initialized) {
    setDisplayName(data.profile.display_name);
    setBio(data.profile.bio || "");
    setAvatarUrl(data.profile.avatar_url || "");

    const map: Record<string, string> = {};
    data.socials.forEach((s) => {
      map[s.platform.toLowerCase()] = s.url;
    });
    setSocialMap(map);
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

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);

    try {
      // 1. Update Profile
      const { error: pErr } = await supabase
        .from("profiles")
        .update({
          display_name: displayName.trim(),
          bio: bio.trim() || null,
          avatar_url: avatarUrl.trim() || null,
        })
        .eq("id", data!.profile.id);

      if (pErr) throw pErr;

      // 2. Update Socials: Delete existing and reinsert active ones
      await supabase.from("socials").delete().eq("profile_id", data!.profile.id);

      const toInsert = Object.entries(socialMap)
        .filter(([_, url]) => url.trim().length > 0)
        .map(([platform, url], index) => ({
          profile_id: data!.profile.id,
          platform,
          url: url.trim(),
          sort_order: index,
        }));

      if (toInsert.length > 0) {
        const { error: sErr } = await supabase.from("socials").insert(toInsert);
        if (sErr) throw sErr;
      }

      setSuccess(true);
      await refetch();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro ao salvar perfil");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-3xl">
      <form onSubmit={handleSave} className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Informações do Perfil</h1>
            <p className="text-zinc-400 text-sm">
              Gerencie seus dados públicos e links de redes sociais.
            </p>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-all disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : success ? (
              <Check className="w-4 h-4 text-emerald-200" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            {success ? "Salvo!" : "Salvar Dados"}
          </button>
        </div>

        {/* Basic Info Card */}
        <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800 space-y-4">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <User className="w-4 h-4 text-emerald-400" />
            Dados Básicos
          </h2>

          <div>
            <label className="block text-xs text-zinc-400 mb-1">Nome de Exibição *</label>
            <input
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-sm focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs text-zinc-400 mb-1">Bio / Descrição</label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Fale um pouco sobre você ou seu projeto..."
              className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-sm focus:outline-none focus:border-emerald-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs text-zinc-400 mb-1">URL da Foto de Perfil (Avatar)</label>
            <input
              type="url"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://exemplo.com/avatar.jpg"
              className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-sm focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Social Networks Card */}
        <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800 space-y-4">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <LinkIcon className="w-4 h-4 text-emerald-400" />
            Redes Sociais
          </h2>
          <p className="text-xs text-zinc-400 mb-4">
            Preencha apenas as redes que deseja exibir na barra de ícones do seu perfil.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {SUPPORTED_SOCIALS.map((soc) => (
              <div key={soc.platform}>
                <label className="block text-xs text-zinc-400 mb-1">{soc.label}</label>
                <input
                  type="url"
                  value={socialMap[soc.platform] || ""}
                  onChange={(e) =>
                    setSocialMap((prev) => ({
                      ...prev,
                      [soc.platform]: e.target.value,
                    }))
                  }
                  placeholder={soc.placeholder}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>
            ))}
          </div>
        </div>
      </form>
    </div>
  );
}
