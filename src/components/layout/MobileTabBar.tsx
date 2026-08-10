import { Link } from "@tanstack/react-router";
import { Heart, Home, MessageCircle, Store } from "lucide-react";

import { whatsappMessages, whatsappUrl } from "@/lib/whatsapp";

const items = [
  { to: "/", label: "Início", icon: Home, exact: true },
  { to: "/catalogo", label: "Catálogo", icon: Store, exact: false },
  { to: "/favoritos", label: "Favoritos", icon: Heart, exact: false },
] as const;

export function MobileTabBar() {
  return (
    <nav
      aria-label="Navegação rápida"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      <ul className="grid grid-cols-4">
        {items.map((item) => (
          <li key={item.to}>
            <Link
              to={item.to}
              activeOptions={{ exact: item.exact }}
              activeProps={{ className: "text-primary" }}
              className="flex flex-col items-center gap-1 py-2 text-[11px] font-medium text-muted-foreground"
            >
              <item.icon className="size-5" aria-hidden />
              {item.label}
            </Link>
          </li>
        ))}
        <li>
          <a
            href={whatsappUrl(whatsappMessages.general())}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-1 py-2 text-[11px] font-medium text-whatsapp"
          >
            <MessageCircle className="size-5" aria-hidden />
            WhatsApp
          </a>
        </li>
      </ul>
    </nav>
  );
}