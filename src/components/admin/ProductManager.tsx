import { useEffect, useMemo, useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import {
  ExternalLink,
  Loader2,
  Package,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { ProductFormDialog } from "@/components/admin/ProductFormDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { resolveImageUrls } from "@/lib/product-images";
import { formatPrice } from "@/lib/catalog";
import type { AdminProductRow } from "@/lib/products";
import { deleteProduct, listProductsAdmin, toggleProductFlag } from "@/lib/products.functions";
import { listTaxonomy } from "@/lib/taxonomy.functions";

const PAGE_SIZE = 20;
const ALL = "__all__";

function message(error: unknown): string {
  return error instanceof Error && error.message
    ? error.message
    : "Não foi possível concluir a operação.";
}

export function ProductManager() {
  const queryClient = useQueryClient();
  const list = useServerFn(listProductsAdmin);
  const taxonomy = useServerFn(listTaxonomy);
  const toggle = useServerFn(toggleProductFlag);
  const remove = useServerFn(deleteProduct);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | "active" | "inactive">("all");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [brandId, setBrandId] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [dialog, setDialog] = useState<{ open: boolean; id: string | null }>({
    open: false,
    id: null,
  });
  const [pendingDelete, setPendingDelete] = useState<AdminProductRow | null>(null);
  const [thumbs, setThumbs] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(0);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const categories = useQuery({
    queryKey: ["admin", "taxonomy", "categories", "options"],
    queryFn: () => taxonomy({ data: { kind: "categories" as const } }),
  });
  const brands = useQuery({
    queryKey: ["admin", "taxonomy", "brands", "options"],
    queryFn: () => taxonomy({ data: { kind: "brands" as const } }),
  });

  const products = useQuery({
    queryKey: ["admin", "products", { search, status, categoryId, brandId, page }],
    queryFn: () =>
      list({
        data: {
          search: search || undefined,
          status,
          categoryId,
          brandId,
          page,
          pageSize: PAGE_SIZE,
        },
      }),
    placeholderData: keepPreviousData,
  });

  const rows = useMemo(() => products.data?.rows ?? [], [products.data]);
  const total = products.data?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  useEffect(() => {
    let active = true;
    const refs = rows.map((row) => row.primaryImage).filter((ref): ref is string => Boolean(ref));
    resolveImageUrls(refs).then((map) => {
      if (active) setThumbs(map);
    });
    return () => {
      active = false;
    };
  }, [rows]);

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
    queryClient.invalidateQueries({ queryKey: ["admin", "summary"] });
    queryClient.invalidateQueries({ queryKey: ["catalog"] });
  }

  const toggleMutation = useMutation({
    mutationFn: (input: {
      id: string;
      field: "active" | "featured" | "on_sale";
      value: boolean;
      expectedUpdatedAt: string;
    }) => toggle({ data: input }),
    onSuccess: invalidate,
    onError: (error) => toast.error(message(error)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => {
      toast.success("Produto excluído.");
      setPendingDelete(null);
      invalidate();
    },
    onError: (error) => toast.error(message(error)),
  });

  const filtersActive =
    search !== "" || status !== "all" || categoryId !== null || brandId !== null;

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Produtos</h1>
          <p className="text-sm text-muted-foreground">
            {total === 0 ? "Nenhum produto cadastrado" : `${total} produto(s) cadastrado(s)`} — o
            atendimento continua sendo feito pelo WhatsApp.
          </p>
        </div>
        <Button onClick={() => setDialog({ open: true, id: null })}>
          <Plus aria-hidden />
          Novo produto
        </Button>
      </header>

      <section className="surface-card space-y-4 p-4">
        <div className="space-y-1.5">
          <Label htmlFor="product-search">Buscar</Label>
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              id="product-search"
              className="pl-9"
              placeholder="Nome, slug, SKU ou código interno"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
            />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="filter-status">Situação</Label>
            <Select
              value={status}
              onValueChange={(value) => {
                setStatus(value as typeof status);
                setPage(0);
              }}
            >
              <SelectTrigger id="filter-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="inactive">Inativos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="filter-category">Categoria</Label>
            <Select
              value={categoryId ?? ALL}
              onValueChange={(value) => {
                setCategoryId(value === ALL ? null : value);
                setPage(0);
              }}
            >
              <SelectTrigger id="filter-category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Todas</SelectItem>
                {(categories.data ?? []).map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="filter-brand">Marca</Label>
            <Select
              value={brandId ?? ALL}
              onValueChange={(value) => {
                setBrandId(value === ALL ? null : value);
                setPage(0);
              }}
            >
              <SelectTrigger id="filter-brand">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Todas</SelectItem>
                {(brands.data ?? []).map((brand) => (
                  <SelectItem key={brand.id} value={brand.id}>
                    {brand.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {filtersActive && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearchInput("");
              setStatus("all");
              setCategoryId(null);
              setBrandId(null);
              setPage(0);
            }}
          >
            Limpar filtros
          </Button>
        )}
      </section>

      {products.isPending ? (
        <div className="space-y-3">
          {[0, 1, 2, 3].map((index) => (
            <Skeleton key={index} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : products.isError ? (
        <div className="surface-card p-8 text-center">
          <p className="text-sm text-destructive">{message(products.error)}</p>
          <Button variant="outline" className="mt-3" onClick={() => products.refetch()}>
            Tentar novamente
          </Button>
        </div>
      ) : rows.length === 0 ? (
        <div className="surface-card p-10 text-center">
          <Package className="mx-auto size-8 text-muted-foreground" aria-hidden />
          <h2 className="mt-3 font-display text-lg font-bold">
            {filtersActive ? "Nenhum produto encontrado" : "Nenhum produto cadastrado"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {filtersActive
              ? "Ajuste os filtros para ver outros resultados."
              : "Cadastre o primeiro produto para publicá-lo no catálogo."}
          </p>
          {!filtersActive && (
            <Button className="mt-4" onClick={() => setDialog({ open: true, id: null })}>
              <Plus aria-hidden />
              Novo produto
            </Button>
          )}
        </div>
      ) : (
        <ul className="space-y-3">
          {rows.map((row) => (
            <li key={row.id} className="surface-card p-4">
              <div className="flex gap-4">
                <div className="size-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                  {row.primaryImage && thumbs.get(row.primaryImage) ? (
                    <img
                      src={thumbs.get(row.primaryImage)}
                      alt=""
                      loading="lazy"
                      className="size-full object-cover"
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center">
                      <Package className="size-5 text-muted-foreground" aria-hidden />
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-display text-base font-bold">{row.name}</h2>
                    {!row.active && <Badge variant="outline">Inativo</Badge>}
                    {row.featured && <Badge variant="secondary">Destaque</Badge>}
                    {row.onSale && <Badge>Promoção</Badge>}
                    {row.stock === 0 && <Badge variant="outline">Sem estoque</Badge>}
                  </div>
                  <p className="truncate text-xs text-muted-foreground">
                    {row.internalCode}
                    {row.categoryName ? ` · ${row.categoryName}` : ""}
                    {row.brandName ? ` · ${row.brandName}` : ""}
                  </p>
                  <p className="text-sm">
                    {row.price === null ? (
                      <span className="text-muted-foreground">Preço sob consulta</span>
                    ) : (
                      <span className="font-semibold">{formatPrice(row.price)}</span>
                    )}
                    <span className="text-muted-foreground"> · estoque {row.stock}</span>
                  </p>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-border pt-3">
                {(
                  [
                    ["active", "Ativo", row.active],
                    ["featured", "Destaque", row.featured],
                    ["on_sale", "Promoção", row.onSale],
                  ] as const
                ).map(([field, label, value]) => (
                  <label key={field} className="flex items-center gap-2 text-xs">
                    <Switch
                      checked={value}
                      disabled={toggleMutation.isPending}
                      onCheckedChange={(checked) =>
                        toggleMutation.mutate({
                          id: row.id,
                          field,
                          value: checked,
                          expectedUpdatedAt: row.updatedAt,
                        })
                      }
                      aria-label={label}
                    />
                    {label}
                  </label>
                ))}

                <div className="ms-auto flex items-center gap-1">
                  <Button variant="ghost" size="sm" asChild>
                    <Link to="/produto/$slug" params={{ slug: row.slug }} target="_blank">
                      <ExternalLink aria-hidden />
                      Ver
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDialog({ open: true, id: row.id })}
                  >
                    <Pencil aria-hidden />
                    Editar
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Excluir ${row.name}`}
                    onClick={() => setPendingDelete(row)}
                  >
                    <Trash2 className="text-destructive" />
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {pageCount > 1 && (
        <nav className="flex items-center justify-between" aria-label="Paginação">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 0}
            onClick={() => setPage((value) => Math.max(0, value - 1))}
          >
            Anterior
          </Button>
          <span className="text-xs text-muted-foreground">
            Página {page + 1} de {pageCount}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page + 1 >= pageCount}
            onClick={() => setPage((value) => value + 1)}
          >
            Próxima
          </Button>
        </nav>
      )}

      <ProductFormDialog
        open={dialog.open}
        productId={dialog.id}
        categories={categories.data ?? []}
        brands={brands.data ?? []}
        onOpenChange={(open) => setDialog((current) => ({ open, id: open ? current.id : null }))}
      />

      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir “{pendingDelete?.name}”?</AlertDialogTitle>
            <AlertDialogDescription>
              O produto e suas imagens serão removidos definitivamente. Para apenas tirá-lo do
              catálogo, desative-o em vez de excluir.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                if (pendingDelete) deleteMutation.mutate(pendingDelete.id);
              }}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && <Loader2 className="animate-spin" aria-hidden />}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
