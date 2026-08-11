import { Link } from "@tanstack/react-router";
import { MessageCircle } from "lucide-react";

import { FavoriteButton } from "@/components/catalog/FavoriteButton";
import { ProductImage } from "@/components/catalog/ProductImage";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPrice, isPromotion } from "@/lib/catalog";
import { whatsappMessages, whatsappUrl } from "@/lib/whatsapp";
import type { Brand, Category, Product } from "@/types/catalog";

export function ProductCard({
  product,
  category,
  brand,
}: {
  product: Product;
  category?: Category;
  brand?: Brand;
}) {
  const promo = isPromotion(product);
  const price = product.promoPrice ?? product.price;

  return (
    <article className="surface-card group relative flex flex-col overflow-hidden">
      <div className="relative">
        <Link
          to="/produto/$slug"
          params={{ slug: product.slug }}
          className="block focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          aria-label={`Ver detalhes de ${product.name}`}
        >
          <ProductImage product={product} sizes="(max-width: 640px) 50vw, 25vw" />
        </Link>

        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {promo && (
            <Badge className="bg-warning text-warning-foreground hover:bg-warning">Promoção</Badge>
          )}
          {!product.isAvailable && <Badge variant="secondary">Indisponível</Badge>}
        </div>

        <FavoriteButton
          productId={product.id}
          productName={product.name}
          className="absolute top-2 right-2"
        />
      </div>

      <div className="flex flex-1 flex-col gap-1 p-3">
        {(brand ?? category) && (
          <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
            {brand?.name ?? category?.name}
          </p>
        )}

        <h3 className="font-display text-sm leading-snug font-bold sm:text-base">
          <Link to="/produto/$slug" params={{ slug: product.slug }} className="hover:underline">
            {product.name}
          </Link>
        </h3>

        {price !== null ? (
          <p className="mt-1 flex items-baseline gap-2">
            <span className="font-display text-base font-bold text-foreground sm:text-lg">
              {formatPrice(price)}
            </span>
            {promo && product.price !== null && (
              <span className="text-xs text-muted-foreground line-through">
                {formatPrice(product.price)}
              </span>
            )}
          </p>
        ) : (
          <p className="mt-1 text-xs text-muted-foreground">Consulte o preço pelo WhatsApp</p>
        )}

        {product.isAvailable && (
          <p className="text-xs font-semibold text-success">Disponível</p>
        )}

        <Button asChild variant="whatsapp" size="sm" className="mt-3 w-full">
          <a
            href={whatsappUrl(whatsappMessages.product(product.name))}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Falar no WhatsApp sobre ${product.name}`}
          >
            <MessageCircle className="size-4" aria-hidden />
            Tenho interesse
          </a>
        </Button>
      </div>
    </article>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="surface-card overflow-hidden" aria-hidden>
      <div className="aspect-square w-full animate-pulse bg-secondary" />
      <div className="space-y-2 p-3">
        <div className="h-3 w-1/3 animate-pulse rounded bg-secondary" />
        <div className="h-4 w-3/4 animate-pulse rounded bg-secondary" />
        <div className="h-4 w-1/2 animate-pulse rounded bg-secondary" />
        <div className="h-9 w-full animate-pulse rounded-md bg-secondary" />
      </div>
    </div>
  );
}