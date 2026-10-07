"use client";

import type { Profile, Social, Theme, Section } from "@/types/database";
import type { WithChildren } from "@/lib/blocks/tree";
import Avatar from "@/components/profile/Avatar";
import ProfileHeader from "@/components/profile/ProfileHeader";
import SocialBar from "@/components/profile/SocialBar";
import Footer from "@/components/profile/Footer";
import BlockRenderer from "@/components/blocks/BlockRenderer";
import type { CSSProperties } from "react";

interface ProfilePageProps {
  profile: Profile;
  socials: Social[];
  theme: Theme;
  /** Top-level blocks; panels carry their children. */
  sections: WithChildren<Section>[];
}

/**
 * Client component that renders the public profile.
 * Separated from the server page to enable animations and interactivity.
 */
export default function ProfilePage({
  profile,
  socials,
  theme,
  sections,
}: ProfilePageProps) {
  const accentColor = theme.accent_color;

  const accentStyle = { "--accent": accentColor } as CSSProperties;

  return (
    <main
      className="public-profile flex flex-col items-center min-h-screen px-4 py-14 md:py-20 pb-24"
      data-public-profile=""
      data-style={theme.style}
      data-template={theme.template}
      style={accentStyle}
    >
      <Avatar
        src={profile.avatar_url}
        name={profile.display_name}
        verified={profile.verified}
        accentColor={accentColor}
      />
      <ProfileHeader name={profile.display_name} bio={profile.bio || ""} />
      <SocialBar socials={socials} accentColor={accentColor} />

      <div className="w-full max-w-[480px] mt-8 flex flex-col gap-2.5">
        {sections.map((section, i) => (
          <BlockRenderer key={section.id} block={section} index={i} accentColor={accentColor} />
        ))}
      </div>

      <Footer name={profile.display_name} />

    </main>
  );
}
