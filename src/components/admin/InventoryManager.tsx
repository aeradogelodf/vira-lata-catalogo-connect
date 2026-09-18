import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  ClipboardCheck,
  Download,
  History,
  Loader2,
  PackageCheck,
  RefreshCcw,
  Search,
  TriangleAlert,
} from "lucide-react";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { formatPrice } from "@/lib/catalog";
import {
  movementLabels,
  type InventoryDashboardData,
  type InventoryMovementType,
  type InventoryProduct,
} from "@/lib/inventory";
import { applyInventoryMovement, getInventoryDashboard } from "@/lib/inventory.functions";

type OperationTab = "entry" | "exit" | "adjustment" | "inventory";

function errorMessage(error: unknown) {
  return error instanceof Error && error.message ? error.message : "Não foi possível concluir a operação.";
}

function dateTime(value: string | null) {
  if (!value) return "Nenhuma movimentação";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

function Metric({ label, value, detail }: { label: string; value: string | number; detail?: string }) {
  return (
    <div className="admin-panel min-w-0 p-4">
      <p className="text-xs font-semibold text-muted-foreground uppercase">{label}</p>
      <p className="mt-2 break-words font-display text-xl font-bold tabular-nums sm:text-2xl">{value}</p>
      {detail && <p className="mt-1 text-xs text-muted-foreground">{detail}</p>}
    </div>
  );
}

export function InventoryManager() {
  const load = useServerFn(getInventoryDashboard);
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin", "inventory"],
    queryFn: () => load(),
    staleTime: 15_000,
  });
  const [tab, setTab] = useState("overview");

  if (isLoading) {
    return <div className="space-y-4" role="status"><Skeleton className="h-16 w-full" /><Skeleton className="h-36 w-full" /><Skeleton className="h-72 w-full" /><span className="sr-only">Carregando estoque…</span></div>;
  }

  if (isError || !data) {
    return (
      <Alert variant="destructive">
        <TriangleAlert aria-hidden />
        <AlertTitle>Não foi possível carregar o estoque</AlertTitle>
        <AlertDescription className="mt-3"><Button variant="outline" size="sm" onClick={() => refetch()}><RefreshCcw aria-hidden /> Tentar novamente</Button></AlertDescription>
      </Alert>
    );
  }

  function openOperation(next: OperationTab) { setTab(next); }

  return (
    <div className="space-y-6">
      <div>
        <p className="section-kicker">Catálogo</p>
        <h1 className="page-heading">Central de Estoque</h1>
        <p className="mt-1 text-sm text-muted-foreground">Saldos, movimentações, alertas e inventário em uma única operação.</p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="h-auto w-full justify-start gap-1 overflow-x-auto p-1">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="movements">Movimentações</TabsTrigger>
          <TabsTrigger value="entry">Entrada</TabsTrigger>
          <TabsTrigger value="exit">Saída</TabsTrigger>
          <TabsTrigger value="adjustment">Ajuste</TabsTrigger>
          <TabsTrigger value="inventory">Inventário</TabsTrigger>
          <TabsTrigger value="alerts">Alertas</TabsTrigger>
          <TabsTrigger value="reports">Relatórios</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6 space-y-6">
          <Overview data={data} onAction={openOperation} />
        </TabsContent>
        <TabsContent value="movements" className="mt-6"><Movements data={data} /></TabsContent>
        {(["entry", "exit", "adjustment", "inventory"] as OperationTab[]).map((type) => (
          <TabsContent key={type} value={type} className="mt-6"><OperationForm type={type} data={data} onDone={() => setTab("movements")} /></TabsContent>
        ))}
        <TabsContent value="alerts" className="mt-6"><Alerts data={data} onAction={openOperation} /></TabsContent>
        <TabsContent value="reports" className="mt-6"><Reports data={data} /></TabsContent>
      </Tabs>
    </div>
  );
}

