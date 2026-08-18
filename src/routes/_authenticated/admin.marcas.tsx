import { createFileRoute } from "@tanstack/react-router";

import { TaxonomyManager } from "@/components/admin/TaxonomyManager";

export const Route = createFileRoute("/_authenticated/admin/marcas")({
  head: () => ({
    meta: [
      { title: "Marcas — Painel Agropet Vira Lata" },
      { name: "description", content: "Gerencie as marcas do catálogo da Agropet Vira Lata." },
      { property: "og:title", content: "Marcas — Painel Agropet Vira Lata" },
      { property: "og:description", content: "Gestão de marcas do catálogo." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: () => (
    <TaxonomyManager
      kind="brands"
      labels={{
        title: "Marcas",
        subtitle: "Cadastre as marcas usadas nos filtros do catálogo.",
        singular: "Marca",
        emptyTitle: "Nenhuma marca cadastrada",
        emptyDescription: "Crie a primeira marca para habilitar os filtros por fabricante.",
      }}
    />
  ),
});
