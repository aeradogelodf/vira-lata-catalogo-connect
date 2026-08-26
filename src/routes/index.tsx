import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  BadgePercent,
  Clock,
  Heart,
  MapPin,
  MessageCircle,
  Package,
  Scissors,
  Tag,
} from "lucide-react";

import { ProductCard } from "@/components/catalog/ProductCard";
import { BannerCarousel } from "@/components/home/BannerCarousel";
import { Button } from "@/components/ui/button";
import { useStore } from "@/hooks/use-store";
import { bannerQueries } from "@/lib/banners-queries";
import { buildIndexes, isPromotion } from "@/lib/catalog";
import { catalogQueries } from "@/lib/catalog-queries";
import { serviceQueries } from "@/lib/services-queries";
import { storeQueries } from "@/lib/store-queries";
import { formatAddress, type StoreInfo } from "@/lib/store-settings";
import { localBusinessJsonLd, organizationJsonLd } from "@/lib/store-seo";
import { whatsappMessages, whatsappUrl } from "@/lib/whatsapp";

export const Route = createFileRoute("/")({
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(storeQueries.settings()),
      context.queryClient.ensureQueryData(bannerQueries.public()),
      context.queryClient.ensureQueryData(catalogQueries.categories()),
      context.queryClient.ensureQueryData(catalogQueries.products()),
      context.queryClient.ensureQueryData(serviceQueries.public()),
    ]);
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
        { property: "og:url", content: "/" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [{ rel: "canonical", href: "/" }],
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

const pillars = [
  {
    icon: Tag,
    title: "Catálogo organizado",
    text: "Categorias, marcas, busca e filtros para encontrar rápido.",
    tone: "text-primary",
  },
  {
    icon: Heart,
    title: "Favoritos",
    text: "Salve produtos de interesse no seu aparelho e volte quando quiser.",
    tone: "text-brand-red",
  },
  {
    icon: Scissors,
    title: "Serviços",
    text: "Banho e tosa e outros serviços, com agendamento pelo WhatsApp.",
    tone: "text-info",
  },
  {
    icon: MessageCircle,
    title: "Atendimento humano",
    text: "Sem checkout: você fala direto com a loja e fecha pelo WhatsApp.",
    tone: "text-success",
  },
];

function Index() {
  const store = useStore();
  const address = formatAddress(store);

  const { data: banners } = useSuspenseQuery(bannerQueries.public());
  const { data: categories } = useSuspenseQuery(catalogQueries.categories());
  const { data: products } = useSuspenseQuery(catalogQueries.products());
  const { data: services } = useSuspenseQuery(serviceQueries.public());

  const indexes = buildIndexes(categories, []);
  const featured = products.filter((product) => product.isFeatured).slice(0, 8);
  const promotions = products.filter(isPromotion).slice(0, 8);
  const featuredServices = services.filter((service) => service.featured).slice(0, 3);
  const visibleCategories = categories.slice(0, 6);

  return (
    <>
      {/* 1. Hero institucional */}
      <section className="bg-gradient-to-b from-secondary/60 to-background">
        <div className="container-page grid gap-8 py-12 sm:py-16 lg:grid-cols-2 lg:items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-warning/25 px-3 py-1 text-xs font-semibold text-warning-foreground">
              Catálogo digital oficial
            </span>
            <h1 className="mt-4 text-3xl leading-tight sm:text-4xl lg:text-5xl">
              Tudo para o seu animal na{" "}
              <span className="text-primary">{store.name}</span>
            </h1>
            <p className="mt-4 max-w-xl text-muted-foreground">
              Veja os produtos, salve seus favoritos e fale com a loja pelo WhatsApp. Simples,
              rápido e sem burocracia.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild variant="hero" size="xl">
                <Link to="/catalogo">Ver catálogo</Link>
              </Button>
              <Button asChild variant="whatsapp" size="xl">
                <a
                  href={whatsappUrl(whatsappMessages.general(store), store)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Falar no WhatsApp
                </a>
              </Button>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              WhatsApp {store.whatsapp.display ?? store.whatsapp.e164}
            </p>
          </div>

          <div className="surface-card p-6">
            <h2 className="text-lg">Informações da loja</h2>
            <p className="mt-3 flex gap-2 text-sm text-muted-foreground">
              <MapPin className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
              {address}
            </p>
            <div className="mt-4 flex gap-2 text-sm text-muted-foreground">
              <Clock className="mt-0.5 size-4 shrink-0 text-info" aria-hidden />
              <ul className="w-full space-y-1">
                {store.openingHours.map((h) => (
                  <li key={h.day} className="flex justify-between gap-4">
                    <span>{h.label}</span>
                    <span>{h.opensAt && h.closesAt ? `${h.opensAt} às ${h.closesAt}` : "Fechado"}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Banners de campanha (admin /admin/banners) */}
      <BannerCarousel banners={banners} store={store} />

      {/* 3. Categorias */}
      {visibleCategories.length > 0 && (
        <section className="container-page py-10">
          <div className="flex items-end justify-between gap-4">
            <h2 className="text-2xl">Navegue por categoria</h2>
            <Link
              to="/catalogo"
              className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
            >
              Ver catálogo <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
          <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {visibleCategories.map((category) => (
              <li key={category.id}>
                <Link
                  to="/catalogo"
                  className="surface-card flex h-full flex-col items-center gap-2 p-4 text-center transition-shadow hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                >
                  <Package className="size-6 text-primary" aria-hidden />
                  <span className="text-sm font-semibold">{category.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 4. Produtos em destaque */}
      {featured.length > 0 && (
        <section className="container-page py-10">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl">Destaques da loja</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Seleção feita pela {store.name}.
              </p>
            </div>
            <Link
              to="/catalogo"
              className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
            >
              Ver tudo <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
          <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
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
        </section>
      )}

      {/* 5. Promoções */}
      {promotions.length > 0 && (
        <section className="container-page py-10">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl">
                <BadgePercent className="mr-2 inline size-6 text-warning" aria-hidden />
                Promoções
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Ofertas ativas — aproveite pelo WhatsApp.
              </p>
            </div>
            <Link
              to="/catalogo"
              className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
            >
              Ver ofertas <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
          <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {promotions.map((product) => (
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
        </section>
      )}

      {/* 6. Serviços em destaque */}
      {featuredServices.length > 0 && (
        <section className="container-page py-10">
          <div className="flex items-end justify-between gap-4">
            <h2 className="text-2xl">Serviços em destaque</h2>
            <Link
              to="/servicos"
              className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
            >
              Ver serviços <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
          <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featuredServices.map((service) => (
              <li key={service.id} className="surface-card flex flex-col overflow-hidden">
                {service.imageUrl ? (
                  <img
                    src={service.imageUrl}
                    alt={`Serviço ${service.name} na ${store.name}`}
                    className="aspect-[4/3] w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div
                    className="grid aspect-[4/3] w-full place-items-center bg-secondary"
                    aria-hidden
                  >
                    <Scissors className="size-8 text-muted-foreground" />
                  </div>
                )}
                <div className="flex flex-1 flex-col p-4">
                  <h3 className="font-display text-base font-bold">{service.name}</h3>
                  {service.description && (
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                      {service.description}
                    </p>
                  )}
                  <Button asChild variant="whatsapp" size="sm" className="mt-3 w-full">
                    <a
                      href={whatsappUrl(whatsappMessages.service(service.name, store), store)}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Falar no WhatsApp sobre o serviço ${service.name}`}
                    >
                      Agendar no WhatsApp
                    </a>
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 7. CTAs inteligentes */}
      <section className="container-page py-10">
        <div className="grid gap-4 sm:grid-cols-3">
          <article className="surface-card flex flex-col p-6">
            <MessageCircle className="size-7 text-success" aria-hidden />
            <h2 className="mt-3 text-lg">Peça pelo WhatsApp</h2>
            <p className="mt-1 flex-1 text-sm text-muted-foreground">
              Montou a lista? Envie direto para a loja e receba atendimento humano.
            </p>
            <Button asChild variant="whatsapp" className="mt-4">
              <a
                href={whatsappUrl(whatsappMessages.general(store), store)}
                target="_blank"
                rel="noopener noreferrer"
              >
                Chamar no WhatsApp
              </a>
            </Button>
          </article>

          <article className="surface-card flex flex-col p-6">
            <Package className="size-7 text-primary" aria-hidden />
            <h2 className="mt-3 text-lg">Disk Ração</h2>
            <p className="mt-1 flex-1 text-sm text-muted-foreground">
              Consulte rações e ofertas disponíveis na {store.name}.
            </p>
            <Button asChild variant="hero" className="mt-4">
              <Link to="/catalogo">Explorar catálogo</Link>
            </Button>
          </article>

          <article className="surface-card flex flex-col p-6">
            <Scissors className="size-7 text-info" aria-hidden />
            <h2 className="mt-3 text-lg">Banho e Tosa</h2>
            <p className="mt-1 flex-1 text-sm text-muted-foreground">
              Agende o banho ou a tosa do seu pet direto pelo WhatsApp.
            </p>
            <Button asChild variant="outline" className="mt-4">
              <Link to="/servicos">Ver serviços</Link>
            </Button>
          </article>
        </div>
      </section>

      {/* 8. Como funciona */}
      <section className="container-page pb-12">
        <h2 className="text-2xl">Como funciona</h2>
        <p className="mt-2 text-muted-foreground">
          Catálogo → interesse → WhatsApp → atendimento → venda.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {pillars.map((p) => (
            <article key={p.title} className="surface-card p-5">
              <p.icon className={`size-6 ${p.tone}`} aria-hidden />
              <h3 className="mt-3 text-base">{p.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{p.text}</p>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
