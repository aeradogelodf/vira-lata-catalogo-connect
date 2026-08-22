import { createFileRoute } from "@tanstack/react-router";
import { Clock, Globe, Mail, MapPin, Phone } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useStore } from "@/hooks/use-store";
import { storeQueries } from "@/lib/store-queries";
import { formatAddress, type StoreInfo } from "@/lib/store-settings";
import { localBusinessJsonLd } from "@/lib/store-seo";
import { whatsappMessages, whatsappUrl } from "@/lib/whatsapp";

export const Route = createFileRoute("/contato")({
  loader: ({ context }) => context.queryClient.ensureQueryData(storeQueries.settings()),
  head: ({ loaderData }) => {
    const store = loaderData as StoreInfo | undefined;
    const name = store?.name ?? "Agropet Vira Lata";
    const address = store ? formatAddress(store) : "";
    const phone = store?.whatsapp.display ?? store?.whatsapp.e164 ?? "";
    const title = `Contato e localização — ${name}`;
    const description = `${name}: ${address}. WhatsApp ${phone}.`;

    return {
      meta: [
        { title },
        { name: "description", content: description.slice(0, 158) },
        { property: "og:title", content: title },
        { property: "og:description", content: `Endereço, horários e WhatsApp da ${name}.` },
        { property: "og:type", content: "website" },
        { property: "og:url", content: "/contato" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [{ rel: "canonical", href: "/contato" }],
      scripts: store
        ? [
            {
              type: "application/ld+json",
              children: JSON.stringify(localBusinessJsonLd(store)),
            },
          ]
        : [],
    };
  },
  component: ContatoPage,
});

function ContatoPage() {
  const store = useStore();
  const address = formatAddress(store);
  const links = [
    { label: "Instagram", url: store.socials.instagram },
    { label: "Facebook", url: store.socials.facebook },
    { label: "TikTok", url: store.socials.tiktok },
    { label: "Site", url: store.socials.website },
    { label: "Outro link", url: store.socials.other },
  ].filter((item) => Boolean(item.url));

  return (
    <div className="container-page py-10">
      <h1 className="text-2xl sm:text-3xl">Contato</h1>
      <p className="mt-2 text-muted-foreground">
        O atendimento e o fechamento acontecem pelo WhatsApp.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {address && (
          <section className="surface-card p-6">
            <h2 className="flex items-center gap-2 text-lg">
              <MapPin className="size-5 text-primary" aria-hidden /> Endereço
            </h2>
            <address className="mt-2 text-sm not-italic text-muted-foreground">{address}</address>
          </section>
        )}

        <section className="surface-card p-6">
          <h2 className="flex items-center gap-2 text-lg">
            <Clock className="size-5 text-info" aria-hidden /> Horários
          </h2>
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
            {store.openingHours.map((h) => (
              <li key={h.day} className="flex justify-between gap-4">
                <span>{h.label}</span>
                <span>{h.opensAt && h.closesAt ? `${h.opensAt} às ${h.closesAt}` : "Fechado"}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="surface-card p-6 sm:col-span-2">
          <h2 className="flex items-center gap-2 text-lg">
            <Phone className="size-5 text-success" aria-hidden /> WhatsApp
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {store.whatsapp.display ?? store.whatsapp.e164}
          </p>
          {store.phone && (
            <p className="text-sm text-muted-foreground">Telefone: {store.phone}</p>
          )}
          {store.email && (
            <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="size-4" aria-hidden />
              <a className="underline-offset-4 hover:underline" href={`mailto:${store.email}`}>
                {store.email}
              </a>
            </p>
          )}
          <Button asChild variant="whatsapp" size="lg" className="mt-4">
            <a
              href={whatsappUrl(whatsappMessages.general(store), store)}
              target="_blank"
              rel="noopener noreferrer"
            >
              Falar no WhatsApp
            </a>
          </Button>
        </section>

        {links.length > 0 && (
          <section className="surface-card p-6 sm:col-span-2">
            <h2 className="flex items-center gap-2 text-lg">
              <Globe className="size-5 text-info" aria-hidden /> Redes e links
            </h2>
            <div className="mt-3 flex flex-wrap gap-3 text-sm">
              {links.map((item) => (
                <a
                  key={item.label}
                  href={item.url as string}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground underline-offset-4 hover:underline"
                >
                  {item.label}
                </a>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
