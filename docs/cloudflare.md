# ☁️ Guia de Automação Cloudflare (LinkHub Platform)

Este guia explica como usar o script `scripts/cloudflare.mjs` para gerenciar automaticamente as zonas e registros DNS do domínio `codecadence.com.br` e subdomínio `links.codecadence.com.br`.

---

## 🔑 1. Configuração de Credenciais no `.env.local`

A Cloudflare possui dois tipos de autenticação. Escolha um:

### Opção A: API Token (Recomendado e mais seguro)
1. Acesse: [dash.cloudflare.com/profile/api-tokens](https://dash.cloudflare.com/profile/api-tokens)
2. Clique em **Create Token**.
3. Escolha o template pré-configurado **Edit zone DNS** (ou crie personalizado com permissões: `Zone - DNS - Edit` e `Zone - Zone - Read`).
4. Em **Zone Resources**, selecione `Include - Specific zone - codecadence.com.br` (ou `All zones`).
5. Clique em **Continue to summary** e depois **Create Token**.
6. Copie o token gerado e coloque no seu `.env.local`:
   ```env
   CLOUDFLARE_API_KEY=seu_token_aqui
   ```

### Opção B: Global API Key
Se você estiver utilizando a Global API Key da sua conta Cloudflare, é **obrigatório** informar também o e-mail cadastrado na Cloudflare:
```env
CLOUDFLARE_EMAIL=seu-email@exemplo.com
CLOUDFLARE_API_KEY=sua_global_api_key
```

---

## 🛠️ 2. Comandos Disponíveis via Terminal

### A. Testar Autenticação
Verifica se as credenciais e permissões estão válidas na API da Cloudflare:
```bash
npm run cf verify
```

### B. Listar Zonas da Conta
Mostra todos os domínios registrados na sua conta e seus respectivos IDs:
```bash
npm run cf zones
```

### C. Listar Registros DNS
Mostra todos os apontamentos atuais (A, CNAME, TXT, MX) de `codecadence.com.br`:
```bash
npm run cf dns
```

### D. Configurar Automaticamente `links.codecadence.com.br` para Vercel
Cria ou atualiza o subdomínio `links` apontando para a Vercel com modo **DNS Only** (necessário para emissão do SSL da Vercel):
```bash
npm run cf setup-links
```

*(Opcional: se o seu destino CNAME for diferente, passe como argumento: `npm run cf setup-links outro-cname.com`)*.

### E. Limpar Cache da Cloudflare (Purge Cache)
Limpa todo o cache estático do domínio:
```bash
npm run cf purge-cache
```