function Overview({ data, onAction }: { data: InventoryDashboardData; onAction: (type: OperationTab) => void }) {
  const { summary } = data;
  const actions = [
    { type: "entry" as const, label: "Entrada", icon: ArrowDownToLine, variant: "success" as const },
    { type: "exit" as const, label: "Saída", icon: ArrowUpFromLine, variant: "outline" as const },
    { type: "adjustment" as const, label: "Ajuste", icon: RefreshCcw, variant: "info" as const },
    { type: "inventory" as const, label: "Inventário", icon: ClipboardCheck, variant: "secondary" as const },
  ];
  return (
    <>
      <section aria-labelledby="inventory-metrics" className="space-y-3">
        <h2 id="inventory-metrics" className="flex items-center gap-2 text-sm font-bold"><PackageCheck className="size-4 text-info" aria-hidden /> Visão atual</h2>
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-3">
          <Metric label="Produtos cadastrados" value={summary.products} />
          <Metric label="Produtos ativos" value={summary.activeProducts} />
          <Metric label="Estoque baixo" value={summary.lowStock} />
          <Metric label="Estoque zerado" value={summary.outOfStock} />
          <Metric label="Valor estimado" value={formatPrice(summary.estimatedValue)} detail="Preço de venda × saldo" />
          <Metric label="Última movimentação" value={dateTime(summary.lastMovementAt)} />
        </div>
      </section>
      <section aria-labelledby="quick-actions" className="space-y-3">
        <h2 id="quick-actions" className="text-sm font-bold">Ações rápidas</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {actions.map(({ type, label, icon: Icon, variant }) => <Button key={type} variant={variant} className="h-12" onClick={() => onAction(type)}><Icon aria-hidden /> {label}</Button>)}
        </div>
      </section>
      <RecentMovements data={data} limit={5} />
    </>
  );
}

function MovementTable({ data }: { data: InventoryDashboardData["movements"] }) {
  if (data.length === 0) return <div className="admin-panel p-8 text-center text-sm text-muted-foreground">Nenhuma movimentação registrada.</div>;
  return (
    <div className="admin-panel overflow-hidden">
      <Table>
        <TableHeader><TableRow><TableHead>Data</TableHead><TableHead>Produto</TableHead><TableHead>Tipo</TableHead><TableHead className="text-right">Qtd.</TableHead><TableHead className="text-right">Anterior</TableHead><TableHead className="text-right">Atual</TableHead><TableHead>Responsável</TableHead></TableRow></TableHeader>
        <TableBody>{data.map((row) => <TableRow key={row.id}>
          <TableCell className="whitespace-nowrap">{dateTime(row.createdAt)}</TableCell>
          <TableCell><p className="font-medium">{row.productName}</p><p className="text-xs text-muted-foreground">{row.productInternalCode}</p></TableCell>
          <TableCell><Badge variant="outline">{movementLabels[row.movementType]}</Badge></TableCell>
          <TableCell className="text-right font-semibold tabular-nums">{row.quantity > 0 ? `+${row.quantity}` : row.quantity}</TableCell>
          <TableCell className="text-right tabular-nums">{row.previousStock}</TableCell>
          <TableCell className="text-right font-semibold tabular-nums">{row.currentStock}</TableCell>
          <TableCell className="max-w-44 truncate" title={row.performedByEmail ?? "Administrador"}>{row.performedByEmail ?? "Administrador"}</TableCell>
        </TableRow>)}</TableBody>
      </Table>
    </div>
  );
}

function RecentMovements({ data, limit }: { data: InventoryDashboardData; limit: number }) {
  return <section className="space-y-3" aria-labelledby="recent-title"><h2 id="recent-title" className="flex items-center gap-2 text-sm font-bold"><History className="size-4 text-info" aria-hidden /> Movimentações recentes</h2><MovementTable data={data.movements.slice(0, limit)} /></section>;
}

