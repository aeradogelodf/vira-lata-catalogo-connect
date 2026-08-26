import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart, MessageCircle } from "lucide-react";

import { EmptyState } from "@/components/catalog/EmptyState";
import { ProductCard, ProductCardSkeleton } from "@/components/catalog/ProductCard";
import { Button } from "@/components/ui/button";
import { useFavorites } from "@/hooks/use-favorites";
import { catalogQueries } from "@/lib/catalog-queries";
import { SITE_URL } from "@/lib/site";
import { whatsappMessages, whatsappUrl } from "@/lib/whatsapp";

export const Route = createFileRoute("/favoritos")({
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(catalogQueries.products()),
      context.queryClient.ensureQueryData(catalogQueries.categories()),
      context.queryClient.ensureQueryData(catalogQueries.brands()),
    ]);
  },
  head: () => ({
    meta: [
      { title: "Meus favoritos — Agropet Vira Lata" },
      {
        name: "description",
        content:
          "Produtos que você salvou no catálogo da Agropet Vira Lata para consultar e pedir informações pelo WhatsApp.",
      },
      { property: "og:title", content: "Meus favoritos — Agropet Vira Lata" },
      { property: "og:description", content: "Sua lista de produtos de interesse." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${SITE_URL}/favoritos` },
      { name: "robots", content: "noindex" },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/favoritos` }],
  }),
  component: FavoritosPage,
});

function FavoritosPage() {
  const { ids, hydrated, clear } = useFavorites();
  const { data: products } = useSuspenseQuery(catalogQueries.products());
  const { data: categories } = useSuspenseQuery(catalogQueries.categories());
  const { data: brands } = useSuspenseQuery(catalogQueries.brands());

  const favorites = products.filter((product) => ids.includes(product.id));

  return (
    <div className="container-page py-8 sm:py-10">
      <h1 className="text-2xl sm:text-3xl">Favoritos</h1>
      <p className="mt-2 text-muted-foreground">
        Sua lista de interesse fica salva neste dispositivo. Não é um pedido.
      </p>

      {!hydrated ? (
        <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      ) : favorites.length === 0 ? (
        <EmptyState
          className="mt-8"
          icon={<Heart className="size-8 text-primary" aria-hidden />}
          title="Você ainda não salvou produtos"
          description="Toque no coração de um produto no catálogo para salvá-lo aqui."
          action={
            <Button asChild>
              <Link to="/catalogo">Explorar catálogo</Link>
            </Button>
          }
        />
      ) : (
        <>
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <p className="mr-auto text-sm text-muted-foreground">
              {favorites.length} produto(s) salvos
            </p>
            <Button asChild variant="whatsapp">
              <a
                href={whatsappUrl(whatsappMessages.favorites(favorites.map((p) => p.name)))}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle className="size-4" aria-hidden />
                Enviar lista no WhatsApp
              </a>
            </Button>
            <Button variant="ghost" onClick={clear}>
              Limpar favoritos
            </Button>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {favorites.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                category={categories.find((c) => c.id === product.categoryId)}
                brand={brands.find((b) => b.id === product.brandId)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}