# 🌐 Guia de Configuração de Domínios Próprios (LinkHub Platform)

Este guia orienta engenheiros e usuários sobre como conectar um domínio próprio (ex: `seudominio.com.br`) ao perfil na plataforma **LinkHub**, permitindo utilizá-lo como o link oficial da bio no Instagram e TikTok.

---

## 🏗️ 1. Como Funciona a Arquitetura de Domínios

```
[ Visitante acessa seudominio.com.br ]
                  │
                  ▼
          [ DNS do Provedor ]
        (Cloudflare / Registro.br)
                  │
                  ▼
          [ Vercel Edge Network ]
          (Emissão SSL / TLS)
                  │
                  ▼
         [ proxy.ts (Next.js) ]
  1. Identifica o Host da requisição
  2. Consulta cache / RPC resolve_custom_domain
  3. Reescreve internamente "/" -> "/@seu-usuario"
  4. Redireciona "/dashboard" e "/login" para o domínio mestre
```

---

## 📋 2. Registros DNS Necessários

Para que seu domínio funcione e emita o certificado de segurança SSL automaticamente, você deve adicionar 3 registros na zona DNS onde o domínio foi adquirido:

| Tipo | Nome / Host | Valor / Destino | Finalidade |
| :--- | :--- | :--- | :--- |
| **TXT** | `_linkhub` | `<token_gerado_no_dashboard>` | Comprova que você é o dono legítimo do domínio (anti-sequestro). |
| **A** | `@` (raiz) | `76.76.21.21` | Aponta o domínio raiz (`seudominio.com.br`) para os servidores da Vercel. |
| **CNAME** | `www` | `cname.vercel-dns.com` | Garante que visitantes que digitarem `www.seudominio.com.br` também acessem seu perfil. |

---

## ☁️ 3. Dica Crítica para Usuários da Cloudflare

Se o seu domínio estiver gerenciado na **Cloudflare**:
- Ao criar os registros **A** e **CNAME**, **DESATIVE A NUVEM LARANJA** (mude de "Proxied" para **"DNS Only" / Nuvem Cinza**).
- **Por que isso é obrigatório?** A Vercel precisa se comunicar diretamente com o seu domínio via desafio ACME para emitir e renovar o certificado SSL gratuito. A nuvem laranja da Cloudflare intercepta o tráfego e bloqueia essa emissão.

---

## 🇧🇷 4. Dica para Usuários do Registro.br ou GoDaddy

- O **Registro.br** não permite registros CNAME no domínio apex (raiz).
- Por isso, no campo "Nome" vazio ou `@`, selecione **Tipo A** e aponte para `76.76.21.21`.
- Para o subdomínio `www`, crie um registro **Tipo CNAME** com destino `cname.vercel-dns.com`.

---

## 🔒 5. Segurança Multi-Tenant (Proteção contra Sequestro)

- **Token de Verificação Único:** Um domínio só pode ser ativado na plataforma se o registro TXT `_linkhub` estiver configurado e validado. Isso impede que outro usuário mal-intencionado adicione seu domínio na conta dele para tentar roubar seus cliques.
- **Isolamento de Escopo:** Em um domínio próprio, apenas a raiz (`/`) e os assets públicos são servidos. Qualquer tentativa de acessar `/@outro-usuario` em um domínio customizado retorna `404 Not Found`.
- **Rotas de Administração:** Rotas como `/dashboard` e `/login` são automaticamente redirecionadas com código `308 Permanent Redirect` para o domínio oficial da plataforma, preservando a segurança das sessões e cookies de autenticação.