function Movements({ data }: { data: InventoryDashboardData }) {
  const [search, setSearch] = useState("");
  const filtered = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("pt-BR");
    if (!term) return data.movements;
    return data.movements.filter((row) => `${row.productName} ${row.productInternalCode} ${row.performedByEmail ?? ""} ${movementLabels[row.movementType]} ${row.reason ?? ""}`.toLocaleLowerCase("pt-BR").includes(term));
  }, [data.movements, search]);
  return <div className="space-y-4"><div className="relative max-w-md"><Search className="absolute top-2.5 left-3 size-4 text-muted-foreground" aria-hidden /><Input className="pl-9" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por produto, tipo ou responsável" aria-label="Buscar movimentações" /></div><MovementTable data={filtered} /></div>;
}

function OperationForm({ type, data, onDone }: { type: OperationTab; data: InventoryDashboardData; onDone: () => void }) {
  const queryClient = useQueryClient();
  const apply = useServerFn(applyInventoryMovement);
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const product = data.products.find((item) => item.id === productId);
  const mutation = useMutation({
    mutationFn: () => {
      if (!product) throw new Error("Selecione um produto.");
      return apply({ data: { productId: product.id, movementType: type, quantity: Number(quantity), reason: reason.trim() || undefined, expectedUpdatedAt: product.updatedAt } });
    },
    onSuccess: async () => {
      toast.success(`${movementLabels[type]} registrada com sucesso.`);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin"] }),
        queryClient.invalidateQueries({ queryKey: ["catalog"] }),
      ]);
      onDone();
    },
    onError: (error) => toast.error(errorMessage(error)),
  });
  const resultingStock = product ? (type === "entry" ? product.stock + Number(quantity || 0) : type === "exit" ? product.stock - Number(quantity || 0) : Number(quantity || 0)) : null;
  const label = type === "entry" || type === "exit" ? "Quantidade" : "Novo saldo contado";
  return (
    <div className="admin-panel max-w-2xl p-5 sm:p-6">
      <h2 className="font-display text-xl font-bold">{movementLabels[type]}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{type === "inventory" ? "Registre a contagem física confirmada." : type === "adjustment" ? "Corrija uma divergência com justificativa obrigatória." : `${movementLabels[type]} de unidades no saldo atual.`}</p>
      <form className="mt-6 space-y-5" onSubmit={(event) => { event.preventDefault(); mutation.mutate(); }}>
        <div className="space-y-2"><Label htmlFor={`${type}-product`}>Produto</Label><Select value={productId} onValueChange={setProductId}><SelectTrigger id={`${type}-product`}><SelectValue placeholder="Selecione um produto" /></SelectTrigger><SelectContent>{data.products.map((item) => <SelectItem key={item.id} value={item.id}>{item.name} · saldo {item.stock}</SelectItem>)}</SelectContent></Select></div>
        <div className="space-y-2"><Label htmlFor={`${type}-quantity`}>{label}</Label><Input id={`${type}-quantity`} type="number" min={type === "entry" || type === "exit" ? 1 : 0} max={1_000_000} step={1} value={quantity} onChange={(event) => setQuantity(event.target.value)} required /></div>
        {(type === "adjustment" || type === "inventory") && <div className="space-y-2"><Label htmlFor={`${type}-reason`}>{type === "adjustment" ? "Motivo *" : "Observação"}</Label><Textarea id={`${type}-reason`} maxLength={300} value={reason} onChange={(event) => setReason(event.target.value)} required={type === "adjustment"} rows={3} /></div>}
        {product && <Alert><PackageCheck aria-hidden /><AlertTitle>Confirmação do saldo</AlertTitle><AlertDescription>Saldo atual: <strong>{product.stock}</strong>. Novo saldo: <strong className={resultingStock !== null && resultingStock < 0 ? "text-destructive" : ""}>{resultingStock}</strong>.</AlertDescription></Alert>}
        <Button type="submit" disabled={mutation.isPending || !productId || quantity === "" || (type === "adjustment" && !reason.trim())}>{mutation.isPending && <Loader2 className="animate-spin" aria-hidden />} Confirmar {movementLabels[type].toLocaleLowerCase("pt-BR")}</Button>
      </form>
    </div>
  );
}

