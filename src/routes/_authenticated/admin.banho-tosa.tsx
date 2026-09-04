import { createFileRoute } from "@tanstack/react-router";

import { GroomingManager } from "@/components/admin/GroomingManager";

export const Route = createFileRoute("/_authenticated/admin/banho-tosa")({
  head: () => ({
    meta: [
      { title: "Banho & Tosa — Painel Agropet Vira Lata" },
      {
        name: "description",
        content: "Gerencie serviços, portes, preços e duração do Banho & Tosa.",
      },
      { property: "og:title", content: "Banho & Tosa — Painel Agropet Vira Lata" },
      { property: "og:description", content: "Serviços, portes, preços e duração." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: GroomingManager,
});
