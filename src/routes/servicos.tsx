import { createFileRoute } from "@tanstack/react-router";
import { Scissors } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useStore } from "@/hooks/use-store";
import { whatsappMessages, whatsappUrl } from "@/lib/whatsapp";

export const Route = createFileRoute("/servicos")({
  head: () => ({
    meta: [
      { title: "Serviços para pets — Agropet Vira Lata" },
      {
        name: "description",
        content:
          "Serviços da Agropet Vira Lata em Ceilândia Sul, Brasília — DF. Agende pelo WhatsApp (61) 3399-7123.",
      },
      { property: "og:title", content: "Serviços para pets — Agropet Vira Lata" },
      { property: "og:description", content: "Banho e tosa e outros serviços para o seu animal." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/servicos" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/servicos" }],
  }),
  component: ServicosPage,
});

function ServicosPage() {
  const store = useStore();
  return (
    <div className="container-page py-10">
      <h1 className="text-2xl sm:text-3xl">Serviços</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        Os serviços serão cadastrados no painel administrativo com nome, descrição, preço, imagem e
        disponibilidade.
      </p>

      <div className="surface-card mt-8 flex flex-col items-center gap-3 p-10 text-center">
        <Scissors className="size-8 text-info" aria-hidden />
        <p className="font-display text-lg">Banho e tosa</p>
        <p className="max-w-md text-sm text-muted-foreground">
          Detalhes e valores ainda não informados. Fale com a {store.name} para consultar.
        </p>
        <Button asChild variant="whatsapp" className="mt-2">
          <a
            href={whatsappUrl(whatsappMessages.service("Banho e Tosa"))}
            target="_blank"
            rel="noopener noreferrer"
          >
            Consultar no WhatsApp
          </a>
        </Button>
      </div>
    </div>
  );
}