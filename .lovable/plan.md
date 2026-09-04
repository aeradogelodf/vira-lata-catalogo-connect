# Home V2 — Refresh visual

## Objetivo
Atualizar somente a apresentação da Home para deixá-la mais moderna, organizada e direta para catálogo e WhatsApp, mantendo integralmente dados, consultas, SEO e comportamentos existentes.

## Alterações previstas
- Reorganizar a Home na ordem: Hero, banners, categorias, destaques e informações da loja.
- Reformular a primeira dobra com maior presença da marca, título/subtítulo existentes e dois botões principais: “Ver catálogo” e “Falar no WhatsApp” com ícone.
- Manter o `BannerCarousel` e ajustar apenas seu espaçamento para conectá-lo visualmente ao Hero.
- Refinar os cards de categorias com alinhamento, hierarquia e transições discretas, sem mudar seus links.
- Manter os produtos `featured` no `ProductCard`, preservando favoritos e WhatsApp, alterando somente ritmo e hierarquia da seção.
- Mover as informações da loja para o final em um card institucional único com endereço, horários, telefone quando disponível e botão de WhatsApp, tudo vindo de `store_settings`.
- Retirar da Home os blocos repetitivos de promoções, serviços, CTAs auxiliares e “Como funciona”, sem alterar essas funcionalidades ou suas páginas próprias.

## Detalhes técnicos
- Alterar apenas `src/routes/index.tsx` e, se necessário, classes de espaçamento em `src/components/home/BannerCarousel.tsx`.
- Reutilizar `Button`, `ProductCard`, `BannerCarousel`, `useStore`, consultas existentes e tokens semânticos atuais.
- Não alterar carregamento, cache, consultas, SEO, banco, autenticação, Storage, RLS ou lógica comercial.
- Usar somente classes baseadas nos tokens existentes; nenhuma nova biblioteca.
- Preservar `aria-label`, textos alternativos, foco visível e redução de movimento.

## Validação
- Executar verificações automáticas do projeto.
- Conferir a Home em 390 px, tablet e desktop, sem overflow.
- Validar navegação para catálogo, URL do WhatsApp, carrossel, categorias, destaques e informações da loja.
- Confirmar console sem erros.
