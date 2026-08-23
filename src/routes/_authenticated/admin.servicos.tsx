import { createFileRoute } from "@tanstack/react-router";

import { ServicesManager } from "@/components/admin/ServicesManager";

export const Route = createFileRoute("/_authenticated/admin/servicos")({
  head: () => ({
    meta: [
      { title: "Serviços — Painel Agropet Vira Lata" },
      {
        name: "description",
        content: "Gerencie banho e tosa e demais serviços da Agropet Vira Lata.",
      },
      { property: "og:title", content: "Serviços — Painel Agropet Vira Lata" },
      { property: "og:description", content: "Gestão dos serviços exibidos no catálogo." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: ServicesManager,
});
