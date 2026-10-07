# LinkHub — Contexto, Princípios e Decisões de Produto

**Status:** Documento vivo de produto  
**Última Atualização:** 7 de outubro de 2026  
**Responsável Técnico:** Jarvis (Assistente de Engenharia Sênior) & Mauricio Filho  

Este documento registra a intenção de produto e as decisões acordadas para o LinkHub. Consulte-o antes de definir novas funcionalidades ou alterar o rumo da plataforma. Diferencie sempre o que foi **decidido**, o que é uma **premissa de trabalho** e o que permanece **em aberto**.

---

## 🎯 1. Visão do Produto

O **LinkHub** é uma plataforma que vai além de uma árvore estática de links. Ela funciona como o ponto focal digital de criadores independentes, afiliados, profissionais e empresas, permitindo construir **páginas de alta conversão, portfólios e apresentações profissionais de forma 100% dinâmica e autônoma**, sem necessidade de código ou deploys adicionais.

O criador deve ter liberdade para recomendar produtos com cupons promocionais em períodos específicos (ex: "oferta válida só esta semana"), engajar visitantes em suas comunidades (WhatsApp, Discord, Telegram), exibir vídeos e divulgar seus serviços com métricas claras de desempenho.

---

## 👥 2. Públicos-Alvo

- **Criadores de Conteúdo & Afiliados:** Recomendar produtos, cupons exclusivos com cópia em 1 clique, vídeos recentes e atrair membros para comunidades exclusivas.
- **Profissionais Independentes:** Reunir portfólio, projetos em destaque, agendamento de reuniões e canais de contato direto.
- **Pequenas e Médias Empresas:** Apresentar a marca, serviços, canais de atendimento e produtos em um link unificado e elegante para a bio das redes sociais.
- **Empresas de Maior Porte:** Portal institucional de entrada com múltiplos canais e departamentos (recursos multi-equipe planejados para etapas futuras).

---

## ⚖️ 3. Princípios Inegociáveis

1. **Acesso Público Gratuito:** Qualquer visitante pode acessar e interagir com as páginas públicas sem fricção ou login.
2. **Personalização Sem Código:** Todo o conteúdo (blocos, painéis, layouts, cores de destaque, fotos e dados) é gerenciado pelo próprio usuário no painel administrativo.
3. **Privacidade e Conformidade (LGPD-Friendly):** Métricas de cliques e conversão são coletadas de forma estritamente anônima (sem cookies de terceiros, sem fingerprinting, sem persistência de endereços IP).
4. **Segurança por Padrão (Zero Trust):** Políticas rigorosas de Row-Level Security (RLS) garantem que dados ocultos ou agendados para o futuro jamais vazem pela API pública.
5. **Performance e Resiliência:** Zero carregamento bloqueante de recursos externos (ex: iframes de vídeo utilizam facades leves e só carregam sob demanda).

---

## 📊 4. Matriz de Decisões e Premissas

| Tema | Estado | Decisão |
| :--- | :--- | :--- |
| **Proposta de Valor** | Decidido | Página dinâmica de links, afiliados, portfólio e apresentação com múltiplos formatos de bloco. |
| **Arquitetura de Blocos** | Decidido | Modelo unificado baseado na tabela `sections` com `parent_id` (painéis) e `config` tipado via JSONB. |
| **Layouts de Painel** | Decidido | Suporte nativo aos formatos: Spotlight (destaque com brilho), Grid (grade 2 colunas), Carousel (deslizável com scroll-snap) e List (vertical). |
| **Agendamento** | Decidido | Publicação (`starts_at`) e expiração (`ends_at`) automáticas, com atalho de 1 clique "Válido até o fim desta semana". |
| **Modelos Prontos (Presets)** | Decidido | Presets de 1 clique para Afiliados (Achado da semana), Criadores de Conteúdo e Empresas. |
| **Analytics** | Decidido | Rastreamento anônimo assíncrono via `navigator.sendBeacon` e RPC restrita `track_click`. |
| **Formatação de Texto** | Decidido | Markdown seguro e sanitizado, sem injeção direta de HTML cru. |
| **Monetização da Plataforma** | Em aberto | Planos Pro/Enterprise, taxas sobre vendas ou temas premium permanecem para definição posterior. |
| **Domínios Próprios** | Em aberto | Mapeamento de CNAME customizado por perfil planejado para fase posterior. |
| **Workspaces Multi-Membro** | Em aberto | Colaboração em equipe e permissões corporativas ficam para versão futura. |

---

## 📜 5. Histórico e Registro de Decisões

- **2026-10-02 — Fundação da Plataforma:**
  - Definição do escopo inicial: Next.js App Router, Supabase Auth (Magic Link), temas clássicos e perfil único por usuário.
- **2026-10-07 — Plataforma 100% Dinâmica, Presets e Analytics:**
  - Evolução da estrutura de `sections` para comportar múltiplos tipos de blocos (`link`, `product`, `coupon`, `community`, `video`, `text`, `header`, `panel`).
  - Suporte a agrupadores (Painéis) com layouts variados e contagem regressiva para promoções.
  - Implementação de presets prontos por nicho para onboarding instantâneo.
  - Correção de segurança na política RLS para impedir vazamento de blocos agendados antes da data de lançamento.
  - Adição de infraestrutura de analytics anônimo com painel visual de conversão.
- **2026-10-07 — Go-Live em Produção (`links.cadencecode.com.br`):**
  - Configuração do subdomínio `links.cadencecode.com.br` no DNS da Cloudflare (`cname.vercel-dns.com` em DNS Only) via `scripts/cloudflare.mjs`.
  - Provisionamento automático de projeto e associação de domínio na Vercel via REST API (`scripts/vercel.mjs`).
  - Deploy em produção concluído com status `READY` e SSL ativo.
  - Ponto pendente de Auth documentado em [docs/auth-setup.md](file:///c:/Users/Mauricio.filho/Documents/GitHub/linkhub-platform/docs/auth-setup.md): habilitar provider Google no Supabase ou utilizar Magic Link por e-mail com as Redirect URLs configuradas.

---

## 🔮 6. Próximos Passos (Backlog Estratégico)

1. **Configuração de Auth Supabase:** Concluir ativação do Google OAuth ou testar fluxo com Magic Link em produção.
2. **Reordenação Drag-and-Drop:** Adicionar biblioteca visual para arrastar blocos entre painéis no dashboard.
3. **Upload Direto de Mídia:** Permitir upload de imagens de capa e miniaturas diretamente para o bucket do Supabase Storage.
4. **Relatórios Semanais Automatizados:** Notificação por e-mail com resumo semanal de cliques e cupons mais copiados.

