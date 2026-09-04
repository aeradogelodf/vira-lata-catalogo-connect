import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Pencil, Plus, Ruler, Scissors, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { ServicesManager } from "@/components/admin/ServicesManager";
import { EmptyState } from "@/components/catalog/EmptyState";
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
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { formatPrice } from "@/lib/catalog";
import {
  emptyPetSizeForm,
  emptyPricingForm,
  formatDuration,
  petSizeFormSchema,
  servicePricingFormSchema,
  slugify,
  toPetSizeForm,
  toPricingForm,
  type PetSize,
  type PetSizeFormValues,
  type ServicePricing,
  type ServicePricingFormValues,
} from "@/lib/grooming";
import {
  deletePetSize,
  deleteServicePricing,
  listPetSizesAdmin,
  listServicePricingAdmin,
  savePetSize,
  saveServicePricing,
  togglePetSize,
  toggleServicePricing,
} from "@/lib/grooming.functions";
import { listServicesAdmin } from "@/lib/services.functions";
import type { AdminService } from "@/lib/services";

function message(error: unknown): string {
  return error instanceof Error && error.message
    ? error.message
    : "Não foi possível concluir a operação.";
}

export function GroomingManager() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl">Banho &amp; Tosa</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Serviços, portes e a combinação serviço + porte com preço e duração.
        </p>
      </div>

      <Tabs defaultValue="servicos">
        <TabsList className="w-full flex-wrap justify-start sm:w-auto">
          <TabsTrigger value="servicos">Serviços</TabsTrigger>
          <TabsTrigger value="portes">Portes</TabsTrigger>
          <TabsTrigger value="precos">Preços e duração</TabsTrigger>
        </TabsList>

        <TabsContent value="servicos" className="mt-6">
          <ServicesManager />
        </TabsContent>
        <TabsContent value="portes" className="mt-6">
          <PetSizesPanel />
        </TabsContent>
        <TabsContent value="precos" className="mt-6">
          <PricingPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* -------------------------------- Portes -------------------------------- */

