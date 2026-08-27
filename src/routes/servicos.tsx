import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Scissors } from "lucide-react";

import { EmptyState } from "@/components/catalog/EmptyState";
import { Button } from "@/components/ui/button";
import { useStore } from "@/hooks/use-store";
import { formatPrice } from "@/lib/catalog";
import { serviceQueries } from "@/lib/services-queries";
import { SITE_URL } from "@/lib/site";
import { storeQueries } from "@/lib/store-queries";
import { whatsappMessages, whatsappUrl } from "@/lib/whatsapp";

export const Route = createFileRoute("/servicos")({
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(serviceQueries.public()),
      context.queryClient.ensureQueryData(storeQueries.settings()),
    ]);
  },
  head: () => ({
    meta: [
      { title: "Serviços para pets — Agropet Vira Lata" },
      {
        name: "description",
        content:
          "Serviços da Agropet Vira Lata em Ceilândia Sul, Brasília — DF: banho e tosa e mais, com agendamento pelo WhatsApp.",
      },
      { property: "og:title", content: "Serviços para pets — Agropet Vira Lata" },
      { property: "og:description", content: "Banho e tosa e outros serviços para o seu animal." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${SITE_URL}/servicos` },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/servicos` }],
  }),
  errorComponent: () => (
    <div className="container-page py-10">
      <EmptyState
        title="Não foi possível carregar os serviços"
        description="Tente novamente em instantes."
      />
    </div>
  ),
  notFoundComponent: () => (
    <div className="container-page py-10">
      <EmptyState title="Página não encontrada" />
    </div>
  ),
  component: ServicosPage,
});

function ServicosPage() {
  const store = useStore();
  const { data: services } = useSuspenseQuery(serviceQueries.public());

  return (
    <div className="container-page py-10">
      <h1 className="text-2xl sm:text-3xl">Serviços</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        Escolha o serviço e fale com a {store.name} pelo WhatsApp para agendar.
      </p>

      {services.length === 0 ? (
        <EmptyState
          className="mt-8"
          icon={<Scissors className="size-8 text-info" aria-hidden />}
          title="Nenhum serviço publicado"
          description={`Os serviços ainda não foram cadastrados. Fale com a ${store.name} para consultar disponibilidade.`}
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
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <li key={service.id} className="surface-card flex flex-col overflow-hidden">
              {service.imageUrl ? (
                <img
                  src={service.imageUrl}
                  alt={`Serviço ${service.name} na ${store.name}`}
                  width={800}
                  height={600}
                  className="aspect-[4/3] w-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                <div className="grid aspect-[4/3] w-full place-items-center bg-secondary" aria-hidden>
                  <Scissors className="size-8 text-muted-foreground" />
                </div>
              )}
              <div className="flex flex-1 flex-col p-5">
                <h2 className="font-display text-lg font-bold">{service.name}</h2>
                {service.description && (
                  <p className="mt-2 text-sm text-muted-foreground">{service.description}</p>
                )}
                <p className="mt-3 font-display text-base">
                  {service.price !== null ? formatPrice(service.price) : "Preço sob consulta"}
                  {service.priceNote && (
                    <span className="ml-2 text-xs font-normal text-muted-foreground">
                      {service.priceNote}
                    </span>
                  )}
                </p>
                <Button asChild variant="whatsapp" className="mt-4 w-full">
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
      )}
    </div>
  );
}
