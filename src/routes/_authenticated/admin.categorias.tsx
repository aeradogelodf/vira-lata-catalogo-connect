import { createFileRoute } from "@tanstack/react-router";

import { TaxonomyManager } from "@/components/admin/TaxonomyManager";

export const Route = createFileRoute("/_authenticated/admin/categorias")({
  head: () => ({
    meta: [
      { title: "Categorias — Painel Agropet Vira Lata" },
      { name: "description", content: "Gerencie as categorias do catálogo da Agropet Vira Lata." },
      { property: "og:title", content: "Categorias — Painel Agropet Vira Lata" },
      { property: "og:description", content: "Gestão de categorias do catálogo." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: () => (
    <TaxonomyManager
      kind="categories"
      labels={{
        title: "Categorias",
        subtitle: "Organize as categorias exibidas no catálogo público.",
        singular: "Categoria",
        emptyTitle: "Nenhuma categoria cadastrada",
        emptyDescription: "Crie a primeira categoria para começar a organizar o catálogo.",
      }}
    />
  ),
});
