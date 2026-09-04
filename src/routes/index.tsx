import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Clock,
  MapPin,
  MessageCircle,
  Package,
  Phone,
  ShoppingBag,
} from "lucide-react";

import { ProductCard } from "@/components/catalog/ProductCard";
import { BannerCarousel } from "@/components/home/BannerCarousel";
import { Button } from "@/components/ui/button";
import { useStore } from "@/hooks/use-store";
import { bannerQueries } from "@/lib/banners-queries";
import { buildIndexes } from "@/lib/catalog";
import { catalogQueries } from "@/lib/catalog-queries";
import { serviceQueries } from "@/lib/services-queries";
import { SITE_URL } from "@/lib/site";
import { storeQueries } from "@/lib/store-queries";
import { formatAddress, type StoreInfo } from "@/lib/store-settings";
import { localBusinessJsonLd, organizationJsonLd } from "@/lib/store-seo";
import { whatsappMessages, whatsappUrl } from "@/lib/whatsapp";

export const Route = createFileRoute("/")({
  loader: async ({ context }) => {
    const [store] = await Promise.all([
      context.queryClient.ensureQueryData(storeQueries.settings()),
      context.queryClient.ensureQueryData(bannerQueries.public()),
      context.queryClient.ensureQueryData(catalogQueries.categories()),
      context.queryClient.ensureQueryData(catalogQueries.products()),
      context.queryClient.ensureQueryData(serviceQueries.public()),
    ]);
    return store;
  },
  head: ({ loaderData }) => {
    const store = loaderData as StoreInfo | undefined;
    const name = store?.name ?? "Agropet Vira Lata";
    const city = [store?.address.district, store?.address.city, store?.address.state]
      .filter(Boolean)
      .join(", ");
    const title = `${name} — Catálogo digital${city ? ` em ${city}` : ""}`.slice(0, 59);
    const description = (
      store?.shortDescription ??
      "Catálogo digital com produtos e serviços para o seu animal, com atendimento pelo WhatsApp."
    ).slice(0, 158);

    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: `${name} — Catálogo digital` },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { property: "og:url", content: `${SITE_URL}/` },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [{ rel: "canonical", href: `${SITE_URL}/` }],
      scripts: store
        ? [
            {
              type: "application/ld+json",
              children: JSON.stringify(localBusinessJsonLd(store)),
            },
            {
              type: "application/ld+json",
              children: JSON.stringify(organizationJsonLd(store)),
            },
          ]
        : [],
    };
  },
  component: Index,
});

