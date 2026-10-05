"use client";

import { useState } from "react";
import { useProfile } from "@/lib/hooks/useProfile";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Check, User, Link as LinkIcon, Sparkles, Upload } from "lucide-react";
import { normalizeUsername, validateUsername } from "@/lib/utils/username";

const SUPPORTED_SOCIALS = [
  { platform: "github", label: "GitHub", placeholder: "https://github.com/..." },
  { platform: "linkedin", label: "LinkedIn", placeholder: "https://linkedin.com/in/..." },
  { platform: "instagram", label: "Instagram", placeholder: "https://instagram.com/..." },
  { platform: "twitter", label: "Twitter / X", placeholder: "https://x.com/..." },
  { platform: "youtube", label: "YouTube", placeholder: "https://youtube.com/@..." },
  { platform: "strava", label: "Strava", placeholder: "https://strava.com/athletes/..." },
  { platform: "website", label: "Website", placeholder: "https://..." },
];

const AVATAR_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};
const MAX_AVATAR_SIZE = 2 * 1024 * 1024;

export default function ProfileSettingsPage() {
  const { data, loading, error: profileError, refetch } = useProfile();
  const supabase = createClient();

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [usernameDraft, setUsernameDraft] = useState<string | null>(null);
  const [displayNameDraft, setDisplayNameDraft] = useState<string | null>(null);
  const [bioDraft, setBioDraft] = useState<string | null>(null);
  const [avatarUrlDraft, setAvatarUrlDraft] = useState<string | null>(null);
  const [socialDraft, setSocialDraft] = useState<Record<string, string> | null>(null);
  const [metaTitleDraft, setMetaTitleDraft] = useState<string | null>(null);
  const [metaDescriptionDraft, setMetaDescriptionDraft] = useState<string | null>(null);
  const [ogImageDraft, setOgImageDraft] = useState<string | null>(null);
  const [languageDraft, setLanguageDraft] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 text-zinc-400 animate-spin" /></div>;
  }
  if (!data) return profileError ? <p role="alert" className="text-sm text-red-400">{profileError}</p> : null;

  const displayName = displayNameDraft ?? data.profile.display_name;
  const username = usernameDraft ?? data.profile.username;
  const currentUsername = data.profile.username;
  const bio = bioDraft ?? data.profile.bio ?? "";
  const avatarUrl = avatarUrlDraft ?? data.profile.avatar_url ?? "";
  const persistedSocials = Object.fromEntries(data.socials.map((social) => [social.platform.toLowerCase(), social.url]));
  const socialMap = socialDraft ?? persistedSocials;
  const metaTitle = metaTitleDraft ?? data.meta.title ?? "";
  const metaDescription = metaDescriptionDraft ?? data.meta.description ?? "";
  const ogImageUrl = ogImageDraft ?? data.meta.og_image_url ?? "";
  const language = languageDraft ?? data.meta.lang;

  function handleAvatarFile(file: File | undefined) {
    setSaveError(null);
    if (!file) {
      setAvatarFile(null);
      return;
    }
    if (!AVATAR_TYPES[file.type]) {
      setSaveError("Use uma imagem JPEG, PNG, WebP ou GIF.");
      return;
    }
    if (file.size > MAX_AVATAR_SIZE) {
      setSaveError("A imagem deve ter no máximo 2 MB.");
      return;
    }
    setAvatarFile(file);
    setAvatarUrlDraft(null);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!displayName.trim()) {
      setSaveError("Informe um nome de exibição.");
      return;
    }
    const normalizedUsername = normalizeUsername(username);
    const usernameError = validateUsername(normalizedUsername);
    if (usernameError) {
      setSaveError(usernameError);
      return;
    }

    setSaving(true);
    setSuccess(false);
    setSaveError(null);
    let uploadedPath: string | null = null;
    let profileSaved = false;

    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData.user) throw new Error("Sua sessão expirou. Entre novamente.");

      if (normalizedUsername !== currentUsername) {
        const [{ data: existing, error: lookupError }, { data: reserved, error: reservedError }] = await Promise.all([
          supabase.from("profiles").select("id").eq("username", normalizedUsername).maybeSingle(),
          supabase.from("reserved_usernames").select("username").eq("username", normalizedUsername).maybeSingle(),
        ]);
        if (lookupError) throw lookupError;
        if (reservedError) throw reservedError;
        if (existing) throw new Error("Este nome de usuário já está em uso.");
        if (reserved) throw new Error("Este nome de usuário está reservado.");
      }

      let nextAvatarUrl = avatarUrl.trim() || null;
      if (avatarFile) {
        const extension = AVATAR_TYPES[avatarFile.type];
        uploadedPath = `${authData.user.id}/${crypto.randomUUID()}.${extension}`;
        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(uploadedPath, avatarFile, { contentType: avatarFile.type, upsert: false });
        if (uploadError) throw uploadError;
        nextAvatarUrl = supabase.storage.from("avatars").getPublicUrl(uploadedPath).data.publicUrl;
      }

      const { error: profileError } = await supabase
        .from("profiles")
        .update({ username: normalizedUsername, display_name: displayName.trim(), bio: bio.trim() || null, avatar_url: nextAvatarUrl })
        .eq("id", authData.user.id);
      if (profileError) throw profileError;
      profileSaved = true;

      const rows = Object.entries(socialMap)
        .filter(([, url]) => url.trim().length > 0)
        .map(([platform, url], index) => ({ profile_id: authData.user.id, platform, url: url.trim(), sort_order: index }));
      if (rows.length > 0) {
        const { error: upsertError } = await supabase
          .from("socials")
          .upsert(rows, { onConflict: "profile_id,platform" });
        if (upsertError) throw upsertError;
      }

      const activePlatforms = new Set(rows.map((row) => row.platform));
      const removals = await Promise.all(
        SUPPORTED_SOCIALS.filter(({ platform }) => !activePlatforms.has(platform)).map(({ platform }) =>
          supabase.from("socials").delete().eq("profile_id", authData.user.id).eq("platform", platform)
        )
      );
      const removalError = removals.find((result) => result.error)?.error;
      if (removalError) throw removalError;

      const { error: metaError } = await supabase.from("meta").update({
        title: metaTitle.trim() || null,
        description: metaDescription.trim() || null,
        og_image_url: ogImageUrl.trim() || null,
        lang: language,
      }).eq("profile_id", authData.user.id);
      if (metaError) throw metaError;

      const oldAvatarUrl = data?.profile.avatar_url ?? null;
      if ((uploadedPath || nextAvatarUrl !== oldAvatarUrl) && oldAvatarUrl) {
        try {
          const oldUrl = new URL(oldAvatarUrl);
          const supabaseOrigin = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).origin;
          const storagePrefix = `/storage/v1/object/public/avatars/${authData.user.id}/`;
          const decodedPath = decodeURIComponent(oldUrl.pathname);
          const oldPath = oldUrl.origin === supabaseOrigin && decodedPath.startsWith(storagePrefix)
            ? decodedPath.slice(storagePrefix.length)
            : null;
          if (oldPath) await supabase.storage.from("avatars").remove([`${authData.user.id}/${oldPath}`]);
        } catch {
          // A malformed or externally hosted previous URL does not block saving the profile.
        }
      }

      setDisplayNameDraft(displayName.trim());
      setUsernameDraft(normalizedUsername);
      setBioDraft(bio);
      setAvatarUrlDraft(nextAvatarUrl ?? "");
      setSocialDraft(socialMap);
      setMetaTitleDraft(metaTitle);
      setMetaDescriptionDraft(metaDescription);
      setOgImageDraft(ogImageUrl);
      setLanguageDraft(language);
      setAvatarFile(null);
      setSuccess(true);
      await refetch();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      if (uploadedPath && !profileSaved) await supabase.storage.from("avatars").remove([uploadedPath]);
      setSaveError(err instanceof Error ? err.message : "Erro ao salvar perfil.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-3xl">
      <form onSubmit={handleSave} className="space-y-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Informações do Perfil</h1>
            <p className="text-zinc-400 text-sm">Gerencie seus dados públicos e links de redes sociais.</p>
          </div>
          <button type="submit" disabled={saving} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-all disabled:opacity-50">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : success ? <Check className="w-4 h-4 text-emerald-200" /> : <Sparkles className="w-4 h-4" />}
            {success ? "Salvo!" : "Salvar Dados"}
          </button>
        </div>

        <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800 space-y-4">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2"><User className="w-4 h-4 text-emerald-400" />Dados Básicos</h2>
          <div>
            <label htmlFor="username" className="block text-xs text-zinc-400 mb-1">Nome de usuário *</label>
            <div className="flex items-center gap-2 rounded-xl bg-zinc-950 border border-zinc-800 px-3 focus-within:border-emerald-500">
              <span className="text-zinc-500 text-sm">@</span>
              <input id="username" type="text" required maxLength={30} value={username} onChange={(e) => setUsernameDraft(e.target.value.toLowerCase())} className="w-full py-2 bg-transparent text-white text-sm focus:outline-none" />
            </div>
            <p className="mt-1 text-xs text-zinc-500">Seu perfil será acessado em /@{normalizeUsername(username)}.</p>
          </div>
          <div>
            <label htmlFor="display-name" className="block text-xs text-zinc-400 mb-1">Nome de exibição *</label>
            <input id="display-name" type="text" required maxLength={80} value={displayName} onChange={(e) => setDisplayNameDraft(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-sm focus:outline-none focus:border-emerald-500" />
          </div>
          <div>
            <label htmlFor="bio" className="block text-xs text-zinc-400 mb-1">Bio / descrição</label>
            <textarea id="bio" rows={3} maxLength={280} value={bio} onChange={(e) => setBioDraft(e.target.value)} placeholder="Fale um pouco sobre você ou seu projeto..." className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-sm focus:outline-none focus:border-emerald-500 resize-none" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="avatar-url" className="block text-xs text-zinc-400 mb-1">URL da foto (opcional)</label>
              <input id="avatar-url" type="url" value={avatarUrl} onChange={(e) => { setAvatarUrlDraft(e.target.value); setAvatarFile(null); }} placeholder="https://exemplo.com/avatar.jpg" className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-sm focus:outline-none focus:border-emerald-500" />
            </div>
            <div>
              <label htmlFor="avatar-file" className="block text-xs text-zinc-400 mb-1">Enviar foto (JPEG, PNG, WebP ou GIF; até 2 MB)</label>
              <label className="flex min-h-10 items-center gap-2 px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-300 text-sm cursor-pointer hover:border-emerald-500">
                <Upload className="w-4 h-4 text-emerald-400" />
                <span className="truncate">{avatarFile?.name ?? "Escolher imagem"}</span>
                <input id="avatar-file" type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="sr-only" onChange={(e) => handleAvatarFile(e.target.files?.[0])} />
              </label>
            </div>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800 space-y-4">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2"><LinkIcon className="w-4 h-4 text-emerald-400" />Redes Sociais</h2>
          <p className="text-xs text-zinc-400">Preencha apenas as redes que deseja exibir na página pública.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {SUPPORTED_SOCIALS.map((social) => (
              <div key={social.platform}>
                <label htmlFor={`social-${social.platform}`} className="block text-xs text-zinc-400 mb-1">{social.label}</label>
                <input id={`social-${social.platform}`} type="url" value={socialMap[social.platform] || ""} onChange={(e) => setSocialDraft((previous) => ({ ...(previous ?? persistedSocials), [social.platform]: e.target.value }))} placeholder={social.placeholder} className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-sm focus:outline-none focus:border-emerald-500" />
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800 space-y-4">
          <h2 className="text-sm font-semibold text-white">Prévia para buscadores e compartilhamento</h2>
          <p className="text-xs text-zinc-400">Defina o título e a descrição que acompanham sua página nos resultados e nas prévias de compartilhamento.</p>
          <div>
            <label htmlFor="meta-title" className="block text-xs text-zinc-400 mb-1">Título da página</label>
            <input id="meta-title" type="text" maxLength={120} value={metaTitle} onChange={(e) => setMetaTitleDraft(e.target.value)} placeholder={`${displayName} | Links`} className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-sm focus:outline-none focus:border-emerald-500" />
          </div>
          <div>
            <label htmlFor="meta-description" className="block text-xs text-zinc-400 mb-1">Descrição</label>
            <textarea id="meta-description" rows={2} maxLength={300} value={metaDescription} onChange={(e) => setMetaDescriptionDraft(e.target.value)} placeholder={`Links de ${displayName}`} className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-sm focus:outline-none focus:border-emerald-500 resize-none" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="og-image" className="block text-xs text-zinc-400 mb-1">Imagem de compartilhamento (URL opcional)</label>
              <input id="og-image" type="url" value={ogImageUrl} onChange={(e) => setOgImageDraft(e.target.value)} placeholder="https://..." className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-sm focus:outline-none focus:border-emerald-500" />
            </div>
            <div>
              <label htmlFor="language" className="block text-xs text-zinc-400 mb-1">Idioma da página</label>
              <select id="language" value={language} onChange={(e) => setLanguageDraft(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-sm focus:outline-none focus:border-emerald-500">
                <option value="pt-BR">Português</option><option value="en">English</option><option value="es">Español</option>
              </select>
            </div>
          </div>
        </div>
        {saveError && <p role="alert" className="text-sm text-red-400">{saveError}</p>}
      </form>
    </div>
  );
}
