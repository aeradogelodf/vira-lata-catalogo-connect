import { createFileRoute, Link } from "@tanstack/react-router";
import { Construction } from "lucide-react";

import { Button } from "@/components/ui/button";
import { adminNavLabel } from "@/components/admin/admin-nav";

export const Route = createFileRoute("/_authenticated/admin/$")({
  component: AdminModulePlaceholder,
});

function AdminModulePlaceholder() {
  const { _splat } = Route.useParams();
  const slug = (_splat ?? "").split("/")[0] ?? "";
  const label = adminNavLabel(slug);

  return (
    <div className="surface-card p-8 text-center">
      <Construction className="mx-auto size-8 text-warning" aria-hidden />
      <h1 className="mt-3 font-display text-xl font-bold">{label ?? "Módulo administrativo"}</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Este módulo será configurado nas próximas etapas.
      </p>
      <Button asChild variant="outline" className="mt-5">
        <Link to="/admin">Voltar ao dashboard</Link>
      </Button>
    </div>
  );
}
