"use client";

import type { Section } from "@/types/database";
import type { WithChildren } from "@/lib/blocks/tree";
import { readConfig } from "@/lib/blocks/config";
import { isSafeProfileLink } from "@/lib/utils/public-url";
import { trackBlock } from "@/lib/analytics/track";
import LinkItem from "@/components/profile/LinkItem";
import ProductItem from "@/components/profile/ProductItem";
import SectionHeader from "@/components/profile/SectionHeader";
import CouponBlock from "./CouponBlock";
import CommunityBlock from "./CommunityBlock";
import VideoBlock from "./VideoBlock";
import TextBlock from "./TextBlock";
import PanelBlock from "./PanelBlock";

interface BlockRendererProps {
  block: Section | WithChildren<Section>;
  index: number;
  accentColor: string;
}

/**
 * Single dispatch point from `sections.type` to its public component.
 * Invalid/unsafe data renders nothing instead of breaking the page.
 * @see src/lib/blocks/config.ts
 */
export default function BlockRenderer({ block, index, accentColor }: BlockRendererProps) {
  const track = () => trackBlock(block.id);
  switch (block.type) {
    case "link":
      if (!block.url || !isSafeProfileLink(block.url, true)) return null;
      return <LinkItem title={block.title} subtitle={block.subtitle} url={block.url} emoji={block.emoji}
        thumbnail={block.thumbnail_url} index={index} accentColor={accentColor} onClick={track} />;
    case "product": {
      if (!block.url || !isSafeProfileLink(block.url)) return null;
      const config = readConfig("product", block.config) ?? {};
      return <ProductItem title={block.title} subtitle={block.subtitle} url={block.url} store={block.store || "Destaque"}
        thumbnail={block.thumbnail_url} index={index} accentColor={accentColor} onClick={track} {...config} />;
    }
    case "header":
      return <SectionHeader title={block.title} index={index} />;
    case "coupon": {
      const config = readConfig("coupon", block.config);
      if (!config) return null;
      const url = block.url && isSafeProfileLink(block.url) ? block.url : null;
      return <CouponBlock id={block.id} title={block.title} subtitle={block.subtitle} url={url} config={config} index={index} />;
    }
    case "community": {
      const config = readConfig("community", block.config);
      if (!config || !block.url || !isSafeProfileLink(block.url, true)) return null;
      return <CommunityBlock id={block.id} title={block.title} subtitle={block.subtitle} url={block.url} config={config} index={index} />;
    }
    case "video": {
      const config = readConfig("video", block.config);
      return config ? <VideoBlock id={block.id} title={block.title} config={config} /> : null;
    }
    case "text": {
      const config = readConfig("text", block.config);
      return config ? <TextBlock title={block.title} markdown={config.markdown} /> : null;
    }
    case "panel": {
      const children = "children" in block ? block.children : [];
      if (!block.layout || children.length === 0) return null;
      const config = readConfig("panel", block.config);
      return (
        <PanelBlock title={block.title} subtitle={block.subtitle} layout={block.layout} endsAt={block.ends_at}
          showCountdown={config?.showCountdown ?? false} index={index}>
          {children.map((child, i) => <BlockRenderer key={child.id} block={child} index={i} accentColor={accentColor} />)}
        </PanelBlock>
      );
    }
    default:
      return null;
  }
}
