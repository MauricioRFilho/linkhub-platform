import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import ProfilePage from "./ProfilePage";
import { buildTree } from "@/lib/blocks/tree";
import { scheduleStatus } from "@/lib/blocks/schedule";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ username: string }>;
}

/**
 * Fetches all profile data for a given username.
 * Returns null if the username doesn't exist.
 */
async function getProfileData(username: string) {
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username)
    .single();

  if (!profile) return null;

  const [socialsRes, themeRes, sectionsRes, metaRes, domainRes] = await Promise.all([
    supabase
      .from("socials")
      .select("*")
      .eq("profile_id", profile.id)
      .order("sort_order"),
    supabase
      .from("themes")
      .select("*")
      .eq("profile_id", profile.id)
      .single(),
    supabase
      .from("sections")
      .select("*")
      .eq("profile_id", profile.id)
      .eq("active", true)
      .order("sort_order"),
    supabase
      .from("meta")
      .select("*")
      .eq("profile_id", profile.id)
      .single(),
    supabase.rpc("profile_custom_domain", { p_profile: profile.id }),
  ]);

  // RLS already hides unpublished blocks; filtering again keeps the page
  // correct even if this query ever runs with elevated credentials.
  const published = (sectionsRes.data ?? []).filter((s) => scheduleStatus(s) === "live");

  return {
    profile,
    socials: socialsRes.data ?? [],
    theme: themeRes.data!,
    sections: buildTree(published),
    meta: metaRes.data!,
    customDomain: (domainRes.data as string | null) ?? null,
  };
}

/** Dynamic SEO metadata per profile */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const data = await getProfileData(username);
  if (!data) return { title: "Perfil não encontrado" };

  const { profile, meta, customDomain } = data;
  const rawAppUrl = process.env.NEXT_PUBLIC_APP_URL || "https://links.cadencecode.com.br";
  const platformOrigin = rawAppUrl.startsWith("http") ? rawAppUrl : `https://${rawAppUrl}`;

  const canonicalUrl = customDomain
    ? `https://${customDomain}`
    : `${platformOrigin}/@${profile.username}`;

  return {
    metadataBase: new URL(customDomain ? `https://${customDomain}` : platformOrigin),
    title: meta.title ?? `${profile.display_name} | Links`,
    description: meta.description ?? `Links de ${profile.display_name}`,
    alternates: { canonical: canonicalUrl },
    authors: [{ name: profile.display_name }],
    openGraph: {
      type: "profile",
      locale: meta.lang?.replace("-", "_") ?? "pt_BR",
      title: meta.title ?? profile.display_name,
      description: meta.description ?? `Links de ${profile.display_name}`,
      siteName: "LinkHub",
      images: meta.og_image_url
        ? [{ url: meta.og_image_url, width: 1200, height: 630 }]
        : profile.avatar_url
        ? [{ url: profile.avatar_url, width: 400, height: 400 }]
        : [],
    },
    twitter: {
      card: "summary_large_image",
      title: meta.title ?? profile.display_name,
      description: meta.description ?? `Links de ${profile.display_name}`,
    },
  };
}

/**
 * Public profile page — SSR for SEO.
 * Middleware rewrites /@username → /username, so this catches both.
 */
export default async function UserProfilePage({ params }: Props) {
  const { username } = await params;
  const data = await getProfileData(username);

  if (!data) notFound();

  return (
    <ProfilePage
      profile={data.profile}
      socials={data.socials}
      theme={data.theme}
      sections={data.sections}
    />
  );
}
