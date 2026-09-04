import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { CalendarClock, CheckCircle2, MessageCircle, Scissors } from "lucide-react";

import { EmptyState } from "@/components/catalog/EmptyState";
import { Button } from "@/components/ui/button";
import { useStore } from "@/hooks/use-store";
import { formatPrice } from "@/lib/catalog";
import { serviceQueries } from "@/lib/services-queries";
import { SITE_URL } from "@/lib/site";
import { storeQueries } from "@/lib/store-queries";
import { whatsappMessages, whatsappUrl } from "@/lib/whatsapp";

/**
 * Textos da área de Banho & Tosa em um único lugar para facilitar ajustes
 * futuros sem tocar no restante da página.
 */
const COPY = {
  title: "Banho & Tosa",
  subtitle: "Agende o cuidado do seu pet de forma rápida e fácil.",
  cta: "Agendar Banho & Tosa",
  servicesTitle: "Nossos serviços",
  emptyTitle: "Serviços em breve",
  emptyDescription: "Estamos preparando nossos serviços de Banho & Tosa.",
};

/** Etapas do fluxo de agendamento que será construído nas próximas etapas. */
const SCHEDULING_STEPS = [
  "Escolher o serviço",
  "Escolher o porte do pet",
  "Ver o preço",
  "Escolher data e horário",
  "Informar os dados",
  "Confirmar o agendamento",
];

export const Route = createFileRoute("/servicos")({
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(serviceQueries.public()),
      context.queryClient.ensureQueryData(storeQueries.settings()),
    ]);
  },
  head: () => ({
    meta: [
      { title: "Banho & Tosa — Agropet Vira Lata" },
      {
        name: "description",
        content:
          "Banho & Tosa na Agropet Vira Lata em Ceilândia Sul, Brasília — DF. Agende o cuidado do seu pet de forma rápida e fácil.",
      },
      { property: "og:title", content: "Banho & Tosa — Agropet Vira Lata" },
      {
        property: "og:description",
        content: "Agende o cuidado do seu pet de forma rápida e fácil.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${SITE_URL}/servicos` },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/servicos` }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Início", item: `${SITE_URL}/` },
            {
              "@type": "ListItem",
              position: 2,
              name: "Banho & Tosa",
              item: `${SITE_URL}/servicos`,
            },
          ],
        }),
      },
    ],
  }),
  pendingComponent: () => (
    <div className="container-page py-10">
      <div className="surface-card h-40 animate-pulse" aria-hidden />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="surface-card h-72 animate-pulse" aria-hidden />
        ))}
      </div>
      <p className="sr-only">Carregando serviços de Banho & Tosa…</p>
    </div>
  ),
  errorComponent: () => (
    <div className="container-page py-10">
      <EmptyState
        title="Não foi possível carregar os serviços"
        description="Tente novamente em instantes."
        action={
          <Button onClick={() => window.location.reload()}>Tentar novamente</Button>
        }
      />
    </div>
  ),
  notFoundComponent: () => (
    <div className="container-page py-10">
      <EmptyState title="Página não encontrada" />
    </div>
  ),
  component: BanhoTosaPage,
});