function Alerts({ data, onAction }: { data: InventoryDashboardData; onAction: (type: OperationTab) => void }) {
  const zero = data.products.filter((item) => item.stock === 0);
  const low = data.products.filter((item) => item.stock > 0 && item.stock <= item.minStock);
  const Group = ({ title, products, destructive = false }: { title: string; products: InventoryProduct[]; destructive?: boolean }) => <section className="space-y-3"><h2 className="font-display text-lg font-bold">{title} <Badge variant={destructive ? "destructive" : "secondary"}>{products.length}</Badge></h2>{products.length === 0 ? <div className="admin-panel p-6 text-sm text-muted-foreground">Nenhum produto nesta situação.</div> : <div className="admin-panel divide-y">{products.map((product) => <div key={product.id} className="flex flex-wrap items-center gap-3 p-4"><div className="min-w-0 flex-1"><p className="truncate font-semibold">{product.name}</p><p className="text-xs text-muted-foreground">Saldo {product.stock} · mínimo {product.minStock}</p></div><Button variant="outline" size="sm" onClick={() => onAction("entry")}><ArrowDownToLine aria-hidden /> Entrada</Button></div>)}</div>}</section>;
  return <div className="grid gap-6 lg:grid-cols-2"><Group title="Estoque zerado" products={zero} destructive /><Group title="Estoque baixo" products={low} /></div>;
}

function Reports({ data }: { data: InventoryDashboardData }) {
  function exportCsv() {
    const header = ["Produto", "Código", "Status", "Saldo", "Estoque mínimo", "Preço", "Valor estimado"];
    const rows = data.products.map((product) => [product.name, product.internalCode, product.active ? "Ativo" : "Inativo", product.stock, product.minStock, product.price ?? "", product.stock * (product.price ?? 0)]);
    const csv = [header, ...rows].map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(";")).join("\n");
    const url = URL.createObjectURL(new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = `estoque-${new Date().toISOString().slice(0, 10)}.csv`; anchor.click(); URL.revokeObjectURL(url);
    toast.success("Relatório CSV exportado.");
  }
  return <div className="space-y-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-display text-xl font-bold">Resumo do estoque</h2><p className="text-sm text-muted-foreground">Posição atual por produto, pronta para conferência.</p></div><Button onClick={exportCsv}><Download aria-hidden /> Exportar CSV</Button></div><div className="grid grid-cols-2 gap-3 sm:grid-cols-3"><Metric label="Unidades em estoque" value={data.products.reduce((total, item) => total + item.stock, 0)} /><Metric label="Itens com alerta" value={data.summary.lowStock + data.summary.outOfStock} /><Metric label="Valor estimado" value={formatPrice(data.summary.estimatedValue)} /></div><div className="admin-panel overflow-hidden"><Table><TableHeader><TableRow><TableHead>Produto</TableHead><TableHead className="text-right">Saldo</TableHead><TableHead className="text-right">Mínimo</TableHead><TableHead className="text-right">Valor estimado</TableHead></TableRow></TableHeader><TableBody>{data.products.map((product) => <TableRow key={product.id}><TableCell><p className="font-medium">{product.name}</p><p className="text-xs text-muted-foreground">{product.internalCode}</p></TableCell><TableCell className="text-right tabular-nums">{product.stock}</TableCell><TableCell className="text-right tabular-nums">{product.minStock}</TableCell><TableCell className="text-right tabular-nums">{formatPrice(product.stock * (product.price ?? 0))}</TableCell></TableRow>)}</TableBody></Table></div></div>;
}