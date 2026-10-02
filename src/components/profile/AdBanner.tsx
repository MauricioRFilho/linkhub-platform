"use client";

import { useEffect, useRef } from "react";

/**
 * Fixed bottom AdSense banner for public profiles.
 * Non-intrusive, responsive, with subtle glassmorphism backdrop.
 *
 * Configuration:
 * - Set NEXT_PUBLIC_ADSENSE_CLIENT_ID in .env.local
 * - Set NEXT_PUBLIC_ADSENSE_SLOT_ID in .env.local
 * - Until AdSense is approved, renders a placeholder
 */
export default function AdBanner() {
  const adRef = useRef<HTMLDivElement>(null);
  const clientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;
  const slotId = process.env.NEXT_PUBLIC_ADSENSE_SLOT_ID;

  useEffect(() => {
    if (!clientId || !slotId) return;

    try {
      // Push ad slot when component mounts
      ((window as unknown as Record<string, unknown[]>).adsbygoogle =
        (window as unknown as Record<string, unknown[]>).adsbygoogle || []).push({});
    } catch {
      // AdSense not loaded — silently ignore
    }
  }, [clientId, slotId]);

  // Placeholder when AdSense is not configured
  if (!clientId || !slotId) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50">
        <div className="mx-auto max-w-[480px] px-4 pb-4">
          <div className="bg-zinc-900/90 backdrop-blur-xl border border-zinc-800/50 rounded-xl p-3 text-center">
            <p className="text-xs text-zinc-500">
              Criado com{" "}
              <a
                href="https://links.codecadence.com.br"
                className="text-emerald-400 hover:text-emerald-300 transition-colors"
                target="_blank"
                rel="noopener"
              >
                LinkHub
              </a>{" "}
              — crie o seu grátis
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-zinc-950/80 backdrop-blur-sm border-t border-zinc-800/30">
      <div className="mx-auto max-w-[728px] px-4 py-2" ref={adRef}>
        <ins
          className="adsbygoogle"
          style={{ display: "block" }}
          data-ad-client={clientId}
          data-ad-slot={slotId}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      </div>
    </div>
  );
}
