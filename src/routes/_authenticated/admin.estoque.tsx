import { createFileRoute } from "@tanstack/react-router";

import { InventoryManager } from "@/components/admin/InventoryManager";

export const Route = createFileRoute("/_authenticated/admin/estoque")({
  component: InventoryManager,
  head: () => ({
    meta: [
      { title: "Estoque | Painel Agropet Vira Lata" },
      { name: "description", content: "Central operacional de estoque da Agropet Vira Lata Oficial." },
      { property: "og:title", content: "Estoque | Painel Agropet Vira Lata" },
      { property: "og:description", content: "Saldos, movimentações, alertas e inventário." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});