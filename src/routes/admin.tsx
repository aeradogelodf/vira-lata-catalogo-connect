import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * Reserva de rota administrativa (Etapa 07).
 * Quando o Lovable Cloud for ativado, esta rota é substituída por
 * `_authenticated/admin*`, com verificação de papel `admin` em tabela
 * separada (user_roles) e RLS no banco. Nenhum controle vive no cliente.
 */
export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Área administrativa — Agropet Vira Lata" },
      { name: "description", content: "Acesso restrito aos administradores da Agropet Vira Lata." },
      { property: "og:title", content: "Área administrativa — Agropet Vira Lata" },
      { property: "og:description", content: "Acesso restrito." },
      { property: "og:type", content: "website" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminPlaceholder,
});

function AdminPlaceholder() {
  return (
    <div className="container-page py-16">
      <div className="surface-card mx-auto max-w-lg p-8 text-center">
        <ShieldCheck className="mx-auto size-8 text-info" aria-hidden />
        <h1 className="mt-3 text-xl">Área administrativa</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Reservada. Autenticação, papéis de administrador e os módulos de conteúdo serão
          implementados na Etapa 07, com o banco protegido por RLS.
        </p>
        <Button asChild variant="outline" className="mt-5">
          <Link to="/">Voltar ao catálogo</Link>
        </Button>
      </div>
    </div>
  );
}