import { createFileRoute } from "@tanstack/react-router";

import { BannersManager } from "@/components/admin/BannersManager";

export const Route = createFileRoute("/_authenticated/admin/banners")({
  head: () => ({
    meta: [
      { title: "Banners — Painel Agropet Vira Lata" },
      {
        name: "description",
        content: "Gerencie os banners e campanhas visuais da página inicial.",
      },
      { property: "og:title", content: "Banners — Painel Agropet Vira Lata" },
      { property: "og:description", content: "Gestão dos banners exibidos na Home." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: BannersManager,
});
