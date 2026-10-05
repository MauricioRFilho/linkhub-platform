# 🔗 LinkHub Platform (Code Cadence)

Plataforma de páginas públicas personalizáveis para reunir links, apresentar portfólios e divulgar pessoas ou empresas. Usa Next.js e Supabase para autenticação, conteúdo e temas.

---

## 🚀 Tecnologias

- **Framework**: [Next.js 16 (App Router + Turbopack)](https://nextjs.org)
- **Linguagem**: TypeScript
- **Banco de Dados & Autenticação**: [Supabase](https://supabase.com) (PostgreSQL com Row-Level Security, Auth Magic Link/OAuth e Storage)
- **Estilização**: Tailwind CSS v4 + Vanilla CSS Design System
- **Animações**: Framer Motion
- **Ícones**: Lucide React + Inline Brand SVGs

---

## 📂 Estrutura do Projeto

```
linkhub-platform/
├── supabase/
│   ├── migrations/
│   │   ├── 20261002120000_initial_schema.sql  # 6 tabelas + RLS + storage
│   │   └── 20261002130000_add_editorial_theme.sql
│   └── seed.sql                    # Exemplo opcional de perfil para desenvolvimento
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx      # Login via Magic Link / OAuth
│   │   │   ├── register/page.tsx   # Escolha de @username com validação em tempo real
│   │   │   └── callback/route.ts   # Handler de troca de código do Supabase Auth
│   │   ├── (dashboard)/
│   │   │   ├── dashboard/
│   │   │   │   ├── page.tsx        # Visão geral do perfil
│   │   │   │   ├── links/page.tsx  # CRUD de seções, produtos e links
│   │   │   │   ├── theme/page.tsx  # Seletor de templates, cores accent e preview
│   │   │   │   └── profile/page.tsx# Edição de perfil, redes sociais e metadados
│   │   │   └── layout.tsx          # Shell do painel com sidebar e auth guard
│   │   ├── [username]/
│   │   │   ├── page.tsx            # Perfil público SSR com metatags dinâmicas
│   │   │   └── ProfilePage.tsx     # Renderizador do perfil (estilo insta-links)
│   │   ├── page.tsx                # Landing page institucional
│   │   └── layout.tsx              # Root layout
│   ├── components/
│   │   ├── profile/AdBanner.tsx    # Componente documentado, não exibido
│   │   ├── dashboard/DashboardShell.tsx
│   │   └── profile/                # Avatar, ProfileHeader, LinkCard, ProductCard, SocialBar
│   ├── lib/
│   │   ├── hooks/                  # useProfile, useLinks
│   │   ├── supabase/               # client.ts, server.ts, proxy.ts, config.ts
│   │   └── utils/                  # Validação de nomes e URLs públicos
│   ├── proxy.ts               # Renovação de sessão e roteamento @username
│   └── types/database.ts           # Definição TypeScript estrita do banco
```

---

## 🛠️ Passo a Passo para Inicialização

### 1. Criar o Projeto no Supabase
1. Acesse [supabase.com](https://supabase.com) e crie um novo projeto (ex: `codecadence-links`).
2. Aplique a migration pela CLI, seguindo [supabase/README.md](supabase/README.md). Ela criará:
   - Tabelas: `profiles`, `socials`, `themes`, `sections`, `meta`, `reserved_usernames`
   - Políticas RLS rigorosas (leitura pública, escrita restrita ao dono do perfil)
   - Bucket público `avatars` para upload de fotos de perfil.
   - Lista de usernames reservados (`admin`, `dashboard`, `login`, `api`, etc.).
   - Cinco templates visuais: Classic, Minimal, Bold, Neon e Editorial.

### 2. Configurar o Seed Inicial (Seu Perfil)
1. Crie seu primeiro usuário via Supabase Auth (ou faça login no `/login`).
2. Copie o `UUID` do seu usuário no menu **Authentication > Users**.
3. Abra `supabase/seed.sql`, substitua `'YOUR_USER_UUID'` pelo seu ID e execute no SQL Editor.
4. O seed de exemplo usa `@mauriciootk`, disponível em `http://localhost:3000/@mauriciootk`.

### 3. Configurar as Variáveis de Ambiente
Crie um arquivo `.env.local` na raiz com suas credenciais:

```env
# Supabase (Project Settings > API)
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sua-chave-publica

# Host base usado nos metadados (opcional, sem protocolo)
NEXT_PUBLIC_BASE_URL=links.codecadence.com.br
```

### 4. Executar Localmente
```bash
npm install
npm run dev
```

Acesse:
- **Landing Page**: [http://localhost:3000](http://localhost:3000)
- **Login / Criar Perfil**: [http://localhost:3000/login](http://localhost:3000/login)
- **Painel Administrativo**: [http://localhost:3000/dashboard](http://localhost:3000/dashboard)
- **Perfil Público**: [http://localhost:3000/@mauriciootk](http://localhost:3000/@mauriciootk) (depois de executar o seed)

---

## Domínios e anúncios

Perfis públicos usam o caminho `/@usuario` no host configurado para a aplicação. Roteamento por domínio próprio ainda não foi implementado.

`AdBanner.tsx` permanece no repositório como componente documentado, mas não é renderizado nas páginas públicas. Anúncios e monetização continuam em aberto; não há anúncios ativos.

---

## 🧪 Validação

Execute os gates locais antes de integrar mudanças:
```bash
npm run lint
npm test
npm run build
```

`npm test` executa testes unitários de nomes, URLs públicas e redirecionamento do callback, além da validação das migrations e RLS. O teste de banco requer Docker. Essa suíte não valida entrega de Magic Link nem configuração do provedor Google. Veja [supabase/README.md](supabase/README.md) para os limites e o estado do banco remoto.

Consulte [context.md](context.md) para a visão do produto, decisões confirmadas e questões em aberto.
