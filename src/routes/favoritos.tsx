import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useFavorites } from "@/hooks/use-favorites";

export const Route = createFileRoute("/favoritos")({
  head: () => ({
    meta: [
      { title: "Meus favoritos — Agropet Vira Lata" },
      {
        name: "description",
        content:
          "Produtos que você salvou no catálogo da Agropet Vira Lata para consultar e pedir informações pelo WhatsApp.",
      },
      { property: "og:title", content: "Meus favoritos — Agropet Vira Lata" },
      { property: "og:description", content: "Sua lista de produtos de interesse." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/favoritos" },
      { name: "robots", content: "noindex" },
    ],
    links: [{ rel: "canonical", href: "/favoritos" }],
  }),
  component: FavoritosPage,
});

function FavoritosPage() {
  const { count, hydrated } = useFavorites();

  return (
    <div className="container-page py-10">
      <h1 className="text-2xl sm:text-3xl">Favoritos</h1>
      <p className="mt-2 text-muted-foreground">
        Sua lista de interesse fica salva neste dispositivo. Não é um pedido.
      </p>

      <div className="surface-card mt-8 flex flex-col items-center gap-3 p-10 text-center">
        <Heart className="size-8 text-primary" aria-hidden />
        <p className="font-display text-lg">
          {!hydrated || count === 0
            ? "Você ainda não salvou produtos"
            : `${count} produto(s) salvos`}
        </p>
        <p className="max-w-md text-sm text-muted-foreground">
          Toque no coração de um produto no catálogo para salvá-lo aqui.
        </p>
        <Button asChild className="mt-2">
          <Link to="/catalogo">Ver catálogo</Link>
        </Button>
      </div>
    </div>
  );
}