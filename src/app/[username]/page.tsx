import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import type { Profile, Social, Theme, Section, Meta } from "@/types/database";
import ProfilePage from "./ProfilePage";

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

  const [socialsRes, themeRes, sectionsRes, metaRes] = await Promise.all([
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
  ]);

  return {
    profile,
    socials: socialsRes.data ?? [],
    theme: themeRes.data!,
    sections: sectionsRes.data ?? [],
    meta: metaRes.data!,
  };
}

/** Dynamic SEO metadata per profile */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const data = await getProfileData(username);
  if (!data) return { title: "Perfil não encontrado" };

  const { profile, meta } = data;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "links.codecadence.com.br";

  return {
    metadataBase: new URL(`https://${baseUrl}`),
    title: meta.title ?? `${profile.display_name} | Links`,
    description: meta.description ?? `Links de ${profile.display_name}`,
    alternates: { canonical: `/@${profile.username}` },
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
