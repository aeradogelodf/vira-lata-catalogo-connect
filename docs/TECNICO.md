# Documentação técnica — Agropet Vira Lata Oficial

## Arquitetura

- **TanStack Start v1** (React 19 + Vite 7), SSR em runtime edge.
- Rotas por arquivo em `src/routes`; rotas privadas sob `src/routes/_authenticated`.
- Lógica de servidor via `createServerFn` (`src/lib/*.functions.ts`). Não há
  edge functions nem checkout/gateway: o fluxo comercial termina no WhatsApp.
- Dados de leitura pública via cliente Supabase do navegador; mutações sempre
  por server functions autenticadas.

## Banco de dados (Lovable Cloud / Postgres)

Tabelas em `public`:

| Tabela | Função |
| --- | --- |
| `categories` | Categorias do catálogo (slug único, `active`) |
| `brands` | Marcas (slug único, `active`) |
| `products` | Produtos: preço, `old_price`, `on_sale`, `featured`, `stock`, `active` |
| `product_images` | Galeria por produto (ordem, principal) |
| `services` | Serviços (banho e tosa etc.), preço, ordem, `featured`, `active` |
| `banners` | Campanhas da Home: imagem, CTA, tipo/valor de link, ordem |
| `store_settings` | Registro único com dados institucionais (fonte de verdade) |
| `user_roles` | Papéis (`app_role`), base do RBAC |

Funções: `has_role(uuid, app_role)` (SECURITY DEFINER, execução revogada de
`anon`/`authenticated`) e `is_admin()` (SECURITY INVOKER), usada por policies
e server functions.

## RLS e RBAC

- RLS habilitada em todas as tabelas de `public`.
- Leitura pública restrita a linhas `active = true` (produtos, categorias,
  marcas, serviços, banners, imagens de produtos ativos).
- Mutação: policies `FOR ALL TO authenticated USING (is_admin())`.
- `user_roles`: cada usuário só lê os próprios papéis.
- `store_settings`: leitura pública limitada por `GRANT` em colunas
  institucionais; colunas internas não são expostas.
- Verificado por teste: `anon` recebe `permission denied` em INSERT de
  produtos e em `select *` de `store_settings`/`user_roles`.

## Storage

- Bucket **privado** `product-images`, com prefixos por domínio
  (produtos, `servicos/`, banners).
- Leitura anônima permitida apenas para objetos referenciados por produto,
  serviço ou banner **ativo**; admin tem acesso total.
- Entrega no site por **signed URLs** (validade ~1h; `staleTime` das queries
  fica abaixo disso para evitar links expirados).
- Exclusão de produto, imagem de produto, serviço e banner remove o arquivo
  correspondente do Storage.

## Autenticação

- E-mail/senha (Supabase Auth), sem cadastro anônimo.
- Gate em `src/routes/_authenticated/route.tsx` (`ssr: false`) redireciona
  para `/login`.
- Server functions usam `requireSupabaseAuth`; o token é anexado pelo
  `functionMiddleware` em `src/start.ts`.
- Autorização real acontece no servidor (`is_admin()`), nunca no cliente.

## Fluxo de dados

`Componente → TanStack Query (queryOptions em src/lib/*-queries.ts) →
fetcher (src/data/*) ou server function (src/lib/*.functions.ts) → Supabase`.

Cache: `staleTime` global 30s, `gcTime` 10min; produtos 1min, taxonomia
5min, loja/banners 60s.

## Design System

- Tailwind v4 via `src/styles.css`: tokens `oklch`, tipografia Baloo 2 +
  Nunito Sans, utilitários `container-page`/`surface-card`, shadcn/ui.
- Sem cores hardcoded nos componentes; bloco global de
  `prefers-reduced-motion`.

## SEO

- `src/lib/site.ts` centraliza a URL canônica.
- `head()` por rota com title/description/OG/Twitter únicos; `noindex` nas
  rotas administrativas.
- JSON-LD: `LocalBusiness` (dinâmico via `store_settings`), `Product`,
  `Service` e `BreadcrumbList`.
- `src/routes/sitemap[.]xml.ts` gera sitemap dinâmico; `public/robots.txt`
  bloqueia `/admin`, `/login`, `/redefinir-senha` e `/favoritos`.

## Dependências principais

`@tanstack/react-start`, `@tanstack/react-router`, `@tanstack/react-query`,
`@supabase/supabase-js`, `zod`, `react-hook-form`, `tailwindcss`,
`embla-carousel-react`, `lucide-react`, `sonner`.
