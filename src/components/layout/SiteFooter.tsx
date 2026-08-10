import { Link } from "@tanstack/react-router";

import { STORE, fullAddress } from "@/config/store";
import { whatsappMessages, whatsappUrl } from "@/lib/whatsapp";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-border bg-secondary/40">
      <div className="container-page grid gap-8 py-10 sm:grid-cols-3">
        <div>
          <p className="font-display text-lg font-bold">{STORE.name}</p>
          <p className="mt-2 text-sm text-muted-foreground">{STORE.segment}</p>
        </div>
        <div>
          <p className="font-display font-bold">Onde estamos</p>
          <address className="mt-2 text-sm not-italic text-muted-foreground">{fullAddress}</address>
        </div>
        <div>
          <p className="font-display font-bold">Atendimento</p>
          <a
            className="mt-2 inline-block text-sm text-muted-foreground underline-offset-4 hover:underline"
            href={whatsappUrl(whatsappMessages.general())}
            target="_blank"
            rel="noopener noreferrer"
          >
            WhatsApp {STORE.whatsapp.display}
          </a>
          <nav aria-label="Rodapé" className="mt-3 flex flex-wrap gap-3 text-sm">
            <Link to="/catalogo" className="text-muted-foreground hover:text-foreground">
              Catálogo
            </Link>
            <Link to="/servicos" className="text-muted-foreground hover:text-foreground">
              Serviços
            </Link>
            <Link to="/contato" className="text-muted-foreground hover:text-foreground">
              Contato
            </Link>
          </nav>
        </div>
      </div>
      <div className="container-page pb-6 text-xs text-muted-foreground">
        © {new Date().getFullYear()} {STORE.name}. Catálogo digital — os pedidos são finalizados
        pelo atendimento no WhatsApp.
      </div>
    </footer>
  );
}