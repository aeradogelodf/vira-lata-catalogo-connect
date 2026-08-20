import { createFileRoute } from "@tanstack/react-router";

import { ProductManager } from "@/components/admin/ProductManager";

export const Route = createFileRoute("/_authenticated/admin/produtos")({
  component: ProductManager,
  head: () => ({
    meta: [
      { title: "Produtos | Painel Agropet Vira Lata" },
      {
        name: "description",
        content:
          "Cadastro e gestão de produtos do catálogo digital da Agropet Vira Lata Oficial.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});
