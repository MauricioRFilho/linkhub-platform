# 🔗 LinkHub Platform (Code Cadence)

Plataforma multi-tenant de links com gerenciamento dinâmico via Supabase, painel administrativo, personalização de temas, monetização nativa com Google AdSense e suporte a domínios personalizados e subdomínios corporativos (`links.codecadence.com.br/@usuario`).

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
│   │   └── 001_initial_schema.sql  # Schema completo (5 tabelas + RLS + storage)
│   └── seed.sql                    # Seed do perfil Mauricio (migrado do data.json)
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx      # Login via Magic Link / OAuth
│   │   │   └── register/page.tsx   # Escolha de @username com validação em tempo real
│   │   ├── (dashboard)/
│   │   │   ├── dashboard/
│   │   │   │   ├── page.tsx        # Visão geral / métricas
│   │   │   │   ├── links/page.tsx  # CRUD de seções, produtos e links
│   │   │   │   ├── theme/page.tsx  # Seletor de templates, cores accent e preview
│   │   │   │   └── profile/page.tsx# Edição de nome, bio, avatar e redes sociais
│   │   │   └── layout.tsx          # Shell do painel com sidebar e auth guard
│   │   ├── [username]/
│   │   │   ├── page.tsx            # Perfil público SSR com metatags dinâmicas
│   │   │   └── ProfilePage.tsx     # Renderizador do perfil (estilo insta-links)
│   │   ├── callback/route.ts       # Handler de troca de código do Supabase Auth
│   │   ├── page.tsx                # Landing page institucional
│   │   └── layout.tsx              # Root layout
│   ├── components/
│   │   ├── ads/AdBanner.tsx        # Bloco de anúncio AdSense inferior não-intrusivo
│   │   ├── dashboard/DashboardShell.tsx
│   │   └── profile/                # Avatar, ProfileHeader, LinkCard, ProductCard, SocialBar
│   ├── lib/
│   │   ├── hooks/                  # useProfile, useLinks
│   │   ├── supabase/               # client.ts, server.ts, middleware.ts
│   │   └── utils/username.ts       # Validador e normalizador de @usernames
│   ├── middleware.ts               # Roteamento inteligente (@username e domínios)
│   └── types/database.ts           # Definição TypeScript estrita do banco
```

---

## 🛠️ Passo a Passo para Inicialização

### 1. Criar o Projeto no Supabase
1. Acesse [supabase.com](https://supabase.com) e crie um novo projeto (ex: `codecadence-links`).
2. No menu **SQL Editor**, abra o arquivo `supabase/migrations/001_initial_schema.sql` e execute o script. Ele criará:
   - Tabelas: `profiles`, `socials`, `themes`, `sections`, `meta`, `reserved_usernames`
   - Políticas RLS rigorosas (leitura pública, escrita restrita ao dono do perfil)
   - Bucket público `avatars` para upload de fotos de perfil.
   - Lista de usernames reservados (`admin`, `dashboard`, `login`, `api`, etc.).

### 2. Configurar o Seed Inicial (Seu Perfil)
1. Crie seu primeiro usuário via Supabase Auth (ou faça login no `/login`).
2. Copie o `UUID` do seu usuário no menu **Authentication > Users**.
3. Abra `supabase/seed.sql`, substitua `'YOUR_USER_UUID'` pelo seu ID e execute no SQL Editor.
4. Seu perfil estará imediatamente disponível em `http://localhost:3000/@mauricio`!

### 3. Configurar as Variáveis de Ambiente
Crie um arquivo `.env.local` na raiz com suas credenciais:

```env
# Supabase (Project Settings > API)
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key-publica

# Domínio Base da Plataforma
NEXT_PUBLIC_BASE_URL=links.codecadence.com.br

# Google AdSense (Opcional - preencher quando aprovado)
NEXT_PUBLIC_ADSENSE_CLIENT_ID=ca-pub-XXXXXXXXXXXXXXXX
NEXT_PUBLIC_ADSENSE_SLOT_ID=1234567890
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
- **Perfil Público**: [http://localhost:3000/@mauricio](http://localhost:3000/@mauricio)

---

## 🌐 Configuração de Domínio e CDN

### Subdomínio Principal (`links.codecadence.com.br`)
No seu provedor DNS (Cloudflare, Registro.br, etc.):
1. Crie um registro `CNAME`:
   - **Nome / Host**: `links`
   - **Destino**: Seu apontamento de deploy (ex: Vercel `cname.vercel-dns.com` ou Cloudflare Pages).
2. As rotas funcionarão automaticamente no formato:
   `https://links.codecadence.com.br/@seunome`

### Domínios Próprios de Terceiros (Custom Domains)
Caso um cliente/usuário compre um domínio (ex: `joaosilva.com.br`) e queira apontar para os links:
1. O usuário cria um `CNAME` apontando o domínio dele para `links.codecadence.com.br`.
2. O `middleware.ts` da plataforma detecta o `hostname` da requisição e reescreve automaticamente para o perfil correspondente associado ao domínio dele.

---

## 💰 Monetização (Google AdSense)
O componente `AdBanner.tsx` é fixado na base dos perfis públicos com efeito glassmorphism elegante:
- Quando `NEXT_PUBLIC_ADSENSE_CLIENT_ID` não está configurado, ele exibe um placeholder sutil para não quebrar o layout.
- Assim que o site for aprovado pelo Google AdSense, basta preencher as duas variáveis de ambiente e os anúncios começarão a monetizar as visualizações de links de todos os usuários da plataforma.

---

## 🧪 Validação de Compilação
O projeto foi testado e compilado com sucesso com Next.js Turbopack:
```bash
npm run build
```
Todas as rotas (`/`, `/[username]`, `/dashboard`, `/dashboard/links`, `/dashboard/theme`, `/dashboard/profile`, `/login`, `/register`) possuem verificação estrita de tipagem TypeScript e geração sob demanda.
