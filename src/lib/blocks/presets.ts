/**
 * Niche presets: one click creates a ready-to-fill panel for the creator's use
 * case (affiliate, content creator, business). Inserted HIDDEN so placeholder
 * content never goes live before the creator reviews it.
 * @see context.md — "Uma base para pessoas e empresas"
 */
import type { PanelLayoutValue, SectionTypeValue } from "../../types/database.ts";
import { endOfWeek } from "./schedule.ts";

export interface BlockDraft {
  type: SectionTypeValue;
  title: string;
  subtitle?: string;
  url?: string;
  emoji?: string;
  store?: string;
  layout?: PanelLayoutValue;
  config?: Record<string, unknown>;
  ends_at?: string;
}

export interface Preset {
  id: "affiliate" | "creator" | "business";
  label: string;
  description: string;
  panel: BlockDraft;
  children: BlockDraft[];
}

export function getPresets(now: Date = new Date()): Preset[] {
  return [
    {
      id: "affiliate",
      label: "Afiliado — Achado da semana",
      description: "Produto em destaque, cupom e comunidades. Expira no domingo.",
      panel: {
        type: "panel", title: "🔥 Achado da semana", layout: "spotlight",
        config: { showCountdown: true }, ends_at: endOfWeek(now).toISOString(),
      },
      children: [
        { type: "product", title: "Nome do produto", subtitle: "Por que eu recomendo", url: "https://", store: "amazon", config: { price: "R$ 99,90", oldPrice: "R$ 149,90", badge: "-33%" } },
        { type: "coupon", title: "Cupom exclusivo", config: { code: "SEUCUPOM", discount: "10% OFF" } },
        { type: "community", title: "Grupo de ofertas no WhatsApp", url: "https://chat.whatsapp.com/", config: { platform: "whatsapp", cta: "Entrar no grupo" } },
        { type: "community", title: "Comunidade no Discord", url: "https://discord.gg/", config: { platform: "discord", cta: "Participar" } },
        { type: "community", title: "Canal no Telegram", url: "https://t.me/", config: { platform: "telegram", cta: "Seguir canal" } },
      ],
    },
    {
      id: "creator",
      label: "Criador de conteúdo",
      description: "Último vídeo, comunidade e links principais em grade.",
      panel: { type: "panel", title: "🎬 Novidades", layout: "grid", config: {} },
      children: [
        { type: "video", title: "Último vídeo", config: { provider: "youtube", videoId: "dQw4w9WgXcQ" } },
        { type: "community", title: "Meu Instagram", url: "https://instagram.com/", config: { platform: "instagram", cta: "Seguir" } },
        { type: "community", title: "Comunidade no Discord", url: "https://discord.gg/", config: { platform: "discord", cta: "Participar" } },
        { type: "link", title: "Meu site", url: "https://", emoji: "🌐" },
      ],
    },
    {
      id: "business",
      label: "Empresa",
      description: "Sobre, atendimento no WhatsApp e links institucionais.",
      panel: { type: "panel", title: "🏢 Sobre nós", layout: "list", config: {} },
      children: [
        { type: "text", title: "Sobre", config: { markdown: "Somos a **Sua Empresa**. Conte em poucas linhas o que vocês fazem.\n\n- Atendimento de seg. a sex.\n- Entrega para todo o Brasil" } },
        { type: "community", title: "Fale conosco no WhatsApp", url: "https://wa.me/55", config: { platform: "whatsapp", cta: "Chamar agora" } },
        { type: "link", title: "Catálogo / Site", url: "https://", emoji: "🛍️" },
      ],
    },
  ];
}
