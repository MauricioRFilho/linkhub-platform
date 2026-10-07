# 🚀 Vercel Integration & Deployment — LinkHub Platform

Este documento detalha o gerenciamento automatizado da aplicação na **Vercel** usando o utilitário nativo [scripts/vercel.mjs](file:///c:/Users/Mauricio.filho/Documents/GitHub/linkhub-platform/scripts/vercel.mjs).

---

## 🔑 1. Configuração de Variáveis de Ambiente (`.env.local`)

Para controlar a Vercel via script sem expor senhas:

```bash
# Token de Acesso Pessoal da Vercel (https://vercel.com/account/tokens)
VERCEL_TOKEN=seu_token_da_vercel

# Identificador do projeto (gerado automaticamente no setup)
VERCEL_PROJECT_ID=prj_mbQ7doU3UE6l2iJZiwm10z73yvXZ
VERCEL_PROJECT_NAME=linkhub-platform
```

---

## 🛠️ 2. Comandos Disponíveis (`npm run vercel`)

| Comando | Descrição |
| :--- | :--- |
| `npm run vercel verify` | Valida o token e exibe dados da conta Vercel autenticada. |
| `npm run vercel projects` | Lista todos os projetos da conta com IDs, frameworks e datas. |
| `npm run vercel create-project [nome]` | Cria o projeto na Vercel (Next.js). |
| `npm run vercel add-domain [dominio]` | Vincula o subdomínio ao projeto na Vercel. |
| `npm run vercel check-domain [dominio]` | Verifica status do domínio e emissão do certificado SSL. |
| `npm run vercel sync-env` | Sincroniza as variáveis do `.env.local` diretamente na Vercel. |
| `npm run vercel setup` | Executa o fluxo completo (autenticação + criação + domínio + envs). |

---

## 🌐 3. Estado Atual da Infraestrutura

- **Projeto Vercel:** `linkhub-platform` (`prj_mbQ7doU3UE6l2iJZiwm10z73yvXZ`)
- **Conta Proprietária:** `mauriciootk` (`mauriciootaku123@gmail.com`)
- **Domínio Ativo:** `links.cadencecode.com.br`
- **DNS (Cloudflare):** CNAME `links.cadencecode.com.br` -> `cname.vercel-dns.com` (`⚪ DNS Only`)
- **Status do Domínio na Vercel:** `🟢 SIM (Pronto para tráfego)`
- **Variáveis Sincronizadas na Vercel:**
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `NEXT_PUBLIC_APP_URL` (`https://links.cadencecode.com.br`)

---

## 🚀 4. Como Fazer o Primeiro Deploy

### Opção A: Pelo GitHub (Recomendado / CI/CD Automático)
1. Acesse o painel da Vercel em [vercel.com](https://vercel.com).
2. Entre no projeto **linkhub-platform** → **Settings** → **Git**.
3. Conecte ao repositório `MauricioRFilho/linkhub-platform`.
4. A cada `git push main`, a Vercel compila e publica automaticamente com zero esforço.

### Opção B: Deploy direto via CLI
```bash
npx vercel --prod
```
