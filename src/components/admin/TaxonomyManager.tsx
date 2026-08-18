import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  categoryFormSchema,
  slugify,
  type CategoryFormValues,
  type TaxonomyKind,
  type TaxonomyRow,
} from "@/lib/taxonomy";
import {
  deleteTaxonomy,
  listTaxonomy,
  saveTaxonomy,
  toggleTaxonomyActive,
} from "@/lib/taxonomy.functions";

type Labels = {
  title: string;
  subtitle: string;
  singular: string;
  emptyTitle: string;
  emptyDescription: string;
};

const EMPTY: CategoryFormValues = {
  name: "",
  slug: "",
  description: "",
  sortOrder: 0,
  active: true,
};

function errorMessage(error: unknown): string {
  return error instanceof Error && error.message
    ? error.message
    : "Não foi possível concluir a operação. Tente novamente.";
}

export function TaxonomyManager({ kind, labels }: { kind: TaxonomyKind; labels: Labels }) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<TaxonomyRow | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [toDelete, setToDelete] = useState<TaxonomyRow | null>(null);
  const [confirmClose, setConfirmClose] = useState(false);

  const list = useServerFn(listTaxonomy);
  const save = useServerFn(saveTaxonomy);
  const toggle = useServerFn(toggleTaxonomyActive);
  const remove = useServerFn(deleteTaxonomy);

  const query = useQuery({
    queryKey: ["admin", kind],
    queryFn: () => list({ data: { kind } }),
    retry: false,
  });

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: EMPTY,
  });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["admin", kind] });
    queryClient.invalidateQueries({ queryKey: ["admin", "summary"] });
    queryClient.invalidateQueries({ queryKey: ["catalog"] });
  }

  const saveMutation = useMutation({
    mutationFn: (values: CategoryFormValues) =>
      save({
        data: {
          kind,
          ...(editing ? { id: editing.id, expectedUpdatedAt: editing.updatedAt } : {}),
          values,
        },
      }),
    onSuccess: () => {
      toast.success(editing ? "Alterações salvas." : `${labels.singular} criada com sucesso.`);
      invalidate();
      setFormOpen(false);
      setEditing(null);
      form.reset(EMPTY);
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  const toggleMutation = useMutation({
    mutationFn: (row: TaxonomyRow) =>
      toggle({
        data: { kind, id: row.id, expectedUpdatedAt: row.updatedAt, active: !row.active },
      }),
    onSuccess: () => {
      toast.success("Status atualizado.");
      invalidate();
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  const deleteMutation = useMutation({
    mutationFn: (row: TaxonomyRow) => remove({ data: { kind, id: row.id } }),
    onSuccess: () => {
      toast.success("Registro excluído.");
      invalidate();
      setToDelete(null);
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    const all = query.data ?? [];
    if (!term) return all;
    return all.filter(
      (row) => row.name.toLowerCase().includes(term) || row.slug.toLowerCase().includes(term),
    );
  }, [query.data, search]);

  function openCreate() {
    setEditing(null);
    form.reset({ ...EMPTY, sortOrder: (query.data?.length ?? 0) });
    setFormOpen(true);
  }

  function openEdit(row: TaxonomyRow) {
    setEditing(row);
    form.reset({
      name: row.name,
      slug: row.slug,
      description: row.description ?? "",
      sortOrder: row.sortOrder,
      active: row.active,
    });
    setFormOpen(true);
  }

  function requestClose(open: boolean) {
    if (open) return;
    if (form.formState.isDirty && !saveMutation.isPending) {
      setConfirmClose(true);
      return;
    }
    setFormOpen(false);
    setEditing(null);
  }

  const errors = form.formState.errors;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">{labels.title}</h1>
          <p className="text-sm text-muted-foreground">{labels.subtitle}</p>
        </div>
        <Button onClick={openCreate}>
          <Plus aria-hidden />
          Nova {labels.singular.toLowerCase()}
        </Button>
      </div>

      <div className="surface-card flex items-center gap-2 p-3">
        <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Pesquisar por nome ou slug"
          aria-label="Pesquisar"
          className="border-0 bg-transparent shadow-none focus-visible:ring-0"
        />
      </div>

      {query.isPending ? (
        <div className="space-y-2">
          {[0, 1, 2].map((index) => (
            <Skeleton key={index} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      ) : query.isError ? (
        <div className="surface-card p-6 text-center">
          <p className="text-sm text-destructive">{errorMessage(query.error)}</p>
          <Button variant="outline" className="mt-3" onClick={() => query.refetch()}>
            Tentar novamente
          </Button>
        </div>
      ) : rows.length === 0 ? (
        <div className="surface-card p-8 text-center">
          <h2 className="font-display text-lg font-bold">
            {search ? "Nenhum resultado" : labels.emptyTitle}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {search
              ? "Ajuste a pesquisa para encontrar outros registros."
              : labels.emptyDescription}
          </p>
        </div>
      ) : (
        <>
          {/* Desktop */}
          <div className="surface-card hidden overflow-hidden md:block">
            <table className="w-full text-sm">
              <thead className="bg-muted/60 text-left text-xs font-semibold text-muted-foreground uppercase">
                <tr>
                  <th className="p-3">Nome</th>
                  <th className="p-3">Slug</th>
                  <th className="p-3">Ordem</th>
                  <th className="p-3">Produtos</th>
                  <th className="p-3">Ativo</th>
                  <th className="p-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-t border-border">
                    <td className="p-3 font-medium">{row.name}</td>
                    <td className="p-3 text-muted-foreground">{row.slug}</td>
                    <td className="p-3">{row.sortOrder}</td>
                    <td className="p-3">{row.productCount}</td>
                    <td className="p-3">
                      <Switch
                        checked={row.active}
                        disabled={toggleMutation.isPending}
                        onCheckedChange={() => toggleMutation.mutate(row)}
                        aria-label={row.active ? "Desativar" : "Ativar"}
                      />
                    </td>
                    <td className="p-3">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" aria-label="Editar" onClick={() => openEdit(row)}>
                          <Pencil />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Excluir"
                          onClick={() => setToDelete(row)}
                        >
                          <Trash2 className="text-destructive" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile */}
          <ul className="space-y-2 md:hidden">
            {rows.map((row) => (
              <li key={row.id} className="surface-card space-y-2 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{row.name}</p>
                    <p className="truncate text-xs text-muted-foreground">/{row.slug}</p>
                  </div>
                  <Switch
                    checked={row.active}
                    disabled={toggleMutation.isPending}
                    onCheckedChange={() => toggleMutation.mutate(row)}
                    aria-label={row.active ? "Desativar" : "Ativar"}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Ordem {row.sortOrder} · {row.productCount} produto(s)
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => openEdit(row)}>
                    <Pencil aria-hidden />
                    Editar
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setToDelete(row)}>
                    <Trash2 className="text-destructive" aria-hidden />
                    Excluir
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      <Dialog open={formOpen} onOpenChange={requestClose}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editing ? `Editar ${labels.singular.toLowerCase()}` : `Nova ${labels.singular.toLowerCase()}`}
            </DialogTitle>
            <DialogDescription>
              Os dados são gravados diretamente no banco e refletem no catálogo público.
            </DialogDescription>
          </DialogHeader>

          <form
            className="space-y-4"
            onSubmit={form.handleSubmit((values) => saveMutation.mutate(values))}
          >
            <div className="space-y-1.5">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                {...form.register("name", {
                  onChange: (event) => {
                    if (!editing && !form.getFieldState("slug").isDirty) {
                      form.setValue("slug", slugify(event.target.value));
                    }
                  },
                })}
              />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="slug">Slug</Label>
              <Input id="slug" {...form.register("slug")} />
              {errors.slug ? (
                <p className="text-xs text-destructive">{errors.slug.message}</p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Usado nas URLs. Deve ser único.
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description">Descrição (opcional)</Label>
              <Textarea id="description" rows={3} {...form.register("description")} />
              {errors.description && (
                <p className="text-xs text-destructive">{errors.description.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="sortOrder">Ordem de exibição</Label>
              <Input id="sortOrder" type="number" min={0} {...form.register("sortOrder")} />
              {errors.sortOrder && (
                <p className="text-xs text-destructive">{errors.sortOrder.message}</p>
              )}
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <Label htmlFor="active">Ativo</Label>
                <p className="text-xs text-muted-foreground">
                  Registros inativos não aparecem no catálogo público.
                </p>
              </div>
              <Switch
                id="active"
                checked={form.watch("active")}
                onCheckedChange={(checked) =>
                  form.setValue("active", checked, { shouldDirty: true })
                }
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => requestClose(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending && <Loader2 className="animate-spin" aria-hidden />}
                Salvar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmClose} onOpenChange={setConfirmClose}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Descartar alterações?</AlertDialogTitle>
            <AlertDialogDescription>
              Existem alterações não salvas neste formulário.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continuar editando</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setConfirmClose(false);
                setFormOpen(false);
                setEditing(null);
                form.reset(EMPTY);
              }}
            >
              Descartar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={toDelete !== null} onOpenChange={(open) => !open && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir “{toDelete?.name}”?</AlertDialogTitle>
            <AlertDialogDescription>
              {toDelete && toDelete.productCount > 0
                ? `Esta ${labels.singular.toLowerCase()} possui ${toDelete.productCount} produto(s) vinculado(s). Os produtos continuarão cadastrados, mas ficarão sem ${labels.singular.toLowerCase()}. Prefira desativar em vez de excluir.`
                : "Esta ação não pode ser desfeita."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            {toDelete && toDelete.productCount > 0 && toDelete.active && (
              <Button
                variant="outline"
                onClick={() => {
                  toggleMutation.mutate(toDelete);
                  setToDelete(null);
                }}
              >
                Desativar
              </Button>
            )}
            <AlertDialogAction
              disabled={deleteMutation.isPending}
              onClick={(event) => {
                event.preventDefault();
                if (toDelete) deleteMutation.mutate(toDelete);
              }}
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