function Index() {
  const store = useStore();
  const address = formatAddress(store);

  const { data: banners } = useSuspenseQuery(bannerQueries.public());
  const { data: categories } = useSuspenseQuery(catalogQueries.categories());
  const { data: products } = useSuspenseQuery(catalogQueries.products());
  useSuspenseQuery(serviceQueries.public());

  const indexes = buildIndexes(categories, []);
  const featured = products.filter((product) => product.isFeatured).slice(0, 8);
  const visibleCategories = categories.slice(0, 6);

  return (
    <>
      {/* 1. Hero institucional */}
      <section className="relative overflow-hidden border-b border-border bg-secondary/50">
        <div className="absolute inset-x-0 top-0 grid h-1 grid-cols-4" aria-hidden>
          <span className="bg-brand-red" />
          <span className="bg-brand-green" />
          <span className="bg-brand-blue" />
          <span className="bg-brand-yellow" />
        </div>
        <div className="container-page flex min-h-[34rem] flex-col items-center justify-center py-14 text-center sm:min-h-[36rem] sm:py-16 lg:min-h-[38rem]">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-semibold text-muted-foreground shadow-sm">
            <span className="size-2 rounded-full bg-success" aria-hidden />
            Catálogo digital oficial
          </span>
          <h1 className="mt-6 max-w-4xl text-4xl leading-tight sm:text-5xl lg:text-6xl">
            Tudo para o seu animal na{" "}
            <span className="text-primary">{store.name}</span>
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Veja os produtos, salve seus favoritos e fale com a loja pelo WhatsApp. Simples,
            rápido e sem burocracia.
          </p>
          <div className="mt-8 grid w-full max-w-md gap-3 sm:grid-cols-2">
            <Button asChild variant="hero" size="xl" className="h-14 w-full shadow-[var(--shadow-cta)]">
              <Link to="/catalogo">
                <ShoppingBag className="size-5" aria-hidden />
                Ver catálogo
              </Link>
            </Button>
            <Button asChild variant="whatsapp" size="xl" className="h-14 w-full">
              <a
                href={whatsappUrl(whatsappMessages.general(store), store)}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Falar com a ${store.name} no WhatsApp`}
              >
                <MessageCircle className="size-5" aria-hidden />
                Falar no WhatsApp
              </a>
            </Button>
          </div>
          <p className="mt-5 text-sm text-muted-foreground">
            Atendimento direto, sem checkout e sem burocracia.
          </p>
        </div>
      </section>

      {/* 2. Banners de campanha (admin /admin/banners) */}
      <BannerCarousel banners={banners} store={store} />

      {/* 3. Categorias */}
      {visibleCategories.length > 0 && (
        <section className="container-page py-12 sm:py-16">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4">
            <div className="min-w-0">
              <p className="text-xs font-bold text-primary uppercase">Encontre mais rápido</p>
              <h2 className="mt-1 text-2xl sm:text-3xl">Navegue por categoria</h2>
            </div>
            <Link
              to="/catalogo"
              className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-primary underline-offset-4 transition-colors hover:text-primary/80 hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <span className="hidden sm:inline">Ver catálogo</span>
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
          <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {visibleCategories.map((category) => (
              <li key={category.id}>
                <Link
                  to="/catalogo"
                  className="surface-card group flex min-h-32 h-full flex-col items-center justify-center gap-3 p-4 text-center transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                >
                  <span className="grid size-11 place-items-center rounded-full bg-secondary transition-colors group-hover:bg-primary/10">
                    <Package className="size-5 text-primary" aria-hidden />
                  </span>
                  <span className="text-sm leading-snug font-bold">{category.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 4. Produtos em destaque */}
      {featured.length > 0 && (
        <section className="border-y border-border bg-secondary/35 py-12 sm:py-16">
          <div className="container-page">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4">
            <div className="min-w-0">
              <p className="text-xs font-bold text-primary uppercase">Escolhas da loja</p>
              <h2 className="mt-1 text-2xl sm:text-3xl">Destaques da loja</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Seleção feita pela {store.name}.
              </p>
            </div>
            <Link
              to="/catalogo"
              className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-primary underline-offset-4 transition-colors hover:text-primary/80 hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <span className="hidden sm:inline">Ver tudo</span>
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
          <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
            {featured.map((product) => (
              <li key={product.id}>
                <ProductCard
                  product={product}
                  category={
                    product.categoryId
                      ? indexes.categoriesById.get(product.categoryId)
                      : undefined
                  }
                />
              </li>
            ))}
          </ul>
          </div>
        </section>
      )}

      {/* 5. Informações da loja */}
      <section className="container-page py-12 sm:py-16">
        <div className="surface-card overflow-hidden">
          <div className="grid lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <div className="border-b border-border bg-primary p-6 text-primary-foreground sm:p-8 lg:border-r lg:border-b-0">
              <p className="text-xs font-bold uppercase opacity-80">Visite a nossa loja</p>
              <h2 className="mt-2 text-2xl sm:text-3xl">Informações da loja</h2>
              <p className="mt-3 max-w-md text-sm leading-relaxed opacity-90">
                Encontre tudo para o seu animal e conte com atendimento direto da nossa equipe.
              </p>
              <Button asChild variant="whatsapp" size="lg" className="mt-6 w-full sm:w-auto">
                <a
                  href={whatsappUrl(whatsappMessages.general(store), store)}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Falar com a ${store.name} no WhatsApp`}
                >
                  <MessageCircle className="size-4" aria-hidden />
                  Falar no WhatsApp
                </a>
              </Button>
            </div>
            <div className="grid gap-6 p-6 sm:grid-cols-2 sm:p-8">
              <div className="space-y-5">
                {address && (
                  <div className="flex gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/10">
                      <MapPin className="size-5 text-primary" aria-hidden />
                    </span>
                    <div className="min-w-0">
                      <h3 className="text-base">Endereço</h3>
                      <address className="mt-1 text-sm leading-relaxed not-italic text-muted-foreground">
                        {address}
                      </address>
                    </div>
                  </div>
                )}
                {store.phone && (
                  <div className="flex gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-full bg-success/10">
                      <Phone className="size-5 text-success" aria-hidden />
                    </span>
                    <div className="min-w-0">
                      <h3 className="text-base">Telefone</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{store.phone}</p>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-info/10">
                  <Clock className="size-5 text-info" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="text-base">Horário de funcionamento</h3>
                  <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
                    {store.openingHours.map((hour) => (
                      <li
                        key={hour.day}
                        className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-3"
                      >
                        <span className="min-w-0">{hour.label}</span>
                        <span className="shrink-0 text-right">
                          {hour.opensAt && hour.closesAt
                            ? `${hour.opensAt} às ${hour.closesAt}`
                            : "Fechado"}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
