"use client";

import { useState } from "react";
import type { Section, SectionTypeValue, PanelLayoutValue } from "@/types/database";
import {
  COMMUNITY_PLATFORMS,
  parseVideoUrl,
  validateConfig,
  readConfig,
  validateBlockUrl,
  type CommunityPlatform,
  type ProductConfig,
  type CouponConfig,
  type CommunityConfig,
  type VideoConfig,
  type TextConfig,
} from "@/lib/blocks/config";
import { endOfWeek, toLocalInput, fromLocalInput } from "@/lib/blocks/schedule";
import { safeImageSource } from "@/lib/utils/public-url";
import {
  Link2,
  Tag,
  TicketPercent,
  Users,
  Video,
  FileText,
  Heading,
  Layout,
  Clock,
  Sparkles,
  Check,
  Loader2,
} from "lucide-react";

export interface FormValues {
  type: SectionTypeValue;
  title: string;
  subtitle: string;
  url: string;
  emoji: string;
  thumbnailUrl: string;
  store: string;
  layout: PanelLayoutValue;
  parentId: string | null;
  startsAt: string;
  endsAt: string;
  // Config fields
  productPrice: string;
  productOldPrice: string;
  productBadge: string;
  couponCode: string;
  couponDiscount: string;
  couponValidUntil: string;
  communityPlatform: CommunityPlatform;
  communityCta: string;
  communityMembers: string;
  videoUrl: string;
  textMarkdown: string;
  panelShowCountdown: boolean;
}

interface BlockEditorFormProps {
  initialSection?: Section | null;
  parentId?: string | null;
  availablePanels: Section[];
  onSave: (values: FormValues) => Promise<boolean>;
  onCancel: () => void;
  saving: boolean;
}

const TYPE_OPTIONS: { type: SectionTypeValue; label: string; icon: typeof Link2; desc: string }[] = [
  { type: "link", label: "Link Geral", icon: Link2, desc: "Qualquer link externo ou interno com emoji/ícone" },
  { type: "product", label: "Produto / Afiliado", icon: Tag, desc: "Recomendações com preço, desconto e loja" },
  { type: "coupon", label: "Cupom de Desconto", icon: TicketPercent, desc: "Código copiável com 1 clique e validade" },
  { type: "community", label: "Comunidade / Canal", icon: Users, desc: "WhatsApp, Discord, Telegram, Instagram com CTA" },
  { type: "video", label: "Vídeo", icon: Video, desc: "Embed rápido do YouTube ou TikTok" },
  { type: "text", label: "Texto / Apresentação", icon: FileText, desc: "Bloco de texto com formatação Markdown" },
  { type: "panel", label: "Painel Agrupador", icon: Layout, desc: "Agrupa vários blocos em Destaque, Grade ou Carrossel" },
  { type: "header", label: "Cabeçalho", icon: Heading, desc: "Divisor de seções da página" },
];

