import { createFileRoute } from "@tanstack/react-router";

import { StoreSettingsManager } from "@/components/admin/StoreSettingsManager";

export const Route = createFileRoute("/_authenticated/admin/configuracoes")({
  head: () => ({
    meta: [
      { title: "Configurações da loja — Painel Agropet Vira Lata" },
      {
        name: "description",
        content: "Gerencie as informações institucionais exibidas no catálogo público.",
      },
      { property: "og:title", content: "Configurações da loja — Painel Agropet Vira Lata" },
      { property: "og:description", content: "Informações institucionais da loja." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: StoreSettingsManager,
});
