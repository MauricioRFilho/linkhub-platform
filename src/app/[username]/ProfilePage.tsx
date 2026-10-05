"use client";

import type { Profile, Social, Theme, Section } from "@/types/database";
import Avatar from "@/components/profile/Avatar";
import ProfileHeader from "@/components/profile/ProfileHeader";
import SocialBar from "@/components/profile/SocialBar";
import LinkItem from "@/components/profile/LinkItem";
import ProductItem from "@/components/profile/ProductItem";
import SectionHeader from "@/components/profile/SectionHeader";
import Footer from "@/components/profile/Footer";
import type { CSSProperties } from "react";
import { isSafeProfileLink } from "@/lib/utils/public-url";

interface ProfilePageProps {
  profile: Profile;
  socials: Social[];
  theme: Theme;
  sections: Section[];
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

  function renderSection(section: Section, index: number) {
    switch (section.type) {
      case "link":
        if (!section.url || !isSafeProfileLink(section.url, true)) return null;
        return (
          <LinkItem
            key={section.id}
            title={section.title}
            subtitle={section.subtitle}
            url={section.url!}
            emoji={section.emoji}
            thumbnail={section.thumbnail_url}
            index={index}
            accentColor={accentColor}
          />
        );
      case "product":
        if (!section.url || !isSafeProfileLink(section.url)) return null;
        return (
          <ProductItem
            key={section.id}
            title={section.title}
            subtitle={section.subtitle}
            url={section.url!}
            store={section.store || "Destaque"}
            thumbnail={section.thumbnail_url}
            index={index}
            accentColor={accentColor}
          />
        );
      case "header":
        return (
          <SectionHeader
            key={section.id}
            title={section.title}
            index={index}
          />
        );
      default:
        return null;
    }
  }

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
        {sections.map((section, i) => renderSection(section, i))}
      </div>

      <Footer name={profile.display_name} />

    </main>
  );
}
