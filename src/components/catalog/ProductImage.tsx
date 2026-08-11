import { PawPrint } from "lucide-react";

import { cn } from "@/lib/utils";
import type { Product } from "@/types/catalog";

/** Fallback elegante quando o produto ainda não tem imagem cadastrada. */
export function ProductImage({
  product,
  className,
  sizes,
  priority = false,
}: {
  product: Product;
  className?: string;
  sizes?: string;
  priority?: boolean;
}) {
  const image = product.images[0];

  if (!image) {
    return (
      <div
        className={cn(
          "grid aspect-square w-full place-items-center bg-secondary text-muted-foreground",
          className,
        )}
        role="img"
        aria-label={`${product.name} — imagem não disponível`}
      >
        <PawPrint className="size-8" aria-hidden />
      </div>
    );
  }

  return (
    <img
      src={image.url}
      alt={image.alt ?? product.name}
      width={800}
      height={800}
      sizes={sizes}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      className={cn("aspect-square w-full bg-secondary object-cover", className)}
    />
  );
}