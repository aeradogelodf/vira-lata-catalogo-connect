import { createFileRoute, Link } from "@tanstack/react-router";
import { Clock, Heart, MapPin, MessageCircle, Scissors, Tag } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useStore } from "@/hooks/use-store";
import { storeQueries } from "@/lib/store-queries";
import { formatAddress, type StoreInfo } from "@/lib/store-settings";
import { localBusinessJsonLd, organizationJsonLd } from "@/lib/store-seo";
import { whatsappMessages, whatsappUrl } from "@/lib/whatsapp";

export const Route = createFileRoute("/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(storeQueries.settings()),
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
    text: "Categorias, marcas, busca e filtros — chegando na Etapa 03.",
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
  return (
    <>
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

      <section className="container-page py-12">
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
