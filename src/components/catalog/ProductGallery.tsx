import { ChevronLeft, ChevronRight, PawPrint } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";
import type { Product } from "@/types/catalog";

export function ProductGallery({ product }: { product: Product }) {
  const images = [...product.images].sort((a, b) => a.position - b.position);
  const [index, setIndex] = useState(0);
  const [zoom, setZoom] = useState(false);
  const current = images[index] ?? images[0];

  if (images.length === 0 || !current) {
    return (
      <div
        className="surface-card grid aspect-square w-full place-items-center text-muted-foreground"
        role="img"
        aria-label={`${product.name} — imagem não disponível`}
      >
        <div className="flex flex-col items-center gap-2">
          <PawPrint className="size-10" aria-hidden />
          <span className="text-sm">Imagem não disponível</span>
        </div>
      </div>
    );
  }

  const go = (delta: number) => setIndex((i) => (i + delta + images.length) % images.length);

  return (
    <div className="flex flex-col gap-3">
      <div className="surface-card relative overflow-hidden">
        <button
          type="button"
          onClick={() => setZoom((z) => !z)}
          aria-label={zoom ? "Reduzir imagem" : "Ampliar imagem"}
          className="block w-full cursor-zoom-in focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <img
            src={current.url}
            alt={current.alt ?? product.name}
            width={1000}
            height={1000}
            decoding="async"
            className={cn(
              "aspect-square w-full bg-secondary object-cover transition-transform duration-300",
              zoom && "scale-150",
            )}
          />
        </button>

        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Imagem anterior"
              className="absolute top-1/2 left-2 grid size-9 -translate-y-1/2 place-items-center rounded-full border border-border bg-background/90 backdrop-blur"
            >
              <ChevronLeft className="size-4" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Próxima imagem"
              className="absolute top-1/2 right-2 grid size-9 -translate-y-1/2 place-items-center rounded-full border border-border bg-background/90 backdrop-blur"
            >
              <ChevronRight className="size-4" aria-hidden />
            </button>
          </>
        )}
      </div>

      {images.length > 1 && (
        <ul className="grid grid-cols-5 gap-2">
          {images.map((image, i) => (
            <li key={image.id}>
              <button
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Ver imagem ${i + 1} de ${images.length}`}
                aria-current={i === index}
                className={cn(
                  "block w-full overflow-hidden rounded-md border",
                  i === index ? "border-primary" : "border-border",
                )}
              >
                <img
                  src={image.url}
                  alt=""
                  width={160}
                  height={160}
                  loading="lazy"
                  decoding="async"
                  className="aspect-square w-full bg-secondary object-cover"
                />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}