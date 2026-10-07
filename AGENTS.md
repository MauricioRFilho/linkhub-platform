<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# 🤖 LinkHub — Guia Operacional para Agentes de IA & Engenheiros

> **Instrução Primária:** Antes de propor alterações, leia [context.md](file:///c:/Users/Mauricio.filho/Documents/GitHub/linkhub-platform/context.md) e os documentos em [docs/](file:///c:/Users/Mauricio.filho/Documents/GitHub/linkhub-platform/docs/). Nunca adivinhe nomes de colunas, tabelas ou variáveis. Respeite sempre as regras de segurança (RLS) e integridade de tipos.

---

## 🏛️ 1. Visão Geral da Arquitetura

LinkHub é uma plataforma multi-tenant de páginas públicas dinâmicas de links, produtos de afiliados, cupons de desconto, canais de comunidade e apresentações profissionais.

- **Frontend & SSR:** [Next.js 16](https://nextjs.org) (App Router com Turbopack), React 19, TypeScript strict mode.
- **Estilização & Design System:** Tailwind CSS v4 + Vanilla CSS Tokens HSL com suporte a temas (Classic, Minimal, Bold, Neon, Editorial).
- **Backend & Banco de Dados:** [Supabase](https://supabase.com) (PostgreSQL 17 com Row-Level Security completo, Auth SSR e Storage de avatares).
- **Analytics:** Coleta anônima de cliques e conversões (sem cookies, sem IPs persistidos — LGPD-friendly) via `POST /api/click` e `navigator.sendBeacon`.

---

## 🧭 2. Estrutura de Diretórios Crítica

```
src/
├── app/
│   ├── (auth)/                # Rotas públicas de login e registro
│   ├── (dashboard)/           # Rotas autenticadas protegidas pelo proxy
│   │   ├── dashboard/links/   # Gestão de blocos, painéis, presets e agendamento
│   │   └── dashboard/analytics/# Painel visual de métricas de conversão
│   ├── [username]/            # Página pública com SSR dinâmico e SEO
│   ├── api/click/             # Endpoint anônimo de tracking de cliques e cópias
│   └── globals.css            # Tokens CSS do tema (--bg, --text, --accent, etc.)
├── components/
│   ├── blocks/                # Renderizadores públicos de blocos (Coupon, Community, Panel, etc.)
│   ├── dashboard/blocks/      # Formulários e modais administrativos (BlockEditorForm, PresetModal)
│   └── profile/               # Elementos estáticos do perfil (Avatar, Header, SocialBar, Footer)
├── lib/
│   ├── blocks/                # Núcleo de lógica pura: validação, agendamento, markdown, árvore e presets
│   ├── analytics/             # Utilitário client-side de tracking (trackBlock)
│   ├── supabase/              # Clientes Supabase SSR (client.ts, server.ts, proxy.ts)
│   └── utils/                 # Validação de segurança de URLs (isSafeProfileLink, safeImageSource)
└── types/
    └── database.ts            # Tipagem TypeScript estrita gerada do esquema do Supabase
```

---

## 🛡️ 3. Regras de Ouro e Diretrizes Técnicas

### A. Segurança em Primeiro Lugar (P0)
1. **Row-Level Security (RLS):**
   - NUNCA desative RLS em nenhuma tabela.
   - A tabela `sections` possui política restritiva: visitantes anônimos só visualizam blocos que estejam ativos E dentro da janela de agendamento (`starts_at` no passado e `ends_at` no futuro ou nulos).
2. **Prevenção de XSS:**
   - NUNCA use `dangerouslySetInnerHTML`.
   - Blocos de texto Markdown utilizam o parser sanitizado em [src/lib/blocks/markdown.ts](file:///c:/Users/Mauricio.filho/Documents/GitHub/linkhub-platform/src/lib/blocks/markdown.ts), convertendo tokens em elementos React nativos.
3. **Validação de URLs e Protocolos:**
   - Valide sempre URLs com [isSafeProfileLink](file:///c:/Users/Mauricio.filho/Documents/GitHub/linkhub-platform/src/lib/utils/public-url.ts). Rejeite `javascript:`, data URIs e strings formatadas maliciosamente.
   - Embeds de vídeo são restritos à lista de permissão (YouTube e TikTok) via [parseVideoUrl](file:///c:/Users/Mauricio.filho/Documents/GitHub/linkhub-platform/src/lib/blocks/config.ts).

### B. Extensibilidade de Novos Blocos
Para adicionar um novo tipo de bloco, siga o padrão unificado:
1. Registre o tipo no enum `SectionTypeValue` em [src/types/database.ts](file:///c:/Users/Mauricio.filho/Documents/GitHub/linkhub-platform/src/types/database.ts) e na constraint da migration.
2. Adicione a interface e validador específico em [src/lib/blocks/config.ts](file:///c:/Users/Mauricio.filho/Documents/GitHub/linkhub-platform/src/lib/blocks/config.ts).
3. Crie o componente visual público em `src/components/blocks/`.
4. Plugue o renderizador no [BlockRenderer.tsx](file:///c:/Users/Mauricio.filho/Documents/GitHub/linkhub-platform/src/components/blocks/BlockRenderer.tsx).
5. Adicione os campos no [BlockEditorForm.tsx](file:///c:/Users/Mauricio.filho/Documents/GitHub/linkhub-platform/src/components/dashboard/blocks/BlockEditorForm.tsx).

---

## 🧪 4. Comandos e Quality Gates

Execute sempre estes comandos para validação local antes de finalizar qualquer tarefa:

```bash
# 1. Testes unitários puros (regras de validação, URLs, markdown, árvore e agendamento)
npm run test:unit

# 2. Verificação estática e linter (zero warnings permitidos)
npm run lint

# 3. Build de produção e verificação de tipagem completa do Next.js
npm run build
```

---

## 📚 5. Documentos de Referência

- [context.md](file:///c:/Users/Mauricio.filho/Documents/GitHub/linkhub-platform/context.md) — Visão de negócio, princípios e histórico de decisões.
- [docs/architecture.md](file:///c:/Users/Mauricio.filho/Documents/GitHub/linkhub-platform/docs/architecture.md) — Diagramas e arquitetura técnica detalhada.
- [docs/contracts.md](file:///c:/Users/Mauricio.filho/Documents/GitHub/linkhub-platform/docs/contracts.md) — Contratos de tipos, payloads de API e esquemas de dados.
- [docs/links.md](file:///c:/Users/Mauricio.filho/Documents/GitHub/linkhub-platform/docs/links.md) — Documentações oficiais e links de referência externa.
