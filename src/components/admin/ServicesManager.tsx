import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowDown,
  ArrowUp,
  ImagePlus,
  Loader2,
  Pencil,
  Plus,
  Scissors,
  Search,
  Star,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { EmptyState } from "@/components/catalog/EmptyState";
import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/catalog";
import { PRODUCT_IMAGE_BUCKET, resolveImageUrls } from "@/lib/product-images";
import { IMAGE_MAX_BYTES, IMAGE_MIME_TYPES } from "@/lib/products";
import {
  buildServiceImagePath,
  emptyServiceForm,
  serviceFormSchema,
  slugify,
  toServiceForm,
  type AdminService,
  type ServiceFormValues,
} from "@/lib/services";
import {
  deleteService,
  listServicesAdmin,
  reorderServices,
  saveService,
  toggleServiceFlag,
} from "@/lib/services.functions";

function message(error: unknown): string {
  return error instanceof Error && error.message
    ? error.message
    : "Não foi possível concluir a operação.";
}

export function ServicesManager() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<AdminService | null>(null);
  const [creating, setCreating] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<AdminService | null>(null);
  const [previews, setPreviews] = useState<Map<string, string>>(new Map());

  const list = useServerFn(listServicesAdmin);
  const toggle = useServerFn(toggleServiceFlag);
  const remove = useServerFn(deleteService);
  const reorder = useServerFn(reorderServices);

  const { data: services, isLoading } = useQuery({
    queryKey: ["admin", "services", search],
    queryFn: () => list({ data: { search: search || undefined } }),
  });

  useEffect(() => {
    let active = true;
    const refs = (services ?? [])
      .map((service) => service.imageUrl)
      .filter((value): value is string => Boolean(value));
    resolveImageUrls(refs).then((map) => {
      if (active) setPreviews(map);
    });
    return () => {
      active = false;
    };
  }, [services]);

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["admin", "services"] });
    queryClient.invalidateQueries({ queryKey: ["services", "public"] });
  }

  const toggleMutation = useMutation({
    mutationFn: (input: { id: string; field: "active" | "featured"; value: boolean }) =>
      toggle({ data: input }),
    onSuccess: invalidate,
    onError: (error) => toast.error(message(error)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => {
      toast.success("Serviço excluído.");
      setPendingDelete(null);
      invalidate();
    },
    onError: (error) => toast.error(message(error)),
  });

  const reorderMutation = useMutation({
    mutationFn: (order: string[]) => reorder({ data: { order } }),
    onSuccess: invalidate,
    onError: (error) => toast.error(message(error)),
  });

  function move(index: number, direction: -1 | 1) {
    const rows = services ?? [];
    const target = index + direction;
    if (target < 0 || target >= rows.length) return;
    const order = rows.map((service) => service.id);
    const [moved] = order.splice(index, 1);
    order.splice(target, 0, moved!);
    reorderMutation.mutate(order);
  }

  const nextSortOrder = useMemo(
    () => (services?.length ? Math.max(...services.map((s) => s.sortOrder)) + 1 : 0),
    [services],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl">Serviços</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Banho e tosa e demais serviços exibidos na página pública.
          </p>
        </div>
        <Button onClick={() => setCreating(true)}>
          <Plus aria-hidden /> Novo serviço
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Pesquisar serviços"
          aria-label="Pesquisar serviços"
          className="pl-9"
        />
      </div>

      {isLoading ? (
        <div className="grid gap-3">
          {[0, 1, 2].map((key) => (
            <Skeleton key={key} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : (services ?? []).length === 0 ? (
        <EmptyState
          icon={<Scissors className="size-8 text-info" aria-hidden />}
          title="Nenhum serviço cadastrado"
          description="Cadastre o primeiro serviço (ex.: Banho e Tosa) para que ele apareça na página pública."
          action={
            <Button onClick={() => setCreating(true)}>
              <Plus aria-hidden /> Cadastrar serviço
            </Button>
          }
        />
      ) : (
        <ul className="grid gap-3">
          {(services ?? []).map((service, index) => {
            const preview = service.imageUrl
              ? (previews.get(service.imageUrl) ?? service.imageUrl)
              : null;
            return (
              <li key={service.id} className="surface-card flex flex-wrap items-center gap-4 p-4">
                {preview ? (
                  <img
                    src={preview}
                    alt={`Imagem do serviço ${service.name}`}
                    className="size-16 shrink-0 rounded-lg object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div
                    className="grid size-16 shrink-0 place-items-center rounded-lg bg-secondary"
                    aria-hidden
                  >
                    <Scissors className="size-6 text-muted-foreground" />
                  </div>
                )}

                <div className="min-w-40 flex-1">
                  <p className="font-display font-bold">{service.name}</p>
                  <p className="text-xs text-muted-foreground">/{service.slug}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {service.price !== null
                      ? formatPrice(service.price)
                      : (service.priceNote ?? "Preço sob consulta")}
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Switch
                      checked={service.active}
                      onCheckedChange={(value) =>
                        toggleMutation.mutate({ id: service.id, field: "active", value })
                      }
                      aria-label={`Exibir ${service.name} no site`}
                    />
                    Ativo
                  </label>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`${service.featured ? "Remover destaque de" : "Destacar"} ${service.name}`}
                    onClick={() =>
                      toggleMutation.mutate({
                        id: service.id,
                        field: "featured",
                        value: !service.featured,
                      })
                    }
                  >
                    <Star className={service.featured ? "fill-warning text-warning" : ""} />
                  </Button>
                  <div className="flex flex-col">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Mover ${service.name} para cima`}
                      disabled={index === 0 || reorderMutation.isPending}
                      onClick={() => move(index, -1)}
                    >
                      <ArrowUp />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Mover ${service.name} para baixo`}
                      disabled={index === (services ?? []).length - 1 || reorderMutation.isPending}
                      onClick={() => move(index, 1)}
                    >
                      <ArrowDown />
                    </Button>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label={`Editar ${service.name}`}
                    onClick={() => setEditing(service)}
                  >
                    <Pencil />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Excluir ${service.name}`}
                    onClick={() => setPendingDelete(service)}
                  >
                    <Trash2 className="text-destructive" />
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {(creating || editing) && (
        <ServiceFormDialog
          service={editing}
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
              A exclusão é permanente. Se quiser apenas tirar o serviço do site, desative-o.
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

function ServiceFormDialog({
  service,
  nextSortOrder,
  onClose,
  onSaved,
}: {
  service: AdminService | null;
  nextSortOrder: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  const save = useServerFn(saveService);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceFormSchema) as never,
    defaultValues: service ? toServiceForm(service) : emptyServiceForm(nextSortOrder),
  });

  const imageUrl = form.watch("imageUrl");

  useEffect(() => {
    let active = true;
    if (!imageUrl) {
      setPreview(null);
      return;
    }
    resolveImageUrls([imageUrl]).then((map) => {
      if (active) setPreview(map.get(imageUrl) ?? imageUrl);
    });
    return () => {
      active = false;
    };
  }, [imageUrl]);

  const mutation = useMutation({
    mutationFn: (values: ServiceFormValues) =>
      save({
        data: {
          ...(service ? { id: service.id, expectedUpdatedAt: service.updatedAt } : {}),
          values: serviceFormSchema.parse(values),
        },
      }),
    onSuccess: () => {
      toast.success(service ? "Serviço atualizado." : "Serviço criado.");
      onSaved();
      onClose();
    },
    onError: (error) => toast.error(message(error)),
  });

  async function handleUpload(file: File | undefined) {
    if (!file) return;
    if (!(IMAGE_MIME_TYPES as readonly string[]).includes(file.type)) {
      toast.error("Formato não suportado (use JPG, PNG, WebP ou AVIF).");
      return;
    }
    if (file.size > IMAGE_MAX_BYTES) {
      toast.error("Arquivo maior que 5 MB.");
      return;
    }
    setUploading(true);
    try {
      const path = buildServiceImagePath(form.getValues("slug") || slugify(form.getValues("name")), file.type);
      const { error } = await supabase.storage
        .from(PRODUCT_IMAGE_BUCKET)
        .upload(path, file, { upsert: false, contentType: file.type });
      if (error) throw new Error(error.message);
      form.setValue("imageUrl", path, { shouldDirty: true });
      toast.success("Imagem enviada.");
    } catch (error) {
      toast.error(message(error));
    } finally {
      setUploading(false);
    }
  }

  async function removeImage() {
    const current = form.getValues("imageUrl");
    if (current && !/^https?:/.test(current)) {
      await supabase.storage.from(PRODUCT_IMAGE_BUCKET).remove([current]);
    }
    form.setValue("imageUrl", "", { shouldDirty: true });
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{service ? "Editar serviço" : "Novo serviço"}</DialogTitle>
          <DialogDescription>
            Os dados aparecem na página pública de serviços com CTA para o WhatsApp.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
          noValidate
        >
          <div className="space-y-2">
            <Label htmlFor="service-name">Nome</Label>
            <Input
              id="service-name"
              {...form.register("name", {
                onChange: (event) => {
                  if (!service && !form.getValues("slug")) return;
                  if (!service) form.setValue("slug", slugify(event.target.value));
                },
              })}
              onBlur={(event) => {
                if (!form.getValues("slug")) {
                  form.setValue("slug", slugify(event.target.value));
                }
              }}
            />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="service-slug">Slug</Label>
            <Input id="service-slug" {...form.register("slug")} />
            {form.formState.errors.slug && (
              <p className="text-sm text-destructive">{form.formState.errors.slug.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="service-description">Descrição</Label>
            <Textarea id="service-description" rows={4} {...form.register("description")} />
            {form.formState.errors.description && (
              <p className="text-sm text-destructive">
                {form.formState.errors.description.message}
              </p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="service-price">Preço (R$)</Label>
              <Input
                id="service-price"
                inputMode="decimal"
                placeholder="Deixe vazio para “sob consulta”"
                {...form.register("price")}
              />
              {form.formState.errors.price && (
                <p className="text-sm text-destructive">{form.formState.errors.price.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="service-price-note">Observação de preço</Label>
              <Input
                id="service-price-note"
                placeholder="ex.: a partir de / varia por porte"
                {...form.register("priceNote")}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="service-order">Ordem de exibição</Label>
            <Input id="service-order" type="number" min={0} {...form.register("sortOrder")} />
            {form.formState.errors.sortOrder && (
              <p className="text-sm text-destructive">{form.formState.errors.sortOrder.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="service-image">Imagem</Label>
            <div className="flex items-center gap-3">
              {preview ? (
                <img
                  src={preview}
                  alt="Pré-visualização da imagem do serviço"
                  className="size-20 rounded-lg object-cover"
                />
              ) : (
                <div className="grid size-20 place-items-center rounded-lg bg-secondary" aria-hidden>
                  <ImagePlus className="size-6 text-muted-foreground" />
                </div>
              )}
              <div className="flex flex-col gap-2">
                <Input
                  id="service-image"
                  type="file"
                  accept={IMAGE_MIME_TYPES.join(",")}
                  disabled={uploading}
                  onChange={(event) => void handleUpload(event.target.files?.[0])}
                />
                {imageUrl && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => void removeImage()}>
                    <Trash2 aria-hidden /> Remover imagem
                  </Button>
                )}
              </div>
            </div>
            {uploading && (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" aria-hidden /> Enviando imagem…
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 text-sm">
              <Switch
                checked={form.watch("active")}
                onCheckedChange={(value) => form.setValue("active", value, { shouldDirty: true })}
                aria-label="Serviço ativo"
              />
              Ativo no site
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Switch
                checked={form.watch("featured")}
                onCheckedChange={(value) => form.setValue("featured", value, { shouldDirty: true })}
                aria-label="Serviço em destaque"
              />
              Destaque
            </label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending || uploading}>
              {mutation.isPending && <Loader2 className="size-4 animate-spin" aria-hidden />}
              Salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
