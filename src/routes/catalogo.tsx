import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { PackageSearch, SlidersHorizontal, Search, X } from "lucide-react";
import { useMemo, useState } from "react";

import { CatalogFilterPanel } from "@/components/catalog/CatalogFilterPanel";
import { EmptyState } from "@/components/catalog/EmptyState";
import { ProductCard, ProductCardSkeleton } from "@/components/catalog/ProductCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useStore } from "@/hooks/use-store";
import { catalogQueries } from "@/lib/catalog-queries";
import {
  applyCatalog,
  buildIndexes,
  hasActiveFilters,
  initialCatalogState,
  isPromotion,
  type CatalogState,
  type SortOption,
} from "@/lib/catalog";

import { SITE_URL as SITE } from "@/lib/site";

export const Route = createFileRoute("/catalogo")({
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(catalogQueries.products()),
      context.queryClient.ensureQueryData(catalogQueries.categories()),
      context.queryClient.ensureQueryData(catalogQueries.brands()),
    ]);
  },
  pendingComponent: CatalogPending,
  head: () => ({
    meta: [
      { title: "Catálogo de produtos — Agropet Vira Lata" },
      {
        name: "description",
        content:
          "Navegue pelo catálogo da Agropet Vira Lata: rações, acessórios e produtos para pets em Ceilândia Sul, Brasília — DF.",
      },
      { property: "og:title", content: "Catálogo de produtos — Agropet Vira Lata" },
      {
        property: "og:description",
        content: "Produtos para pets e agropecuária com atendimento pelo WhatsApp.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${SITE}/catalogo` },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: `${SITE}/catalogo` }],
  }),
  component: CatalogoPage,
});

