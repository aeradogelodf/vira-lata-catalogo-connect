import { createFileRoute } from "@tanstack/react-router";
import { Boxes, Package, Tags } from "lucide-react";

import { useAdminSummary } from "./admin";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminDashboard,
});

function Metric({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="admin-panel p-4">
      <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{label}</p>
      <p className="mt-2 font-display text-3xl font-bold tabular-nums">
        {value === null ? (
          <span className="text-sm font-medium text-muted-foreground">Sem dados ainda</span>
        ) : (
          value
        )}
      </p>
    </div>
  );
}

function AdminDashboard() {
  const { data } = useAdminSummary();
  const counts = data?.counts ?? null;

  return (
    <div className="space-y-8">
      <div>
        <p className="section-kicker">Painel</p>
        <h1 className="page-heading">Central de Controle</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Indicadores reais do catálogo. Nenhum dado é simulado.
        </p>
      </div>

      <section aria-labelledby="catalogo-heading" className="space-y-3">
        <h2 id="catalogo-heading" className="flex items-center gap-2 text-sm font-bold">
          <Package className="size-4 text-info" aria-hidden /> Catálogo
        </h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          <Metric label="Produtos cadastrados" value={counts?.products ?? null} />
          <Metric label="Produtos ativos" value={counts?.activeProducts ?? null} />
          <Metric label="Em destaque" value={counts?.featuredProducts ?? null} />
          <Metric label="Em promoção" value={counts?.onSaleProducts ?? null} />
          <Metric label="Categorias" value={counts?.categories ?? null} />
          <Metric label="Marcas" value={counts?.brands ?? null} />
        </div>
        {counts?.products === 0 && (
          <p className="admin-panel p-4 text-sm text-muted-foreground">
            Você ainda não possui produtos cadastrados. Use o módulo “Produtos” no menu lateral para
            cadastrar o primeiro item.
          </p>
        )}
      </section>

      <section aria-labelledby="operacao-heading" className="space-y-3">
        <h2 id="operacao-heading" className="flex items-center gap-2 text-sm font-bold">
          <Boxes className="size-4 text-info" aria-hidden /> Operação
        </h2>
        <div className="admin-panel p-4 text-sm text-muted-foreground">
          Pedidos, clientes, promoções e relatórios permanecem como módulos futuros.
        </div>
      </section>

      <section aria-labelledby="sessao-heading" className="space-y-3">
        <h2 id="sessao-heading" className="flex items-center gap-2 text-sm font-bold">
          <Tags className="size-4 text-info" aria-hidden /> Sessão
        </h2>
        <div className="admin-panel p-4 text-sm">
          <p>
            Conectado como <span className="font-semibold">{data?.email ?? "—"}</span>
          </p>
          <p className="text-muted-foreground">Papel: administrador</p>
        </div>
      </section>
    </div>
  );
}
