import { Link } from "@tanstack/react-router";
import { Heart, Menu, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useStore } from "@/hooks/use-store";
import { useFavorites } from "@/hooks/use-favorites";
import { whatsappMessages, whatsappUrl } from "@/lib/whatsapp";
import logoAsset from "@/assets/logo-agropet-vira-lata.png.asset.json";


const navItems = [
  { to: "/", label: "Início" },
  { to: "/catalogo", label: "Catálogo" },
  { to: "/servicos", label: "Serviços" },
  { to: "/contato", label: "Contato" },
] as const;

export function SiteHeader() {
  const { count } = useFavorites();
  const store = useStore();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
      <div className="container-page flex h-16 items-center gap-3">
        <Link to="/" className="flex items-center gap-2" aria-label={`${store.name} — início`}>
          <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground font-display text-lg font-bold">
            V
          </span>
          <span className="font-display text-base leading-tight font-bold sm:text-lg">
            Agropet <span className="text-primary">Vira Lata</span>
          </span>
        </Link>

        <nav aria-label="Principal" className="ml-6 hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              activeProps={{ className: "bg-secondary text-foreground" }}
              activeOptions={{ exact: item.to === "/" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1">
          <Button asChild variant="ghost" size="icon" aria-label="Buscar produtos">
            <Link to="/catalogo">
              <Search />
            </Link>
          </Button>
          <Button asChild variant="ghost" size="icon" aria-label={`Favoritos (${count})`}>
            <Link to="/favoritos" className="relative">
              <Heart />
              {count > 0 && (
                <span className="absolute -top-0.5 -right-0.5 grid min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] leading-4 font-bold text-primary-foreground">
                  {count}
                </span>
              )}
            </Link>
          </Button>
          <Button asChild variant="whatsapp" size="sm" className="hidden sm:inline-flex">
            <a href={whatsappUrl(whatsappMessages.general(store), store)} target="_blank" rel="noopener noreferrer">
              WhatsApp
            </a>
          </Button>
          <Button asChild variant="ghost" size="icon" className="md:hidden" aria-label="Ver catálogo">
            <Link to="/catalogo">
              <Menu />
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}