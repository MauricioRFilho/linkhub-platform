# 🔐 Guia de Configuração de Autenticação — Supabase Auth

Este documento detalha a configuração necessária de autenticação no Supabase para o **LinkHub** operar em produção (`https://links.cadencecode.com.br`) e em desenvolvimento local (`http://localhost:3000`).

---

## ⚠️ 1. Resolução do Erro: "Unsupported provider: provider is not enabled"

```json
{"code":400,"error_code":"validation_failed","msg":"Unsupported provider: provider is not enabled"}
```

Este erro ocorre quando o usuário clica no botão **"Continuar com o Google"**, mas o provedor Google **não foi habilitado** no painel de controle do Supabase.

---

## 🚀 2. Métodos de Acesso Disponíveis

O LinkHub suporta dois métodos nativos de autenticação:

### Método A: Magic Link / OTP por E-mail (Acesso Imediato)
- **Não exige configuração externa (Google Cloud, etc.).**
- O usuário digita o e-mail no formulário e clica em **"Enviar link de acesso"**.
- O Supabase envia um e-mail com link de acesso com token único.
- **Requisito Obrigatório:** As Redirect URLs devem estar configuradas no Supabase (ver Seção 3).

### Método B: Google OAuth (Login com 1 Clique)
Permite login direto com a conta Google. Requer configuração de credenciais no Google Cloud Console e no Supabase (ver Seção 4).

---

## 🌐 3. Configuração Obrigatória de URLs no Supabase

Para que o redirecionamento pós-login funcione tanto em produção quanto em localhost:

1. Acesse o painel do Supabase: [supabase.com/dashboard/project/dnzmcgeuhblxrlpvbcmz](https://supabase.com/dashboard/project/dnzmcgeuhblxrlpvbcmz)
2. Vá em **Authentication** → **URL Configuration**.
3. Configure o campo **Site URL**:
   ```text
   https://links.cadencecode.com.br
   ```
4. Na lista de **Redirect URLs**, adicione todas as seguintes URLs:
   - `https://links.cadencecode.com.br/**`
   - `https://links.cadencecode.com.br/callback`
   - `http://localhost:3000/**`
   - `http://localhost:3000/callback`
5. Clique em **Save changes**.

---

## 🔑 4. Como Ativar o Google OAuth (Passo a Passo)

### Passo 1: Obter a Callback URL do Supabase
1. No painel do Supabase → **Authentication** → **Providers** → selecione **Google**.
2. Copie o campo **Callback URL (for OAuth)**. O formato é:
   ```text
   https://dnzmcgeuhblxrlpvbcmz.supabase.co/auth/v1/callback
   ```

### Passo 2: Criar Credenciais no Google Cloud Console
1. Acesse: [console.cloud.google.com/apis/credentials](https://console.cloud.google.com/apis/credentials)
2. Selecione ou crie um projeto (ex: *LinkHub* ou *Cadence Code*).
3. Vá em **OAuth consent screen**:
   - Tipo de usuário: **External**.
   - Preencha o nome do App (*LinkHub*), e-mail de suporte e dados do desenvolvedor.
4. Vá em **Credentials** → **Create Credentials** → **OAuth client ID**:
   - Application type: **Web application**.
   - Name: *LinkHub Web Client*.
   - **Authorized JavaScript origins**:
     - `https://links.cadencecode.com.br`
     - `https://dnzmcgeuhblxrlpvbcmz.supabase.co`
     - `http://localhost:3000`
   - **Authorized redirect URIs**:
     - `https://dnzmcgeuhblxrlpvbcmz.supabase.co/auth/v1/callback`
5. Clique em **Create**. Copie o **Client ID** e o **Client Secret** gerados.

### Passo 3: Salvar no Supabase
1. Volte ao painel do Supabase em **Authentication** → **Providers** → **Google**.
2. Marque o switch **Enable Google provider**.
3. Cole o **Client ID** e o **Client Secret**.
4. Clique em **Save**.

---

## 💻 5. Checklist para Nova Máquina (Handover)

Ao trocar de computador e clonar o repositório, siga este checklist para retomar o trabalho:

```bash
# 1. Clonar o repositório
git clone https://github.com/MauricioRFilho/linkhub-platform.git
cd linkhub-platform

# 2. Instalar dependências
npm install

# 3. Criar o arquivo .env.local com suas chaves:
```

### Modelo de `.env.local` necessário:
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://dnzmcgeuhblxrlpvbcmz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_anon_key
NEXT_PUBLIC_APP_URL=https://links.cadencecode.com.br

# Cloudflare (scripts/cloudflare.mjs)
CLOUDFLARE_API_KEY=seu_token_ou_key
CLOUDFLARE_EMAIL=seu_email@exemplo.com # Opcional se usar API Token

# Vercel (scripts/vercel.mjs)
VERCEL_TOKEN=seu_token_da_vercel
VERCEL_PROJECT_ID=prj_mbQ7doU3UE6l2iJZiwm10z73yvXZ
VERCEL_PROJECT_NAME=linkhub-platform
```

### Comandos de Validação Rápida na Nova Máquina:
```bash
# Testar integridade de código e testes
npm run test:unit
npm run lint

# Checar conexão com Cloudflare
npm run cf verify

# Checar status e deploys na Vercel
npm run vercel status
```

### Aplicar Migration de Blocos Dinâmicos no Supabase:
Se o banco remoto ainda não tiver a tabela de blocos dinâmicos (`sections`), execute a migration:
1. Abra o painel do Supabase → **SQL Editor**;
2. Execute o conteúdo do arquivo [supabase/migrations/20261007120000_dynamic_blocks.sql](file:///c:/Users/Mauricio.filho/Documents/GitHub/linkhub-platform/supabase/migrations/20261007120000_dynamic_blocks.sql).