export default function BlockEditorForm({
  initialSection,
  parentId = null,
  availablePanels,
  onSave,
  onCancel,
  saving,
}: BlockEditorFormProps) {
  const isEditing = !!initialSection;
  const initialType: SectionTypeValue = initialSection?.type ?? (parentId ? "link" : "link");

  const [type, setType] = useState<SectionTypeValue>(initialType);
  const [title, setTitle] = useState(initialSection?.title ?? "");
  const [subtitle, setSubtitle] = useState(initialSection?.subtitle ?? "");
  const [url, setUrl] = useState(initialSection?.url ?? "");
  const [emoji, setEmoji] = useState(initialSection?.emoji ?? "");
  const [thumbnailUrl, setThumbnailUrl] = useState(initialSection?.thumbnail_url ?? "");
  const [store, setStore] = useState(initialSection?.store ?? "");
  const [layout, setLayout] = useState<PanelLayoutValue>(initialSection?.layout ?? "spotlight");
  const [selectedParentId, setSelectedParentId] = useState<string | null>(
    initialSection ? initialSection.parent_id : parentId
  );
  const [startsAt, setStartsAt] = useState(toLocalInput(initialSection?.starts_at ?? null));
  const [endsAt, setEndsAt] = useState(toLocalInput(initialSection?.ends_at ?? null));

  // Config fields
  const pConf = readConfig("product", initialSection?.config) as ProductConfig | null;
  const [productPrice, setProductPrice] = useState(pConf?.price ?? "");
  const [productOldPrice, setProductOldPrice] = useState(pConf?.oldPrice ?? "");
  const [productBadge, setProductBadge] = useState(pConf?.badge ?? "");

  const cConf = readConfig("coupon", initialSection?.config) as CouponConfig | null;
  const [couponCode, setCouponCode] = useState(cConf?.code ?? "");
  const [couponDiscount, setCouponDiscount] = useState(cConf?.discount ?? "");
  const [couponValidUntil, setCouponValidUntil] = useState(cConf?.validUntil ?? "");

  const comConf = readConfig("community", initialSection?.config) as CommunityConfig | null;
  const [communityPlatform, setCommunityPlatform] = useState<CommunityPlatform>(
    comConf?.platform ?? "whatsapp"
  );
  const [communityCta, setCommunityCta] = useState(comConf?.cta ?? "Entrar no grupo");
  const [communityMembers, setCommunityMembers] = useState(comConf?.members ?? "");

  const vConf = readConfig("video", initialSection?.config) as VideoConfig | null;
  const [videoUrl, setVideoUrl] = useState(
    vConf ? (vConf.provider === "youtube" ? `https://youtu.be/${vConf.videoId}` : `https://www.tiktok.com/video/${vConf.videoId}`) : ""
  );

  const tConf = readConfig("text", initialSection?.config) as TextConfig | null;
  const [textMarkdown, setTextMarkdown] = useState(tConf?.markdown ?? "");

  const panConf = readConfig("panel", initialSection?.config);
  const [panelShowCountdown, setPanelShowCountdown] = useState(panConf?.showCountdown ?? true);

  const [formError, setFormError] = useState<string | null>(null);

  function applyEndOfWeek() {
    const end = endOfWeek(new Date());
    setEndsAt(toLocalInput(end.toISOString()));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    try {
      if (!title.trim()) throw new Error("Informe o título do bloco.");

      // URL validation
      if (type !== "video" && type !== "panel" && type !== "text" && type !== "header") {
        validateBlockUrl(type, url);
      }

      // Thumbnail safety check
      if (thumbnailUrl.trim() && !safeImageSource(thumbnailUrl.trim())) {
        throw new Error("Use uma imagem com URL http(s) válida.");
      }

      // Pre-validation for video
      if (type === "video") {
        const parsed = parseVideoUrl(videoUrl);
        if (!parsed) throw new Error("Cole um link válido do YouTube ou TikTok.");
      }

      // Pre-validate configs
      if (type === "coupon") {
        validateConfig("coupon", { code: couponCode, discount: couponDiscount, validUntil: couponValidUntil });
      } else if (type === "community") {
        validateConfig("community", { platform: communityPlatform, cta: communityCta, members: communityMembers });
      } else if (type === "text") {
        validateConfig("text", { markdown: textMarkdown });
      }

      const values: FormValues = {
        type,
        title: title.trim(),
        subtitle: subtitle.trim(),
        url: url.trim(),
        emoji: emoji.trim(),
        thumbnailUrl: thumbnailUrl.trim(),
        store: store.trim(),
        layout,
        parentId: type === "panel" ? null : selectedParentId,
        startsAt: fromLocalInput(startsAt) ?? "",
        endsAt: fromLocalInput(endsAt) ?? "",
        productPrice: productPrice.trim(),
        productOldPrice: productOldPrice.trim(),
        productBadge: productBadge.trim(),
        couponCode: couponCode.trim(),
        couponDiscount: couponDiscount.trim(),
        couponValidUntil: couponValidUntil.trim(),
        communityPlatform,
        communityCta: communityCta.trim(),
        communityMembers: communityMembers.trim(),
        videoUrl: videoUrl.trim(),
        textMarkdown: textMarkdown.trim(),
        panelShowCountdown,
      };

      await onSave(values);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Erro ao validar formulário");
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="p-5 md:p-6 rounded-2xl bg-zinc-900 border border-emerald-500/40 shadow-xl space-y-5 mb-8 animate-in fade-in duration-200"
    >
      <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
        <div>
          <h2 className="text-base font-bold text-white">
            {isEditing ? "Editar Bloco / Painel" : "Criar Novo Bloco ou Painel"}
          </h2>
          <p className="text-xs text-zinc-400">
            {type === "panel"
              ? "Crie uma seção agrupada com layout personalizado."
              : selectedParentId
              ? "Este bloco será adicionado dentro do painel selecionado."
              : "Bloco dinâmico de exibição no seu perfil."}
          </p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="text-xs px-3 py-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
        >
          Cancelar
        </button>
      </div>

      {/* Type Selector (only on create or panel restriction) */}
      {!isEditing && (
        <div>
          <label className="block text-xs font-semibold text-zinc-300 mb-2">
            Tipo de Conteúdo
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {TYPE_OPTIONS.filter((opt) => !(selectedParentId && opt.type === "panel")).map((opt) => {
              const Icon = opt.icon;
              const isSelected = type === opt.type;
              return (
                <button
                  key={opt.type}
                  type="button"
                  onClick={() => setType(opt.type)}
                  className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between gap-1.5 ${
                    isSelected
                      ? "bg-emerald-500/15 border-emerald-500 text-white"
                      : "bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isSelected ? "text-emerald-400" : "text-zinc-400"}`} />
                  <div>
                    <span className="text-xs font-bold block">{opt.label}</span>
                    <span className="text-[10px] text-zinc-500 line-clamp-1">{opt.desc}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <label className="block text-xs text-zinc-400">
          Título *
          <input
            type="text"
            required
            maxLength={120}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={type === "panel" ? "ex: 🔥 Achado da Semana" : "ex: Fone Bluetooth Sem Fio"}
            className="mt-1 w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-sm focus:outline-none focus:border-emerald-500"
          />
        </label>

        <label className="block text-xs text-zinc-400">
          Subtítulo / Descrição Curta
          <input
            type="text"
            maxLength={160}
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            placeholder="ex: Melhor custo benefício de 2026"
            className="mt-1 w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-sm focus:outline-none focus:border-emerald-500"
          />
        </label>

        {/* Panel Specifics */}
        {type === "panel" && (
          <>
            <label className="block text-xs text-zinc-400">
              Layout do Painel *
              <select
                value={layout}
                onChange={(e) => setLayout(e.target.value as PanelLayoutValue)}
                className="mt-1 w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-sm focus:outline-none focus:border-emerald-500"
              >
                <option value="spotlight">⭐ Destaque (Spotlight - card emoldurado com brilho)</option>
                <option value="grid">⊞ Grade (Grid 2 colunas)</option>
                <option value="carousel">↔ Carrossel Deslizável (Mobile swipe)</option>
                <option value="list">≡ Lista Vertical</option>
              </select>
            </label>

            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                id="countdown"
                checked={panelShowCountdown}
                onChange={(e) => setPanelShowCountdown(e.target.checked)}
                className="rounded border-zinc-800 bg-zinc-950 text-emerald-500 focus:ring-emerald-500"
              />
              <label htmlFor="countdown" className="text-xs text-zinc-300 cursor-pointer">
                Exibir contagem regressiva se tiver data de término
              </label>
            </div>
          </>
        )}

        {/* URL fields for standard linkable blocks */}
        {(type === "link" || type === "product" || type === "community" || type === "coupon") && (
          <label className="block text-xs text-zinc-400">
            URL / Link de Destino {type !== "coupon" && "*"}
            <input
              type="url"
              required={type !== "coupon"}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
              className="mt-1 w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-sm focus:outline-none focus:border-emerald-500"
            />
          </label>
        )}

        {/* Visual decorators for link / product */}
        {(type === "link" || type === "product") && (
          <>
            <div className="grid grid-cols-[80px_1fr] gap-2">
              <label className="block text-xs text-zinc-400">
                Emoji
                <input
                  type="text"
                  maxLength={4}
                  value={emoji}
                  onChange={(e) => setEmoji(e.target.value)}
                  placeholder="🚀"
                  className="mt-1 w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-sm text-center focus:outline-none focus:border-emerald-500"
                />
              </label>
              <label className="block text-xs text-zinc-400">
                Imagem / Thumbnail (URL opcional)
                <input
                  type="url"
                  value={thumbnailUrl}
                  onChange={(e) => setThumbnailUrl(e.target.value)}
                  placeholder="https://..."
                  className="mt-1 w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-sm focus:outline-none focus:border-emerald-500"
                />
              </label>
            </div>
          </>
        )}

        {/* Product specifics */}
        {type === "product" && (
          <>
            <label className="block text-xs text-zinc-400">
              Loja / Plataforma
              <input
                type="text"
                value={store}
                onChange={(e) => setStore(e.target.value)}
                placeholder="Amazon, Shopee, Mercado Livre, Hotmart..."
                className="mt-1 w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-sm focus:outline-none focus:border-emerald-500"
              />
            </label>
            <div className="grid grid-cols-3 gap-2">
              <label className="block text-xs text-zinc-400">
                Preço Atual
                <input
                  type="text"
                  maxLength={30}
                  value={productPrice}
                  onChange={(e) => setProductPrice(e.target.value)}
                  placeholder="R$ 99,90"
                  className="mt-1 w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-sm focus:outline-none focus:border-emerald-500"
                />
              </label>
              <label className="block text-xs text-zinc-400">
                Preço De / Antigo
                <input
                  type="text"
                  maxLength={30}
                  value={productOldPrice}
                  onChange={(e) => setProductOldPrice(e.target.value)}
                  placeholder="R$ 149,90"
                  className="mt-1 w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-sm focus:outline-none focus:border-emerald-500"
                />
              </label>
              <label className="block text-xs text-zinc-400">
                Selo / Badge
                <input
                  type="text"
                  maxLength={24}
                  value={productBadge}
                  onChange={(e) => setProductBadge(e.target.value)}
                  placeholder="-33% OFF"
                  className="mt-1 w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-sm focus:outline-none focus:border-emerald-500"
                />
              </label>
            </div>
          </>
        )}

        {/* Coupon specifics */}
        {type === "coupon" && (
          <>
            <label className="block text-xs text-zinc-400">
              Código do Cupom *
              <input
                type="text"
                required
                maxLength={40}
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                placeholder="PROMO10, BLACKFRIDAY..."
                className="mt-1 w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white font-mono text-sm tracking-widest focus:outline-none focus:border-emerald-500"
              />
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label className="block text-xs text-zinc-400">
                Desconto
                <input
                  type="text"
                  maxLength={30}
                  value={couponDiscount}
                  onChange={(e) => setCouponDiscount(e.target.value)}
                  placeholder="10% OFF, R$ 50 OFF..."
                  className="mt-1 w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-sm focus:outline-none focus:border-emerald-500"
                />
              </label>
              <label className="block text-xs text-zinc-400">
                Válido até (opcional)
                <input
                  type="date"
                  value={couponValidUntil}
                  onChange={(e) => setCouponValidUntil(e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-sm focus:outline-none focus:border-emerald-500"
                />
              </label>
            </div>
          </>
        )}

        {/* Community specifics */}
        {type === "community" && (
          <>
            <label className="block text-xs text-zinc-400">
              Plataforma *
              <select
                value={communityPlatform}
                onChange={(e) => setCommunityPlatform(e.target.value as CommunityPlatform)}
                className="mt-1 w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-sm focus:outline-none focus:border-emerald-500"
              >
                {COMMUNITY_PLATFORMS.map((plat) => (
                  <option key={plat} value={plat} className="capitalize">
                    {plat === "whatsapp" ? "WhatsApp" : plat === "discord" ? "Discord" : plat === "telegram" ? "Telegram" : plat}
                  </option>
                ))}
              </select>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label className="block text-xs text-zinc-400">
                Texto do Botão (CTA)
                <input
                  type="text"
                  maxLength={40}
                  value={communityCta}
                  onChange={(e) => setCommunityCta(e.target.value)}
                  placeholder="Entrar no grupo, Participar..."
                  className="mt-1 w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-sm focus:outline-none focus:border-emerald-500"
                />
              </label>
              <label className="block text-xs text-zinc-400">
                Membros (opcional)
                <input
                  type="text"
                  maxLength={20}
                  value={communityMembers}
                  onChange={(e) => setCommunityMembers(e.target.value)}
                  placeholder="+1.500"
                  className="mt-1 w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-sm focus:outline-none focus:border-emerald-500"
                />
              </label>
            </div>
          </>
        )}

        {/* Video specifics */}
        {type === "video" && (
          <div className="sm:col-span-2">
            <label className="block text-xs text-zinc-400">
              Link do Vídeo (YouTube ou TikTok) *
              <input
                type="url"
                required
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=... ou https://youtu.be/... ou https://tiktok.com/@..."
                className="mt-1 w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-sm focus:outline-none focus:border-emerald-500"
              />
            </label>
          </div>
        )}

        {/* Text specifics */}
        {type === "text" && (
          <div className="sm:col-span-2">
            <label className="block text-xs text-zinc-400">
              Conteúdo em Markdown *
              <textarea
                required
                rows={4}
                maxLength={2000}
                value={textMarkdown}
                onChange={(e) => setTextMarkdown(e.target.value)}
                placeholder="Use **negrito**, *itálico*, [links](https://...) e listas com hífens..."
                className="mt-1 w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-sm focus:outline-none focus:border-emerald-500 font-mono"
              />
            </label>
          </div>
        )}

        {/* Panel Assignment (if creating a child block or moving) */}
        {type !== "panel" && availablePanels.length > 0 && (
          <label className="block text-xs text-zinc-400">
            Painel Agrupador
            <select
              value={selectedParentId ?? ""}
              onChange={(e) => setSelectedParentId(e.target.value ? e.target.value : null)}
              className="mt-1 w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-sm focus:outline-none focus:border-emerald-500"
            >
              <option value="">Nenhum (bloco avulso na raiz)</option>
              {availablePanels.map((p) => (
                <option key={p.id} value={p.id}>
                  📁 {p.title} ({p.layout})
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      {/* Scheduling / Expiration ("Esta semana") */}
      <div className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-semibold text-white">Agendamento & Validade</span>
            <span className="text-[10px] text-zinc-400">(opcional - publica ou expira automaticamente)</span>
          </div>
          <button
            type="button"
            onClick={applyEndOfWeek}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-emerald-400 text-xs font-medium transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Válido até o fim desta semana (Domingo 23:59)
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="block text-xs text-zinc-400">
            Publicar a partir de (início)
            <input
              type="datetime-local"
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
              className="mt-1 w-full px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-white text-xs focus:outline-none focus:border-emerald-500"
            />
          </label>
          <label className="block text-xs text-zinc-400">
            Expirar / Tirar do ar em (término)
            <input
              type="datetime-local"
              value={endsAt}
              onChange={(e) => setEndsAt(e.target.value)}
              className="mt-1 w-full px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-white text-xs focus:outline-none focus:border-emerald-500"
            />
          </label>
        </div>
      </div>

      {formError && (
        <p role="alert" className="text-xs text-red-400 bg-red-500/10 p-2.5 rounded-lg border border-red-500/20">
          {formError}
        </p>
      )}

      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-white"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={saving || !title.trim()}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-900/30 disabled:opacity-50 transition-all"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          {isEditing ? "Salvar Alterações" : "Criar Bloco"}
        </button>
      </div>
    </form>
  );
}
