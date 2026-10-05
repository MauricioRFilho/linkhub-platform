# LinkHub — contexto, princípios e decisões de produto

**Status:** documento vivo de produto
**Criado:** 2 de outubro de 2026

Este documento registra a intenção de produto e as decisões acordadas para o LinkHub. Consulte-o antes de definir novas funcionalidades ou alterar o rumo do produto. Ele orienta decisões de produto; não substitui instruções técnicas do repositório. Diferencie sempre o que foi **decidido**, o que é uma **premissa de trabalho** e o que permanece **em aberto**.

## Visão

Criar uma página pública que organize a árvore de links de uma pessoa ou empresa e também possa funcionar como portfólio ou apresentação profissional. O LinkHub parte de uma categoria conhecida, mas deve permitir mais personalização e usos do que uma lista simples de links.

A experiência deve atender desde criadores independentes até empresas pequenas e grandes, com uma página que ajude cada usuário a apresentar sua identidade, atividade, trabalho, produtos ou serviços.

## Para quem

- **Criadores e profissionais independentes:** reunir canais, projetos, trabalhos e formas de contato em uma página própria.
- **Pequenas empresas:** apresentar marca, serviços, produtos e canais de atendimento em um lugar fácil de compartilhar.
- **Empresas de maior porte:** usar a página como apresentação institucional ou porta de entrada digital. Requisitos corporativos como equipes, várias páginas e permissões ainda precisam ser definidos.

## Princípios acordados

1. **Acesso público gratuito.** Visitar uma página publicada não exige pagamento.
2. **Começar grátis para quem cria.** Criadores podem criar, personalizar e publicar sua página sem custo. O que constitui a oferta gratuita para empresas e eventuais planos futuros ainda será decidido.
3. **Personalização sem código.** A direção do produto é permitir que usuários configurem conteúdo, identidade visual, ordem e seções sem programar. O grau de liberdade de layout e seus limites serão definidos por etapas.
4. **Uma base para pessoas e empresas.** Começar com o mesmo modelo de perfil público, sem separar o produto em experiências pessoais e empresariais. Funcionalidades específicas de organizações dependem de decisão futura.
5. **Árvore e apresentação juntas.** A página deve organizar links e, quando necessário, comunicar trabalho, marca, produtos ou serviços como um portfólio ou apresentação.

## Decisões e premissas

| Tema | Estado | Decisão |
| --- | --- | --- |
| Proposta | Decidido | Página personalizável de links que também sirva como portfólio ou apresentação. |
| Público | Decidido | Criadores, profissionais e empresas de diferentes portes. |
| Visita pública | Decidido | Páginas publicadas devem ser gratuitas para visitantes. |
| Criação por criadores | Decidido | Criar, personalizar e publicar uma página básica será gratuito. |
| Personalização | Direção acordada | Sem código, incluindo identidade visual, conteúdo, ordem e seções; o alcance do editor ainda será refinado. |
| Pessoas e empresas | Premissa inicial | Usar a mesma base de perfil; necessidades de espaços corporativos ficam para decisão futura. |
| Monetização | Em aberto | Anúncios, patrocínios, planos e outras fontes não foram aprovados como modelo de negócio. |
| Grande porte | Em aberto | A intenção é atender empresas grandes, mas recursos de equipe, múltiplos perfis, permissões e requisitos corporativos ainda não estão definidos. |

## Estado descrito no repositório

Estas observações registram documentação e estruturas existentes; não são promessas de produto nem substituem validação funcional.

- O README descreve autenticação, um perfil por usuário, links e seções, redes sociais, temas e metadados.
- O README menciona Google AdSense e inclui um componente de anúncio com configuração por variáveis de ambiente. Isso não decide a política de anúncios nem confirma receita ativa.
- Domínios próprios aparecem na documentação, mas o próprio README informa que o roteamento pelo domínio ainda precisa ser implementado. O suporte e suas regras permanecem em aberto.
- A migration inicial representa o modelo de perfil individual. Ela não define espaços de organização, colaboração em equipe ou múltiplos perfis por empresa.

## Questões para decisões futuras

- Qual é o conjunto mínimo de opções de personalização da primeira versão e até onde vai a liberdade de layout?
- A oferta gratuita para empresas será igual à de criadores? Haverá limites ou recursos pagos?
- Qual modelo de receita, se algum, preserva uma boa experiência nas páginas públicas?
- Como uma empresa deve administrar uma ou várias páginas? Quando entram membros, funções e permissões?
- Quais recursos e garantias são necessários para atender empresas de grande porte?
- Domínios próprios serão oferecidos? Para quais perfis, com qual processo de configuração e quais regras?

## Registro de decisões

- **2026-10-02 — Direção inicial:** registrar a intenção de atender criadores e empresas com páginas gratuitas para visitantes, gratuitas para criação básica por criadores, e personalizáveis sem código. Começar com uma base compartilhada de perfis; deixar monetização e recursos organizacionais em aberto.