function PetSizesPanel() {
  const queryClient = useQueryClient();
  const list = useServerFn(listPetSizesAdmin);
  const toggle = useServerFn(togglePetSize);
  const remove = useServerFn(deletePetSize);

  const [editing, setEditing] = useState<PetSize | null>(null);
  const [creating, setCreating] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<PetSize | null>(null);

  const { data: sizes, isLoading } = useQuery({
    queryKey: ["admin", "pet-sizes"],
    queryFn: () => list({ data: undefined }),
  });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["admin", "pet-sizes"] });
    queryClient.invalidateQueries({ queryKey: ["services", "public"] });
  }

  const toggleMutation = useMutation({
    mutationFn: (input: { id: string; value: boolean }) => toggle({ data: input }),
    onSuccess: invalidate,
    onError: (error) => toast.error(message(error)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => {
      toast.success("Porte excluído.");
      setPendingDelete(null);
      invalidate();
    },
    onError: (error) => toast.error(message(error)),
  });

  const nextSortOrder = useMemo(
    () => (sizes?.length ? Math.max(...sizes.map((s) => s.sortOrder)) + 1 : 0),
    [sizes],
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Cadastre os portes atendidos pela loja (ex.: por tamanho do pet).
        </p>
        <Button onClick={() => setCreating(true)}>
          <Plus aria-hidden /> Novo porte
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-3">
          {[0, 1].map((key) => (
            <Skeleton key={key} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : (sizes ?? []).length === 0 ? (
        <EmptyState
          icon={<Ruler className="size-8 text-info" aria-hidden />}
          title="Nenhum porte cadastrado"
          description="Cadastre os portes antes de configurar preços e duração por serviço."
          action={
            <Button onClick={() => setCreating(true)}>
              <Plus aria-hidden /> Cadastrar porte
            </Button>
          }
        />
      ) : (
        <ul className="grid gap-3">
          {(sizes ?? []).map((size) => (
            <li key={size.id} className="surface-card flex flex-wrap items-center gap-4 p-4">
              <div className="min-w-40 flex-1">
                <p className="font-display font-bold">{size.name}</p>
                <p className="text-xs text-muted-foreground">/{size.slug}</p>
                {size.description && (
                  <p className="mt-1 text-sm text-muted-foreground">{size.description}</p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Switch
                    checked={size.active}
                    onCheckedChange={(value) => toggleMutation.mutate({ id: size.id, value })}
                    aria-label={`Ativar o porte ${size.name}`}
                  />
                  {size.active ? "Ativo" : "Inativo"}
                </label>
                <Button
                  variant="outline"
                  size="icon"
                  aria-label={`Editar ${size.name}`}
                  onClick={() => setEditing(size)}
                >
                  <Pencil />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Excluir ${size.name}`}
                  onClick={() => setPendingDelete(size)}
                >
                  <Trash2 className="text-destructive" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {(creating || editing) && (
        <PetSizeFormDialog
          size={editing}
          nextSortOrder={nextSortOrder}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
          onSaved={invalidate}
        />
      )}

      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir “{pendingDelete?.name}”?</AlertDialogTitle>
            <AlertDialogDescription>
              A exclusão é permanente. Se quiser apenas parar de oferecer este porte, desative-o.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => pendingDelete && deleteMutation.mutate(pendingDelete.id)}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function PetSizeFormDialog({
  size,
  nextSortOrder,
  onClose,
  onSaved,
}: {
  size: PetSize | null;
  nextSortOrder: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  const save = useServerFn(savePetSize);
  const form = useForm<PetSizeFormValues>({
    resolver: zodResolver(petSizeFormSchema) as never,
    defaultValues: size ? toPetSizeForm(size) : emptyPetSizeForm(nextSortOrder),
  });

  const mutation = useMutation({
    mutationFn: (values: PetSizeFormValues) =>
      save({ data: { id: size?.id, values: petSizeFormSchema.parse(values) } }),
    onSuccess: () => {
      toast.success(size ? "Porte atualizado." : "Porte cadastrado.");
      onSaved();
      onClose();
    },
    onError: (error) => toast.error(message(error)),
  });

  const errors = form.formState.errors;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{size ? "Editar porte" : "Novo porte"}</DialogTitle>
          <DialogDescription>
            O porte é usado junto com o serviço para definir preço e duração.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
          noValidate
        >
          <div className="space-y-2">
            <Label htmlFor="size-name">Nome *</Label>
            <Input
              id="size-name"
              {...form.register("name", {
                onChange: (event) => {
                  if (!size) form.setValue("slug", slugify(event.target.value));
                },
              })}
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? "size-name-error" : undefined}
            />
            {errors.name && (
              <p id="size-name-error" className="text-sm text-destructive">
                {errors.name.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="size-slug">Identificador *</Label>
            <Input
              id="size-slug"
              {...form.register("slug")}
              aria-invalid={Boolean(errors.slug)}
              aria-describedby={errors.slug ? "size-slug-error" : undefined}
            />
            {errors.slug && (
              <p id="size-slug-error" className="text-sm text-destructive">
                {errors.slug.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="size-description">Descrição</Label>
            <Textarea id="size-description" rows={3} {...form.register("description")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="size-order">Ordem de exibição</Label>
            <Input
              id="size-order"
              type="number"
              min={0}
              {...form.register("sortOrder")}
              aria-invalid={Boolean(errors.sortOrder)}
            />
            {errors.sortOrder && (
              <p className="text-sm text-destructive">{errors.sortOrder.message}</p>
            )}
          </div>

          <label className="flex items-center gap-3 text-sm">
            <Switch
              checked={Boolean(form.watch("active"))}
              onCheckedChange={(value) => form.setValue("active", value)}
              aria-label="Porte ativo"
            />
            Porte ativo
          </label>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="animate-spin" aria-hidden />}
              Salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* -------------------------- Preços e duração ---------------------------- */

type PricingRow = {
  service: AdminService;
  size: PetSize;
  pricing: ServicePricing | null;
};

function PricingPanel() {
  const queryClient = useQueryClient();
  const listServices = useServerFn(listServicesAdmin);
  const listSizes = useServerFn(listPetSizesAdmin);
  const listPricing = useServerFn(listServicePricingAdmin);
  const toggle = useServerFn(toggleServicePricing);
  const remove = useServerFn(deleteServicePricing);

  const [editingRow, setEditingRow] = useState<PricingRow | null>(null);
  const [pendingDelete, setPendingDelete] = useState<PricingRow | null>(null);

  const servicesQuery = useQuery({
    queryKey: ["admin", "services", ""],
    queryFn: () => listServices({ data: {} }),
  });
  const sizesQuery = useQuery({
    queryKey: ["admin", "pet-sizes"],
    queryFn: () => listSizes({ data: undefined }),
  });
  const pricingQuery = useQuery({
    queryKey: ["admin", "service-pricing"],
    queryFn: () => listPricing({ data: undefined }),
  });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["admin", "service-pricing"] });
    queryClient.invalidateQueries({ queryKey: ["services", "public"] });
  }

  const toggleMutation = useMutation({
    mutationFn: (input: { id: string; value: boolean }) => toggle({ data: input }),
    onSuccess: invalidate,
    onError: (error) => toast.error(message(error)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => {
      toast.success("Configuração removida.");
      setPendingDelete(null);
      invalidate();
    },
    onError: (error) => toast.error(message(error)),
  });

  const isLoading = servicesQuery.isLoading || sizesQuery.isLoading || pricingQuery.isLoading;
  const services = servicesQuery.data ?? [];
  const sizes = sizesQuery.data ?? [];
  const pricing = pricingQuery.data ?? [];

  // Uma linha por combinação serviço + porte, com ou sem configuração.
  const rows: PricingRow[] = useMemo(
    () =>
      services.flatMap((service) =>
        sizes.map((size) => ({
          service,
          size,
          pricing:
            pricing.find((row) => row.serviceId === service.id && row.sizeId === size.id) ?? null,
        })),
      ),
    [services, sizes, pricing],
  );

  if (isLoading) {
    return (
      <div className="grid gap-3">
        {[0, 1, 2].map((key) => (
          <Skeleton key={key} className="h-16 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (services.length === 0 || sizes.length === 0) {
    return (
      <EmptyState
        icon={<Scissors className="size-8 text-info" aria-hidden />}
        title="Configuração incompleta"
        description={
          services.length === 0
            ? "Cadastre pelo menos um serviço na aba “Serviços” para configurar preços."
            : "Cadastre pelo menos um porte na aba “Portes” para configurar preços."
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Cada combinação de serviço e porte pode ter preço, duração e disponibilidade próprios.
      </p>

      {/* Lista em cards no celular e tabela a partir de tablet. */}
      <div className="overflow-x-auto">
        <table className="hidden w-full min-w-[720px] text-left text-sm sm:table">
          <thead className="text-xs text-muted-foreground uppercase">
            <tr>
              <th scope="col" className="px-3 py-2">Serviço</th>
              <th scope="col" className="px-3 py-2">Porte</th>
              <th scope="col" className="px-3 py-2">Preço</th>
              <th scope="col" className="px-3 py-2">Duração</th>
              <th scope="col" className="px-3 py-2">Status</th>
              <th scope="col" className="px-3 py-2 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={`${row.service.id}-${row.size.id}`} className="border-t border-border">
                <td className="px-3 py-3 font-medium">{row.service.name}</td>
                <td className="px-3 py-3">{row.size.name}</td>
                <td className="px-3 py-3">
                  {row.pricing ? formatPrice(row.pricing.price) : "—"}
                </td>
                <td className="px-3 py-3">
                  {row.pricing ? formatDuration(row.pricing.durationMinutes) : "—"}
                </td>
                <td className="px-3 py-3">
                  {row.pricing ? (
                    <label className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Switch
                        checked={row.pricing.active}
                        onCheckedChange={(value) =>
                          toggleMutation.mutate({ id: row.pricing!.id, value })
                        }
                        aria-label={`Disponibilizar ${row.service.name} para o porte ${row.size.name}`}
                      />
                      {row.pricing.active ? "Disponível" : "Indisponível"}
                    </label>
                  ) : (
                    <span className="text-xs text-muted-foreground">Não configurado</span>
                  )}
                </td>
                <td className="px-3 py-3">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingRow(row)}
                      aria-label={`${row.pricing ? "Editar" : "Configurar"} ${row.service.name} para o porte ${row.size.name}`}
                    >
                      {row.pricing ? "Editar" : "Configurar"}
                    </Button>
                    {row.pricing && (
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Remover configuração de ${row.service.name} para o porte ${row.size.name}`}
                        onClick={() => setPendingDelete(row)}
                      >
                        <Trash2 className="text-destructive" />
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="grid gap-3 sm:hidden">
        {rows.map((row) => (
          <li key={`${row.service.id}-${row.size.id}`} className="surface-card space-y-2 p-4">
            <p className="font-display font-bold">{row.service.name}</p>
            <p className="text-sm text-muted-foreground">Porte: {row.size.name}</p>
            <p className="text-sm">
              {row.pricing
                ? `${formatPrice(row.pricing.price)} · ${formatDuration(row.pricing.durationMinutes)}`
                : "Ainda não configurado"}
            </p>
            {row.pricing && (
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                <Switch
                  checked={row.pricing.active}
                  onCheckedChange={(value) => toggleMutation.mutate({ id: row.pricing!.id, value })}
                  aria-label={`Disponibilizar ${row.service.name} para o porte ${row.size.name}`}
                />
                {row.pricing.active ? "Disponível" : "Indisponível"}
              </label>
            )}
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setEditingRow(row)}>
                {row.pricing ? "Editar" : "Configurar"}
              </Button>
              {row.pricing && (
                <Button variant="ghost" size="sm" onClick={() => setPendingDelete(row)}>
                  Remover
                </Button>
              )}
            </div>
          </li>
        ))}
      </ul>

      {editingRow && (
        <PricingFormDialog
          row={editingRow}
          onClose={() => setEditingRow(null)}
          onSaved={invalidate}
        />
      )}

      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover configuração?</AlertDialogTitle>
            <AlertDialogDescription>
              O preço e a duração desta combinação serão apagados. Para apenas suspender a oferta,
              desative a combinação.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                pendingDelete?.pricing && deleteMutation.mutate(pendingDelete.pricing.id)
              }
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function PricingFormDialog({
  row,
  onClose,
  onSaved,
}: {
  row: PricingRow;
  onClose: () => void;
  onSaved: () => void;
}) {
  const save = useServerFn(saveServicePricing);
  const form = useForm<ServicePricingFormValues>({
    resolver: zodResolver(servicePricingFormSchema) as never,
    defaultValues: row.pricing
      ? toPricingForm(row.pricing)
      : emptyPricingForm(row.service.id, row.size.id),
  });

  const mutation = useMutation({
    mutationFn: (values: ServicePricingFormValues) =>
      save({ data: { id: row.pricing?.id, values: servicePricingFormSchema.parse(values) } }),
    onSuccess: () => {
      toast.success("Configuração salva.");
      onSaved();
      onClose();
    },
    onError: (error) => toast.error(message(error)),
  });

  const errors = form.formState.errors;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {row.service.name} · {row.size.name}
          </DialogTitle>
          <DialogDescription>Defina o preço e a duração desta combinação.</DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
          noValidate
        >
          <div className="space-y-2">
            <Label htmlFor="pricing-price">Preço (R$) *</Label>
            <Input
              id="pricing-price"
              inputMode="decimal"
              placeholder="0,00"
              {...form.register("price")}
              aria-invalid={Boolean(errors.price)}
              aria-describedby={errors.price ? "pricing-price-error" : undefined}
            />
            {errors.price && (
              <p id="pricing-price-error" className="text-sm text-destructive">
                {errors.price.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="pricing-duration">Duração (minutos) *</Label>
            <Input
              id="pricing-duration"
              type="number"
              min={1}
              max={1440}
              step={5}
              {...form.register("durationMinutes")}
              aria-invalid={Boolean(errors.durationMinutes)}
              aria-describedby={errors.durationMinutes ? "pricing-duration-error" : undefined}
            />
            {errors.durationMinutes && (
              <p id="pricing-duration-error" className="text-sm text-destructive">
                {errors.durationMinutes.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="pricing-note">Observação</Label>
            <Input id="pricing-note" placeholder="Ex.: a partir de" {...form.register("note")} />
          </div>

          <label className="flex items-center gap-3 text-sm">
            <Switch
              checked={Boolean(form.watch("active"))}
              onCheckedChange={(value) => form.setValue("active", value)}
              aria-label="Combinação disponível"
            />
            Combinação disponível
          </label>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="animate-spin" aria-hidden />}
              Salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
