import { useSuspenseQuery } from "@tanstack/react-query";
import { Link, createFileRoute, notFound } from "@tanstack/react-router";
import { MessageCircle, PackageSearch } from "lucide-react";

import { EmptyState } from "@/components/catalog/EmptyState";
import { FavoriteButton } from "@/components/catalog/FavoriteButton";
import { ProductCard } from "@/components/catalog/ProductCard";
import { ProductGallery } from "@/components/catalog/ProductGallery";
import { ShareButton } from "@/components/catalog/ShareButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useStore } from "@/hooks/use-store";
import { storeQueries } from "@/lib/store-queries";
import { FALLBACK_STORE } from "@/lib/store-settings";
import { catalogQueries } from "@/lib/catalog-queries";
import { formatPrice, isPromotion, relatedProducts } from "@/lib/catalog";
import { whatsappMessages, whatsappUrl } from "@/lib/whatsapp";

import { SITE_URL as SITE } from "@/lib/site";

export const Route = createFileRoute("/produto/$slug")({
  loader: async ({ params, context }) => {
    const product = await context.queryClient.ensureQueryData(
      catalogQueries.product(params.slug),
    );
    if (!product) throw notFound();
    await Promise.all([
      context.queryClient.ensureQueryData(catalogQueries.products()),
      context.queryClient.ensureQueryData(catalogQueries.categories()),
      context.queryClient.ensureQueryData(catalogQueries.brands()),
    ]);
    const store = await context.queryClient.ensureQueryData(storeQueries.settings());
    return { product, store };
  },
  head: ({ params, loaderData }) => {
    const url = `${SITE}/produto/${params.slug}`;
    if (!loaderData) {
      return {
        meta: [
          { title: `Produto indisponível — ${FALLBACK_STORE.name}` },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const { product, store } = loaderData;
    const description =
      product.seoDescription ??
      product.description ??
      `${product.name} no catálogo da ${store.name}. Peça informações pelo WhatsApp.`;
    const title = product.seoTitle ?? `${product.name} — ${store.name}`;

    // Imagens do Storage privado são URLs assinadas (expiram) — só usamos
    // como og:image quando a URL é absoluta e estável (http/https públicas).
    const image = product.images[0]?.url;
    const absoluteImage =
      image && /^https?:\/\//.test(image) && !image.includes("/object/sign/") ? image : null;

    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "product" },
        { property: "og:url", content: url },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
        ...(absoluteImage
          ? [
              { property: "og:image", content: absoluteImage },
              { name: "twitter:image", content: absoluteImage },
            ]
          : []),
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            name: product.name,
            url,
            ...(product.description ? { description: product.description } : {}),
            ...(absoluteImage ? { image: [absoluteImage] } : {}),
            ...(product.promoPrice ?? product.price
              ? {
                  offers: {
                    "@type": "Offer",
                    price: product.promoPrice ?? product.price,
                    priceCurrency: "BRL",
                    url,
                    availability: product.isAvailable
                      ? "https://schema.org/InStock"
                      : "https://schema.org/OutOfStock",
                    seller: { "@type": "Organization", name: store.name },
                  },
                }
              : {}),
          }),
        },
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Início", item: `${SITE}/` },
              { "@type": "ListItem", position: 2, name: "Catálogo", item: `${SITE}/catalogo` },
              { "@type": "ListItem", position: 3, name: product.name, item: url },
            ],
          }),
        },
      ],
    };
  },
  notFoundComponent: ProductNotFound,
  component: ProductPage,
});

function ProductNotFound() {
  return (
    <div className="container-page py-10">
      <EmptyState
        icon={<PackageSearch className="size-8 text-muted-foreground" aria-hidden />}
        title="Produto não encontrado"
        description="Este produto não está mais disponível no catálogo ou o endereço está incorreto."
        action={
          <Button asChild>
            <Link to="/catalogo">Voltar ao catálogo</Link>
          </Button>
        }
      />
    </div>
  );
}

function ProductPage() {
  const { product } = Route.useLoaderData();
  const store = useStore();
  const { data: products } = useSuspenseQuery(catalogQueries.products());
  const { data: categories } = useSuspenseQuery(catalogQueries.categories());
  const { data: brands } = useSuspenseQuery(catalogQueries.brands());

  const category = categories.find((c) => c.id === product.categoryId);
  const brand = brands.find((b) => b.id === product.brandId);
  const related = relatedProducts(product, products);
  const promo = isPromotion(product);
  const price = product.promoPrice ?? product.price;

  return (
    <div className="container-page py-6 sm:py-10">
      <nav aria-label="Você está em" className="mb-4 text-sm text-muted-foreground">
        <Link to="/catalogo" className="hover:underline">
          Catálogo
        </Link>
        <span aria-hidden> / </span>
        <span className="text-foreground">{product.name}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2">
        <ProductGallery product={product} />

        <div>
          <div className="flex flex-wrap gap-2">
            {promo && (
              <Badge className="bg-warning text-warning-foreground hover:bg-warning">
                Promoção
              </Badge>
            )}
            <Badge variant={product.isAvailable ? "secondary" : "outline"}>
              {product.isAvailable ? "Disponível" : "Indisponível"}
            </Badge>
            {category && <Badge variant="outline">{category.name}</Badge>}
          </div>

          {brand && (
            <p className="mt-4 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              {brand.name}
            </p>
          )}
          <h1 className="mt-1 text-2xl sm:text-3xl">{product.name}</h1>

          {price !== null ? (
            <p className="mt-4 flex items-baseline gap-3">
              <span className="font-display text-3xl font-bold">{formatPrice(price)}</span>
              {promo && product.price !== null && (
                <span className="text-base text-muted-foreground line-through">
                  {formatPrice(product.price)}
                </span>
              )}
            </p>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">
              Preço sob consulta — fale com a loja pelo WhatsApp.
            </p>
          )}

          {product.description && (
            <p className="mt-4 leading-relaxed text-muted-foreground">{product.description}</p>
          )}

          <div className="mt-6 flex flex-wrap gap-2">
            <Button asChild variant="whatsapp" size="lg" className="flex-1 sm:flex-none">
              <a
                href={whatsappUrl(whatsappMessages.product(product.name, store), store)}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle className="size-5" aria-hidden />
                Tenho interesse
              </a>
            </Button>
            <FavoriteButton productId={product.id} productName={product.name} size="sm" />
            <ShareButton title={product.name} />
          </div>

          <p className="mt-4 text-xs text-muted-foreground">
            O catálogo não finaliza vendas: a compra é concluída no atendimento da {store.name}.
          </p>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-12" aria-labelledby="relacionados">
          <h2 id="relacionados" className="text-xl sm:text-2xl">
            Você também pode gostar
          </h2>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {related.map((item) => (
              <ProductCard
                key={item.id}
                product={item}
                category={categories.find((c) => c.id === item.categoryId)}
                brand={brands.find((b) => b.id === item.brandId)}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}