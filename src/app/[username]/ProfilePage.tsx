"use client";

import type { Profile, Social, Theme, Section } from "@/types/database";
import Avatar from "@/components/profile/Avatar";
import ProfileHeader from "@/components/profile/ProfileHeader";
import SocialBar from "@/components/profile/SocialBar";
import LinkItem from "@/components/profile/LinkItem";
import ProductItem from "@/components/profile/ProductItem";
import SectionHeader from "@/components/profile/SectionHeader";
import Footer from "@/components/profile/Footer";
import AdBanner from "@/components/profile/AdBanner";

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
        return (
          <ProductItem
            key={section.id}
            title={section.title}
            subtitle={section.subtitle}
            url={section.url!}
            store={section.store!}
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

  const accentStyle = { "--accent": accentColor } as React.CSSProperties;

  return (
    <main
      className="flex flex-col items-center min-h-screen px-4 py-14 md:py-20 pb-24"
      style={accentStyle}
    >
      <Avatar
        src={profile.avatar_url || "/avatar.jpg"}
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

      {/* AdSense banner — always visible on public profiles */}
      <AdBanner />
    </main>
  );
}
