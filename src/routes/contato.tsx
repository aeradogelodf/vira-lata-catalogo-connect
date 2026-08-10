import { createFileRoute } from "@tanstack/react-router";
import { Clock, MapPin, Phone } from "lucide-react";

import { Button } from "@/components/ui/button";
import { STORE, fullAddress } from "@/config/store";
import { whatsappMessages, whatsappUrl } from "@/lib/whatsapp";

export const Route = createFileRoute("/contato")({
  head: () => ({
    meta: [
      { title: "Contato e localização — Agropet Vira Lata" },
      {
        name: "description",
        content:
          "Agropet Vira Lata: QN 7, Conjunto B, Setor Norte, Ceilândia Sul, Brasília — DF. WhatsApp (61) 3399-7123.",
      },
      { property: "og:title", content: "Contato e localização — Agropet Vira Lata" },
      { property: "og:description", content: "Endereço, horários e WhatsApp da Agropet Vira Lata." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/contato" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/contato" }],
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
          openingHoursSpecification: [
            {
              "@type": "OpeningHoursSpecification",
              dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
              opens: "07:00",
              closes: "19:00",
            },
            {
              "@type": "OpeningHoursSpecification",
              dayOfWeek: ["Saturday"],
              opens: "08:00",
              closes: "19:00",
            },
          ],
        }),
      },
    ],
  }),
  component: ContatoPage,
});

function ContatoPage() {
  return (
    <div className="container-page py-10">
      <h1 className="text-2xl sm:text-3xl">Contato</h1>
      <p className="mt-2 text-muted-foreground">
        O atendimento e o fechamento acontecem pelo WhatsApp.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <section className="surface-card p-6">
          <h2 className="flex items-center gap-2 text-lg">
            <MapPin className="size-5 text-primary" aria-hidden /> Endereço
          </h2>
          <address className="mt-2 text-sm not-italic text-muted-foreground">{fullAddress}</address>
        </section>

        <section className="surface-card p-6">
          <h2 className="flex items-center gap-2 text-lg">
            <Clock className="size-5 text-info" aria-hidden /> Horários
          </h2>
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
            {STORE.openingHours.map((h) => (
              <li key={h.day} className="flex justify-between gap-4">
                <span>{h.label}</span>
                <span>{h.opensAt ? `${h.opensAt} às ${h.closesAt}` : "Fechado"}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="surface-card p-6 sm:col-span-2">
          <h2 className="flex items-center gap-2 text-lg">
            <Phone className="size-5 text-success" aria-hidden /> WhatsApp
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">{STORE.whatsapp.display}</p>
          <Button asChild variant="whatsapp" size="lg" className="mt-4">
            <a
              href={whatsappUrl(whatsappMessages.general())}
              target="_blank"
              rel="noopener noreferrer"
            >
              Falar no WhatsApp
            </a>
          </Button>
        </section>
      </div>
    </div>
  );
}