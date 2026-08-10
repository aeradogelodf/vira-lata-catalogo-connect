import { createFileRoute, Link } from "@tanstack/react-router";
import { PackageSearch } from "lucide-react";

import { Button } from "@/components/ui/button";
import { STORE } from "@/config/store";

export const Route = createFileRoute("/catalogo")({
  head: () => ({
    meta: [
      { title: "Catálogo de produtos — Agropet Vira Lata" },
      {
        name: "description",
        content:
          "Navegue pelo catálogo da Agropet Vira Lata: rações, acessórios e produtos para pets em Ceilândia Sul, Brasília — DF.",
      },
      { property: "og:title", content: "Catálogo de produtos — Agropet Vira Lata" },
      {
        property: "og:description",
        content: "Produtos para pets e agropecuária com atendimento pelo WhatsApp.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/catalogo" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/catalogo" }],
  }),
  component: CatalogoPage,
});

function CatalogoPage() {
  return (
    <div className="container-page py-10">
      <h1 className="text-2xl sm:text-3xl">Catálogo</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        Busca, categorias, marcas, filtros e ordenação serão ativados na Etapa 03, lendo os
        produtos cadastrados no painel da {STORE.name}.
      </p>

      <div className="surface-card mt-8 flex flex-col items-center gap-3 p-10 text-center">
        <PackageSearch className="size-8 text-muted-foreground" aria-hidden />
        <p className="font-display text-lg">Nenhum produto cadastrado ainda</p>
        <p className="max-w-md text-sm text-muted-foreground">
          Os produtos aparecerão aqui assim que forem cadastrados no painel administrativo.
        </p>
        <Button asChild variant="outline" className="mt-2">
          <Link to="/contato">Falar com a loja</Link>
        </Button>
      </div>
    </div>
  );
}