function BanhoTosaPage() {
  const store = useStore();
  const { data: services } = useSuspenseQuery(serviceQueries.public());

  return (
    <div className="container-page py-10">
      {/* Hero */}
      <section className="surface-card overflow-hidden p-6 sm:p-10">
        <p className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">
          <Scissors className="size-4" aria-hidden />
          {store.name}
        </p>
        <h1 className="mt-4 text-2xl sm:text-4xl">{COPY.title}</h1>
        <p className="mt-3 max-w-xl text-muted-foreground">{COPY.subtitle}</p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg" className="transition-transform hover:-translate-y-0.5">
            <a href="#agendar">
              <CalendarClock className="size-5" aria-hidden />
              {COPY.cta}
            </a>
          </Button>
          <Button asChild size="lg" variant="whatsapp">
            <a
              href={whatsappUrl(whatsappMessages.general(store), store)}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Falar com a ${store.name} no WhatsApp sobre Banho e Tosa`}
            >
              <MessageCircle className="size-5" aria-hidden />
              Falar no WhatsApp
            </a>
          </Button>
        </div>
      </section>

      {/* Serviços */}
      <section aria-labelledby="servicos-titulo" className="mt-12">
        <h2 id="servicos-titulo" className="text-xl sm:text-2xl">
          {COPY.servicesTitle}
        </h2>

        {services.length === 0 ? (
          <EmptyState
            className="mt-6"
            icon={<Scissors className="size-8 text-info" aria-hidden />}
            title={COPY.emptyTitle}
            description={COPY.emptyDescription}
            action={
              <Button asChild variant="whatsapp">
                <a
                  href={whatsappUrl(whatsappMessages.general(store), store)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Consultar no WhatsApp
                </a>
              </Button>
            }
          />
        ) : (
          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <li key={service.id} className="surface-card flex flex-col overflow-hidden">
                {service.imageUrl ? (
                  <img
                    suppressHydrationWarning
                    src={service.imageUrl}
                    alt={`Serviço ${service.name} na ${store.name}`}
                    width={800}
                    height={600}
                    className="aspect-[4/3] w-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <div
                    className="grid aspect-[4/3] w-full place-items-center bg-secondary"
                    aria-hidden
                  >
                    <Scissors className="size-8 text-muted-foreground" />
                  </div>
                )}
                <div className="flex flex-1 flex-col p-5">
                  <h3 className="font-display text-lg font-bold">{service.name}</h3>
                  {service.description && (
                    <p className="mt-2 text-sm text-muted-foreground">{service.description}</p>
                  )}
                  {/* Preços reais por porte quando configurados no painel;
                      caso contrário o preço único do serviço, se existir. */}
                  {service.prices.length > 0 ? (
                    <ul className="mt-3 space-y-1">
                      {service.prices.map((entry) => (
                        <li
                          key={entry.sizeId}
                          className="flex items-baseline justify-between gap-3 text-sm"
                        >
                          <span className="text-muted-foreground">{entry.sizeName}</span>
                          <span className="font-display font-bold">
                            {formatPrice(entry.price)}
                            <span className="ml-2 text-xs font-normal text-muted-foreground">
                              {formatDuration(entry.durationMinutes)}
                              {entry.note ? ` · ${entry.note}` : ""}
                            </span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : service.price !== null || service.priceNote ? (
                    <p className="mt-3 font-display text-base">
                      {service.price !== null ? formatPrice(service.price) : null}
                      {service.priceNote && (
                        <span className="ml-2 text-xs font-normal text-muted-foreground">
                          {service.priceNote}
                        </span>
                      )}
                    </p>
                  ) : (
                    <p className="mt-3 text-sm text-muted-foreground">Preço sob consulta</p>
                  )}

                  <Button asChild variant="whatsapp" className="mt-4 w-full">
                    <a
                      href={whatsappUrl(whatsappMessages.service(service.name, store), store)}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Falar no WhatsApp sobre o serviço ${service.name}`}
                    >
                      Falar no WhatsApp
                    </a>
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Área preparada para o agendamento */}
      <section
        id="agendar"
        aria-labelledby="agendar-titulo"
        className="surface-card mt-12 scroll-mt-24 p-6 sm:p-8"
      >
        <h2 id="agendar-titulo" className="text-xl sm:text-2xl">
          Agendamento online em breve
        </h2>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Estamos preparando o agendamento direto pelo site. Enquanto isso, fale com a{" "}
          {store.name} no WhatsApp para reservar o horário do seu pet.
        </p>
        <ol className="mt-5 grid gap-2 sm:grid-cols-2">
          {SCHEDULING_STEPS.map((step, index) => (
            <li key={step} className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="size-4 shrink-0 text-info" aria-hidden />
              <span>
                {index + 1}. {step}
              </span>
            </li>
          ))}
        </ol>
        <Button asChild variant="whatsapp" className="mt-6">
          <a
            href={whatsappUrl(whatsappMessages.general(store), store)}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Agendar Banho e Tosa com a ${store.name} pelo WhatsApp`}
          >
            <MessageCircle className="size-5" aria-hidden />
            Agendar pelo WhatsApp
          </a>
        </Button>
      </section>
    </div>
  );
}
