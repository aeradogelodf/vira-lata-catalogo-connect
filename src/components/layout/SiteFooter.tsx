import { Link } from "@tanstack/react-router";

import { useStore } from "@/hooks/use-store";
import { formatAddress } from "@/lib/store-settings";
import { whatsappMessages, whatsappUrl } from "@/lib/whatsapp";

export function SiteFooter() {
  const store = useStore();
  const address = formatAddress(store);
  const socials = [
    { label: "Instagram", url: store.socials.instagram },
    { label: "Facebook", url: store.socials.facebook },
    { label: "TikTok", url: store.socials.tiktok },
    { label: "Site", url: store.socials.website },
    { label: "Mais", url: store.socials.other },
  ].filter((item) => Boolean(item.url));

  return (
    <footer className="mt-16 border-t border-border bg-secondary/40">
      <div className="container-page grid gap-8 py-10 sm:grid-cols-3">
        <div>
          <p className="font-display text-lg font-bold">{store.name}</p>
          {store.segment && <p className="mt-2 text-sm text-muted-foreground">{store.segment}</p>}
          {socials.length > 0 && (
            <nav aria-label="Redes sociais" className="mt-3 flex flex-wrap gap-3 text-sm">
              {socials.map((item) => (
                <a
                  key={item.label}
                  href={item.url as string}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground"
                >
                  {item.label}
                </a>
              ))}
            </nav>
          )}
        </div>
        <div>
          <p className="font-display font-bold">Onde estamos</p>
          {address && (
            <address className="mt-2 text-sm not-italic text-muted-foreground">{address}</address>
          )}
        </div>
        <div>
          <p className="font-display font-bold">Atendimento</p>
          <a
            className="mt-2 inline-block text-sm text-muted-foreground underline-offset-4 hover:underline"
            href={whatsappUrl(whatsappMessages.general(store), store)}
            target="_blank"
            rel="noopener noreferrer"
          >
            WhatsApp {store.whatsapp.display ?? store.whatsapp.e164}
          </a>
          {store.email && (
            <a
              className="mt-1 block text-sm text-muted-foreground underline-offset-4 hover:underline"
              href={`mailto:${store.email}`}
            >
              {store.email}
            </a>
          )}
          <nav aria-label="Rodapé" className="mt-3 flex flex-wrap gap-3 text-sm">
            <Link to="/catalogo" className="text-muted-foreground hover:text-foreground">
              Catálogo
            </Link>
            <Link to="/servicos" className="text-muted-foreground hover:text-foreground">
              Banho & Tosa
            </Link>
            <Link to="/contato" className="text-muted-foreground hover:text-foreground">
              Contato
            </Link>
          </nav>
        </div>
      </div>
      <div className="container-page pb-6 text-xs text-muted-foreground">
        © {new Date().getFullYear()} {store.name}. Catálogo digital — os pedidos são finalizados
        pelo atendimento no WhatsApp.
      </div>
    </footer>
  );
}
