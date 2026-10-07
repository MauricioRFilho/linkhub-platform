"use client";

import { useState } from "react";
import { Play } from "lucide-react";
import { trackBlock } from "@/lib/analytics/track";
import type { VideoConfig } from "@/lib/blocks/config";

interface VideoBlockProps {
  id: string;
  title: string;
  config: VideoConfig;
}

/**
 * Click-to-load facade: no third-party iframe (nor its trackers) is loaded
 * until the visitor asks for it, keeping the page fast and private.
 */
export default function VideoBlock({ id, title, config }: VideoBlockProps) {
  const [playing, setPlaying] = useState(false);
  const isYoutube = config.provider === "youtube";
  const src = isYoutube
    ? `https://www.youtube-nocookie.com/embed/${config.videoId}?autoplay=1&rel=0`
    : `https://www.tiktok.com/embed/v2/${config.videoId}`;

  return (
    <figure className="w-full overflow-hidden rounded-2xl border border-border bg-bg-card">
      <div className={`relative w-full ${isYoutube ? "aspect-video" : "aspect-[9/16] max-h-[640px]"}`}>
        {playing ? (
          <iframe
            src={src}
            title={title}
            className="absolute inset-0 h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        ) : (
          <button
            type="button"
            onClick={() => { setPlaying(true); trackBlock(id); }}
            aria-label={`Reproduzir ${title}`}
            className="group absolute inset-0 flex items-center justify-center bg-black bg-cover bg-center"
            style={isYoutube ? { backgroundImage: `url(https://i.ytimg.com/vi/${config.videoId}/hqdefault.jpg)` } : undefined}
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-accent text-black shadow-lg transition-transform group-hover:scale-110">
              <Play size={24} fill="currentColor" />
            </span>
          </button>
        )}
      </div>
      <figcaption className="px-4 py-2.5 text-sm font-medium text-text">{title}</figcaption>
    </figure>
  );
}
