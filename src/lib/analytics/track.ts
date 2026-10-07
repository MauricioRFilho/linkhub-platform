/**
 * Fire-and-forget analytics. `sendBeacon` survives the navigation triggered by
 * the click itself, so tracking never delays the visitor.
 * @see src/app/api/click/route.ts
 */
export function trackBlock(sectionId: string, kind: "click" | "copy" = "click"): void {
  if (typeof window === "undefined") return;
  const payload = JSON.stringify({ sectionId, kind, referrer: document.referrer || null });
  try {
    const blob = new Blob([payload], { type: "application/json" });
    if (navigator.sendBeacon?.("/api/click", blob)) return;
  } catch { /* fall through */ }
  void fetch("/api/click", { method: "POST", body: payload, headers: { "Content-Type": "application/json" }, keepalive: true }).catch(() => undefined);
}
