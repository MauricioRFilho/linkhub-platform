# 🏛️ LinkHub — Arquitetura de Software

Este documento descreve a arquitetura técnica, fluxo de dados e decisões de design do **LinkHub**.

---

## 1. Visão Geral C4 (Diagrama de Contêineres)

```mermaid
flowchart TD
    Visitante([Visitante da Web])
    Criador([Criador / Administrador])

    subgraph LinkHub ["Plataforma LinkHub (Next.js 16)"]
        PublicApp["SSR Public Pages (/@username)"]
        Dashboard["Dashboard Administrativo (/dashboard)"]
        AnalyticsAPI["Analytics Route (/api/click)"]
        Middleware["Session & Proxy (proxy.ts)"]
    end

    subgraph Supabase ["Supabase Backend (Managed)"]
        PostgreSQL[("PostgreSQL 17 Database\nRLS Ativo")]
        AuthService["Supabase Auth (Magic Link & OAuth)"]
        Storage["Storage (Avatars Bucket)"]
    end

    Visitante -->|Acessa perfil público| Middleware
    Middleware -->|Rewrite /@user -> /user| PublicApp
    PublicApp -->|SSR Query (RLS restrito)| PostgreSQL
    PublicApp -->|sendBeacon (cliques / cupons)| AnalyticsAPI
    AnalyticsAPI -->|RPC track_click| PostgreSQL

    Criador -->|Login / Gerenciamento| Dashboard
    Dashboard -->|Autenticação| AuthService
    Dashboard -->|Upload de Avatar| Storage
    Dashboard -->|CRUD com RLS por dono| PostgreSQL
```

---

## 2. Fluxo de Vida dos Dados e Camadas

### A. Criação de Conteúdo (Dashboard)
1. O criador autentica-se e acessa `/dashboard/links`.
2. Pode escolher um **Modelo Pronto (Preset)** ou criar manualmente blocos/painéis.
3. O `BlockEditorForm` valida os campos no cliente e serializa configurações específicas no formato `Json` (`config JSONB`).
4. A mutação é enviada via Supabase Client (`useLinks.ts`) e protegida por **Row-Level Security (RLS)** — o PostgreSQL valida `auth.uid() = profile_id`.
5. Triggers de banco (`sections_validate_parent`) garantem integridade referencial: painéis só aninham até 1 nível e apenas para o mesmo proprietário.

### B. Renderização Pública (SSR Dinâmico)
1. O visitante acessa `https://links.codecadence.com.br/@usuario`.
2. O middleware `proxy.ts` reescreve a requisição para a rota dinâmica `src/app/[username]/page.tsx`.
3. O Server Component busca os dados no Supabase usando o cliente de servidor (`src/lib/supabase/server.ts`).
4. **Filtro de Segurança em 2 Níveis:**
   - **Nível 1 (PostgreSQL RLS):** A política `Public sees published sections` retorna apenas registros com `active = true` e cuja janela de agendamento (`starts_at` e `ends_at`) seja válida em relação a `now()`.
   - **Nível 2 (Aplicação):** A função `buildTree()` monta a hierarquia `panel → children`. Se um painel pai estiver oculto ou inativo, seus filhos são automaticamente descartados da renderização.
5. O componente de cliente `ProfilePage.tsx` renderiza a árvore visual aplicando o tema selecionado (`classic`, `minimal`, `bold`, `neon` ou `editorial`) e as variáveis CSS de cor de destaque (`--accent`).

### C. Coleta de Métricas (Analytics Assíncrono)
1. Quando o visitante clica em um link de produto ou copia um código de cupom:
   - A função `trackBlock(sectionId, kind)` emite um evento via `navigator.sendBeacon("/api/click", payload)`.
   - Por utilizar `sendBeacon`, a requisição não bloqueia nem atrasa a navegação imediata do usuário.
2. A API em `/api/click/route.ts` aplica rate limiting em memória por IP (sem persistência) e invoca a função RPC PostgreSQL `track_click`.
3. A função `track_click` é `SECURITY DEFINER` e valida no banco se o bloco está de fato publicado antes de registrar o evento na tabela `section_clicks`.
4. Os dados agregados são expostos ao dono do perfil através da view indexada `section_click_stats`.

---

## 3. Padrão Block Registry (Extensibilidade de Blocos)

A plataforma utiliza um padrão de registro de blocos desacoplado para evitar condicionais complexas e espalhadas pelo código:

| Tipo | Propósito | Configuração (`config JSONB`) | Renderer Público |
| :--- | :--- | :--- | :--- |
| `link` | Link genérico com ícone | `{}` | `LinkItem.tsx` |
| `product` | Produto de afiliado / recomendação | `{ price, oldPrice, badge }` | `ProductItem.tsx` |
| `coupon` | Cupom de desconto com cópia direta | `{ code, discount, validUntil }` | `CouponBlock.tsx` |
| `community` | Canal ou grupo oficial | `{ platform, cta, members }` | `CommunityBlock.tsx` |
| `video` | Player de vídeo sem trackers bloqueantes | `{ provider, videoId }` | `VideoBlock.tsx` |
| `text` | Apresentação em Markdown sanitizado | `{ markdown }` | `TextBlock.tsx` |
| `panel` | Agrupador de múltiplos blocos | `{ showCountdown }` | `PanelBlock.tsx` |
| `header` | Divisor de seção textual | `{}` | `SectionHeader.tsx` |

---

## 4. Estratégia de Isolamento Multi-Tenant

- Todo dado pertence estritamente a um `profile_id` (chave estrangeira referenciando `auth.users(id)`).
- Não há separação física de bancos; o isolamento lógico é garantido de forma transparente pela engine do PostgreSQL via **Row Level Security (RLS)**.
- Testes automatizados em `supabase/tests/dynamic_blocks.sql` validam cenários de tentativa de sequestro de dados entre tenants (*cross-tenant attacks*).
