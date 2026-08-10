import { createFileRoute, Link } from "@tanstack/react-router";
import { Clock, Heart, MapPin, MessageCircle, Scissors, Tag } from "lucide-react";

import { Button } from "@/components/ui/button";
import { STORE, fullAddress } from "@/config/store";
import { whatsappMessages, whatsappUrl } from "@/lib/whatsapp";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Agropet Vira Lata — Catálogo digital em Ceilândia Sul, DF" },
      {
        name: "description",
        content:
          "Catálogo digital da Agropet Vira Lata: produtos e serviços para pets em Ceilândia Sul, Brasília — DF. Atendimento pelo WhatsApp (61) 3399-7123.",
      },
      { property: "og:title", content: "Agropet Vira Lata — Catálogo digital" },
      {
        property: "og:description",
        content: "Produtos e serviços para o seu animal, com atendimento direto pelo WhatsApp.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "LocalBusiness",
          name: STORE.name,
          description: STORE.shortDescription,
          telephone: `+${STORE.whatsapp.e164}`,
          address: {
            "@type": "PostalAddress",
            streetAddress: STORE.address.street,
            addressLocality: `${STORE.address.district}, ${STORE.address.city}`,
            addressRegion: STORE.address.state,
            postalCode: STORE.address.postalCode,
            addressCountry: STORE.address.country,
          },
        }),
      },
    ],
  }),
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
              <span className="text-primary">Agropet Vira Lata</span>
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
                  href={whatsappUrl(whatsappMessages.general())}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Falar no WhatsApp
                </a>
              </Button>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              WhatsApp {STORE.whatsapp.display}
            </p>
          </div>

          <div className="surface-card p-6">
            <h2 className="text-lg">Informações da loja</h2>
            <p className="mt-3 flex gap-2 text-sm text-muted-foreground">
              <MapPin className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
              {fullAddress}
            </p>
            <div className="mt-4 flex gap-2 text-sm text-muted-foreground">
              <Clock className="mt-0.5 size-4 shrink-0 text-info" aria-hidden />
              <ul className="w-full space-y-1">
                {STORE.openingHours.map((h) => (
                  <li key={h.day} className="flex justify-between gap-4">
                    <span>{h.label}</span>
                    <span>{h.opensAt ? `${h.opensAt} às ${h.closesAt}` : "Fechado"}</span>
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