function CatalogPending() {
  return (
    <div className="container-page py-10">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

const sortLabels: Record<SortOption, string> = {
  relevance: "Relevância",
  "name-asc": "Nome A–Z",
  "name-desc": "Nome Z–A",
  "price-asc": "Menor preço",
  "price-desc": "Maior preço",
  promo: "Promoções primeiro",
};

function CatalogoPage() {
  const store = useStore();
  const { data: allProducts } = useSuspenseQuery(catalogQueries.products());
  // Comportamento configurável em /admin/configuracoes.
  const products = useMemo(
    () =>
      store.catalog.hideOutOfStock
        ? allProducts.filter((product) => product.isAvailable)
        : allProducts,
    [allProducts, store.catalog.hideOutOfStock],
  );
  const { data: categories } = useSuspenseQuery(catalogQueries.categories());
  const { data: brands } = useSuspenseQuery(catalogQueries.brands());

  const [state, setState] = useState<CatalogState>(initialCatalogState);
  const patch = (next: Partial<CatalogState>) => setState((s) => ({ ...s, ...next }));
  const reset = () => setState(initialCatalogState);

  const indexes = useMemo(() => buildIndexes(categories, brands), [categories, brands]);
  const results = useMemo(
    () => applyCatalog(products, state, indexes),
    [products, state, indexes],
  );

  const hasPrices = products.some((p) => p.price !== null || p.promoPrice !== null);
  const hasPromotions = products.some(isPromotion);
  const filtersActive = hasActiveFilters(state);
  const activeCategory = categories.find((c) => c.slug === state.categorySlug);
  const activeBrand = brands.find((b) => b.slug === state.brandSlug);

  const sortOptions: SortOption[] = [
    "relevance",
    "name-asc",
    "name-desc",
    ...(hasPrices ? (["price-asc", "price-desc"] as SortOption[]) : []),
    ...(hasPromotions ? (["promo"] as SortOption[]) : []),
  ];

  const filterPanel = (
    <CatalogFilterPanel
      state={state}
      onChange={patch}
      categories={categories}
      brands={brands}
      hasPrices={hasPrices}
      hasPromotions={hasPromotions}
    />
  );

  return (
    <div className="container-page py-8 sm:py-10">
      <header>
        <h1 className="text-2xl sm:text-3xl">Catálogo {store.name}</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Encontre produtos para cuidar melhor do seu pet e fale com a loja pelo WhatsApp.
        </p>
      </header>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            type="search"
            value={state.search}
            onChange={(event) => patch({ search: event.target.value })}
            placeholder="Buscar por produto, marca ou categoria"
            aria-label="Buscar no catálogo"
            className="pl-9"
          />
          {state.search && (
            <button
              type="button"
              onClick={() => patch({ search: "" })}
              aria-label="Limpar busca"
              className="absolute top-1/2 right-2 grid size-7 -translate-y-1/2 place-items-center rounded-md text-muted-foreground hover:bg-secondary"
            >
              <X className="size-4" aria-hidden />
            </button>
          )}
        </div>

        <div className="flex gap-2">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="lg:hidden">
                <SlidersHorizontal className="size-4" aria-hidden />
                Filtros
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[85vw] overflow-y-auto sm:max-w-sm">
              <SheetHeader>
                <SheetTitle>Filtros</SheetTitle>
              </SheetHeader>
              <div className="mt-4">{filterPanel}</div>
            </SheetContent>
          </Sheet>

          <Select
            value={state.sort}
            onValueChange={(value) => patch({ sort: value as SortOption })}
          >
            <SelectTrigger className="w-full sm:w-52" aria-label="Ordenar resultados">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((option) => (
                <SelectItem key={option} value={option}>
                  {sortLabels[option]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {filtersActive && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {state.search && <Badge variant="secondary">Busca: {state.search}</Badge>}
          {activeCategory && <Badge variant="secondary">{activeCategory.name}</Badge>}
          {activeBrand && <Badge variant="secondary">{activeBrand.name}</Badge>}
          {state.onlyAvailable && <Badge variant="secondary">Disponíveis</Badge>}
          {state.onlyPromotions && <Badge variant="secondary">Promoções</Badge>}
          <Button variant="ghost" size="sm" onClick={reset}>
            Limpar filtros
          </Button>
        </div>
      )}

      {categories.length > 0 && (
        <section className="mt-6" aria-labelledby="categorias">
          <h2 id="categorias" className="text-lg">
            Categorias
          </h2>
          <ul className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {categories.map((category) => {
              const active = state.categorySlug === category.slug;
              const count = products.filter((p) => p.categoryId === category.id).length;
              return (
                <li key={category.id}>
                  <button
                    type="button"
                    aria-pressed={active}
                    onClick={() => patch({ categorySlug: active ? null : category.slug })}
                    className={`surface-card whitespace-nowrap px-3 py-2 text-sm font-semibold ${
                      active ? "border-primary text-primary" : "text-foreground"
                    }`}
                  >
                    {category.name}
                    <span className="ml-2 text-xs font-normal text-muted-foreground">{count}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-[16rem_1fr]">
        <aside className="hidden lg:block" aria-label="Filtros do catálogo">
          {filterPanel}
        </aside>

        <section aria-live="polite">
          {products.length > 0 && (
            <p className="mb-3 text-sm text-muted-foreground">
              {results.length} produto(s) encontrado(s)
            </p>
          )}

          {products.length === 0 ? (
            <EmptyState
              icon={<PackageSearch className="size-8 text-muted-foreground" aria-hidden />}
              title="Nenhum produto cadastrado ainda"
              description="Os produtos aparecerão aqui assim que forem cadastrados no painel administrativo."
              action={
                <Button asChild variant="outline">
                  <Link to="/contato">Falar com a loja</Link>
                </Button>
              }
            />
          ) : results.length === 0 ? (
            <EmptyState
              icon={<Search className="size-8 text-muted-foreground" aria-hidden />}
              title={
                state.search
                  ? `Nenhum resultado para “${state.search}”`
                  : "Nenhum produto com esses filtros"
              }
              description="Tente outro termo ou remova os filtros aplicados."
              action={
                <Button variant="outline" onClick={reset}>
                  Limpar busca e filtros
                </Button>
              }
            />
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
              {results.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  category={categories.find((c) => c.id === product.categoryId)}
                  brand={brands.find((b) => b.id === product.brandId)}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}