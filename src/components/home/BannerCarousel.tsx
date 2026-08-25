import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import Autoplay from "embla-carousel-autoplay";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import { bannerTarget, type PublicBanner } from "@/lib/banners";
import type { StoreInfo } from "@/lib/store-settings";

/** Carrossel acessível da Home — swipe no mobile, setas + autoplay no desktop. */
export function BannerCarousel({
  banners,
  store,
}: {
  banners: PublicBanner[];
  store: StoreInfo;
}) {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!api) return;
    const update = () => setCurrent(api.selectedScrollSnap());
    update();
    api.on("select", update);
    return () => {
      api.off("select", update);
    };
  }, [api]);

  if (banners.length === 0) return null;

  return (
    <section className="container-page pt-6" aria-label="Campanhas em destaque">
      <Carousel
        setApi={setApi}
        opts={{ loop: banners.length > 1, align: "start" }}
        plugins={banners.length > 1 ? [Autoplay({ delay: 6000, stopOnInteraction: true })] : []}
      >
        <CarouselContent>
          {banners.map((banner, index) => {
            const target = bannerTarget(banner, store);
            return (
              <CarouselItem key={banner.id}>
                <article className="surface-card relative overflow-hidden">
                  {banner.imageUrl ? (
                    <img
                      src={banner.imageUrl}
                      alt={banner.altText ?? banner.title}
                      className="h-48 w-full object-cover sm:h-64 lg:h-80"
                      loading={index === 0 ? "eager" : "lazy"}
                      decoding="async"
                    />
                  ) : (
                    <div className="h-40 w-full bg-gradient-to-r from-secondary to-background sm:h-56" />
                  )}

                  <div className="p-5 sm:p-6">
                    <h2 className="font-display text-xl font-bold sm:text-2xl">{banner.title}</h2>
                    {banner.subtitle && (
                      <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                        {banner.subtitle}
                      </p>
                    )}
                    {target && banner.ctaLabel && (
                      <div className="mt-4">
                        {target.external ? (
                          <Button asChild variant="hero">
                            <a
                              href={target.href}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label={`${banner.ctaLabel} — ${banner.title}`}
                            >
                              {banner.ctaLabel}
                            </a>
                          </Button>
                        ) : (
                          <Button asChild variant="hero">
                            <Link
                              to={target.href}
                              aria-label={`${banner.ctaLabel} — ${banner.title}`}
                            >
                              {banner.ctaLabel}
                            </Link>
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </article>
              </CarouselItem>
            );
          })}
        </CarouselContent>

        {banners.length > 1 && (
          <>
            <CarouselPrevious className="hidden sm:flex" aria-label="Banner anterior" />
            <CarouselNext className="hidden sm:flex" aria-label="Próximo banner" />
            <div className="mt-3 flex justify-center gap-2" role="tablist" aria-label="Selecionar banner">
              {banners.map((banner, index) => (
                <button
                  key={banner.id}
                  type="button"
                  role="tab"
                  aria-selected={current === index}
                  aria-label={`Ir para o banner ${index + 1}: ${banner.title}`}
                  onClick={() => api?.scrollTo(index)}
                  className={`size-2.5 rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none ${
                    current === index ? "bg-primary" : "bg-muted"
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </Carousel>
    </section>
  );
}
