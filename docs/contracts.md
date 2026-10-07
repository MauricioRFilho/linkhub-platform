# 📜 LinkHub — Contratos de Dados e APIs

Este documento formaliza as especificações técnicas, contratos TypeScript, schemas de banco de dados e endpoints de API da plataforma.

---

## 1. Contrato da Tabela `sections` (PostgreSQL & TypeScript)

A tabela `sections` é a espinha dorsal de todo o conteúdo exibido nas páginas públicas.

### Schema Relacional (PostgreSQL)
```sql
CREATE TABLE public.sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.sections(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('link', 'header', 'product', 'panel', 'coupon', 'community', 'video', 'text')),
  title TEXT NOT NULL,
  subtitle TEXT,
  url TEXT,
  emoji TEXT,
  thumbnail_url TEXT,
  store TEXT,
  layout TEXT CHECK (layout IN ('list', 'grid', 'carousel', 'spotlight')),
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  sort_order INT NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT panel_layout CHECK ((type = 'panel') = (layout IS NOT NULL)),
  CONSTRAINT schedule_window CHECK (starts_at IS NULL OR ends_at IS NULL OR ends_at > starts_at),
  CONSTRAINT no_self_parent CHECK (parent_id IS NULL OR parent_id <> id)
);
```

### Tipagem TypeScript (`Section`)
```typescript
export interface Section {
  id: string;
  profile_id: string;
  parent_id: string | null;
  type: "link" | "header" | "product" | "panel" | "coupon" | "community" | "video" | "text";
  title: string;
  subtitle: string | null;
  url: string | null;
  emoji: string | null;
  thumbnail_url: string | null;
  store: string | null;
  layout: "list" | "grid" | "carousel" | "spotlight" | null;
  config: Json;
  starts_at: string | null;
  ends_at: string | null;
  sort_order: number;
  active: boolean;
  created_at: string;
}
```

---

## 2. Contratos de Configuração por Bloco (`config JSONB`)

O campo `config` armazena parâmetros específicos de cada formato de bloco, tipados e validados em tempo de execução via `src/lib/blocks/config.ts`:

### A. Produto / Afiliado (`product`)
```typescript
export interface ProductConfig {
  price?: string;      // ex: "R$ 99,90" (máx 30 caracteres)
  oldPrice?: string;   // ex: "R$ 149,90" (máx 30 caracteres)
  badge?: string;      // ex: "-33% OFF" (máx 24 caracteres)
}
```

### B. Cupom de Desconto (`coupon`)
```typescript
export interface CouponConfig {
  code: string;        // Código promocional alfanumérico obrigatório (ex: "PROMO10")
  discount?: string;   // Texto de desconto opcional (ex: "10% OFF")
  validUntil?: string; // Data ISO formato YYYY-MM-DD
}
```

### C. Comunidades & Canais (`community`)
```typescript
export type CommunityPlatform =
  | "discord"
  | "whatsapp"
  | "telegram"
  | "instagram"
  | "youtube"
  | "tiktok"
  | "other";

export interface CommunityConfig {
  platform: CommunityPlatform;
  cta?: string;        // Texto de ação no botão (ex: "Entrar no grupo")
  members?: string;    // Contador informativo (ex: "+1.500 membros")
}
```

### D. Vídeo (`video`)
```typescript
export interface VideoConfig {
  provider: "youtube" | "tiktok";
  videoId: string;     // ID alfanumérico estrito do vídeo
}
```

### E. Texto / Apresentação (`text`)
```typescript
export interface TextConfig {
  markdown: string;    // Texto formatado (máx 2.000 caracteres, sanitizado)
}
```

### F. Painel Agrupador (`panel`)
```typescript
export interface PanelConfig {
  showCountdown?: boolean; // Habilita o badge de término se houver ends_at
}
```

---

## 3. Contrato da API de Analytics (`/api/click`)

Endpoint assíncrono para telemetria de cliques em blocos e cópias de cupom.

- **Método:** `POST`
- **Caminho:** `/api/click`
- **Headers:** `Content-Type: application/json`

### Payload de Entrada (Request Body)
```json
{
  "sectionId": "aaaaaaaa-0000-0000-0000-000000000001",
  "kind": "click",
  "referrer": "https://instagram.com"
}
```

| Campo | Tipo | Obrigatório | Descrição |
| :--- | :--- | :--- | :--- |
| `sectionId` | `UUID string` | Sim | Identificador do bloco interagido |
| `kind` | `"click" \| "copy"` | Não | Tipo de interação (padrão: `"click"`) |
| `referrer` | `string \| null` | Não | Origem do visitante (document.referrer) |

### Respostas HTTP
| Código | Significado | Condição |
| :--- | :--- | :--- |
| `204 No Content` | Sucesso | Evento registrado via RPC no banco |
| `400 Bad Request` | Inválido | Formato de UUID ou JSON inválido |
| `422 Unprocessable` | Rejeitado | Bloco não publicado ou inexistente |
| `429 Too Many Requests` | Rate limit | Mais de 60 requisições por minuto por IP |

---

## 4. Contrato de Presets de Conteúdo (`src/lib/blocks/presets.ts`)

```typescript
export interface Preset {
  id: "affiliate" | "creator" | "business";
  label: string;
  description: string;
  panel: {
    type: "panel";
    title: string;
    layout: "spotlight" | "grid" | "carousel" | "list";
    config: Record<string, unknown>;
    ends_at?: string;
  };
  children: Array<{
    type: SectionTypeValue;
    title: string;
    subtitle?: string;
    url?: string;
    emoji?: string;
    store?: string;
    config?: Record<string, unknown>;
  }>;
}
```
