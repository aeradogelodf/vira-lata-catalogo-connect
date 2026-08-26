import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowDown,
  ArrowUp,
  Image as ImageIcon,
  ImagePlus,
  Loader2,
  Pencil,
  Plus,
  Search,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { PRODUCT_IMAGE_BUCKET, resolveImageUrls } from "@/lib/product-images";
import { IMAGE_MAX_BYTES, IMAGE_MIME_TYPES } from "@/lib/products";
import {
  BANNER_LINK_LABELS,
  BANNER_LINK_TYPES,
  bannerFormSchema,
  buildBannerImagePath,
  emptyBannerForm,
  toBannerForm,
  type AdminBanner,
  type BannerFormValues,
  type BannerLinkType,
} from "@/lib/banners";
import {
  deleteBanner,
  listBannersAdmin,
  reorderBanners,
  saveBanner,
  toggleBannerActive,
} from "@/lib/banners.functions";

function message(error: unknown): string {
  return error instanceof Error ? error.message : "Ocorreu um erro inesperado.";
}

export function BannersManager() {
  const queryClient = useQueryClient();
  const list = useServerFn(listBannersAdmin);
  const toggle = useServerFn(toggleBannerActive);
  const reorder = useServerFn(reorderBanners);
  const remove = useServerFn(deleteBanner);

  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<AdminBanner | null>(null);
  const [pendingDelete, setPendingDelete] = useState<AdminBanner | null>(null);
  const [previews, setPreviews] = useState<Map<string, string>>(new Map());

  const { data: banners, isLoading } = useQuery({
    queryKey: ["admin", "banners", search],
    queryFn: () => list({ data: { search: search.trim() || undefined } }),
  });

  /** Invalida somente banners (admin + vitrine) — o catálogo não é recarregado. */
  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["admin", "banners"] });
    queryClient.invalidateQueries({ queryKey: ["banners", "public"] });
  }

  useEffect(() => {
    const refs = (banners ?? [])
      .map((banner) => banner.imageUrl)
      .filter((value): value is string => Boolean(value));
    if (refs.length === 0) {
      setPreviews(new Map());
      return;
    }
    let active = true;
    resolveImageUrls(refs).then((map) => {
      if (active) setPreviews(map);
    });
    return () => {
      active = false;
    };
  }, [banners]);

  const toggleMutation = useMutation({
    mutationFn: (input: { id: string; value: boolean }) => toggle({ data: input }),
    onSuccess: invalidate,
    onError: (error) => toast.error(message(error)),
  });

  const reorderMutation = useMutation({
    mutationFn: (order: string[]) => reorder({ data: { order } }),
    onSuccess: invalidate,
    onError: (error) => toast.error(message(error)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => {
      toast.success("Banner excluído.");
      setPendingDelete(null);
      invalidate();
    },
    onError: (error) => toast.error(message(error)),
  });

  function move(index: number, direction: -1 | 1) {
    const items = [...(banners ?? [])];
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    const [item] = items.splice(index, 1);
    if (!item) return;
    items.splice(target, 0, item);
    reorderMutation.mutate(items.map((banner) => banner.id));
  }

  const nextSortOrder = useMemo(
    () => (banners?.length ? Math.max(...banners.map((b) => b.sortOrder)) + 1 : 0),
    [banners],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl">Banners</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Campanhas visuais exibidas no carrossel da página inicial.
          </p>
        </div>
        <Button onClick={() => setCreating(true)}>
          <Plus aria-hidden /> Novo banner
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
          placeholder="Pesquisar banners"
          aria-label="Pesquisar banners"
          className="pl-9"
        />
      </div>

      {isLoading ? (
        <div className="grid gap-3">
          {[0, 1, 2].map((key) => (
            <Skeleton key={key} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : (banners ?? []).length === 0 ? (
        <EmptyState
          icon={<ImageIcon className="size-8 text-info" aria-hidden />}
          title="Nenhum banner cadastrado"
          description="Crie o primeiro banner para destacar uma campanha na página inicial."
          action={
            <Button onClick={() => setCreating(true)}>
              <Plus aria-hidden /> Cadastrar banner
            </Button>
          }
        />
      ) : (
        <ul className="grid gap-3">
          {(banners ?? []).map((banner, index) => {
            const preview = banner.imageUrl
              ? (previews.get(banner.imageUrl) ?? banner.imageUrl)
              : null;
            return (
              <li key={banner.id} className="surface-card flex flex-wrap items-center gap-4 p-4">
                {preview ? (
                  <img
                    src={preview}
                    alt={`Imagem do banner ${banner.title}`}
                    className="h-16 w-28 shrink-0 rounded-lg object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div
                    className="grid h-16 w-28 shrink-0 place-items-center rounded-lg bg-secondary"
                    aria-hidden
                  >
                    <ImageIcon className="size-6 text-muted-foreground" />
                  </div>
                )}

                <div className="min-w-40 flex-1">
                  <p className="font-display font-bold">{banner.title}</p>
                  {banner.subtitle && (
                    <p className="text-xs text-muted-foreground">{banner.subtitle}</p>
                  )}
                  <p className="mt-1 text-xs text-muted-foreground">
                    Destino: {BANNER_LINK_LABELS[banner.linkType]}
                    {banner.linkValue ? ` — ${banner.linkValue}` : ""}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Switch
                      checked={banner.active}
                      onCheckedChange={(value) =>
                        toggleMutation.mutate({ id: banner.id, value })
                      }
                      aria-label={`Exibir ${banner.title} na página inicial`}
                    />
                    Ativo
                  </label>
                  <div className="flex flex-col">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Mover ${banner.title} para cima`}
                      disabled={index === 0 || reorderMutation.isPending}
                      onClick={() => move(index, -1)}
                    >
                      <ArrowUp />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Mover ${banner.title} para baixo`}
                      disabled={index === (banners ?? []).length - 1 || reorderMutation.isPending}
                      onClick={() => move(index, 1)}
                    >
                      <ArrowDown />
                    </Button>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label={`Editar ${banner.title}`}
                    onClick={() => setEditing(banner)}
                  >
                    <Pencil />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Excluir ${banner.title}`}
                    onClick={() => setPendingDelete(banner)}
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
        <BannerFormDialog
          banner={editing}
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
            <AlertDialogTitle>Excluir “{pendingDelete?.title}”?</AlertDialogTitle>
            <AlertDialogDescription>
              A exclusão é permanente. Se quiser apenas tirar o banner do ar, desative-o.
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

function BannerFormDialog({
  banner,
  nextSortOrder,
  onClose,
  onSaved,
}: {
  banner: AdminBanner | null;
  nextSortOrder: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  const save = useServerFn(saveBanner);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const form = useForm<BannerFormValues>({
    resolver: zodResolver(bannerFormSchema) as never,
    defaultValues: banner ? toBannerForm(banner) : emptyBannerForm(nextSortOrder),
  });

  const imageUrl = form.watch("imageUrl");
  const linkType = form.watch("linkType");

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
    mutationFn: (values: BannerFormValues) =>
      save({
        data: {
          ...(banner ? { id: banner.id, expectedUpdatedAt: banner.updatedAt } : {}),
          values: bannerFormSchema.parse(values),
        },
      }),
    onSuccess: () => {
      toast.success(banner ? "Banner atualizado." : "Banner criado.");
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
      const path = buildBannerImagePath(form.getValues("title") || "banner", file.type);
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

  const linkHint: Record<BannerLinkType, string> = {
    none: "",
    catalog: "Leva o visitante para /catalogo.",
    product: "Informe o slug do produto (ex.: racao-premium-15kg).",
    service: "Leva o visitante para /servicos.",
    whatsapp: "Opcional: complemento incluído na mensagem enviada à loja.",
    external: "URL completa, começando com https://",
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{banner ? "Editar banner" : "Novo banner"}</DialogTitle>
          <DialogDescription>
            Campanhas exibidas no carrossel da página inicial.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
        >
          <div className="space-y-1.5">
            <Label htmlFor="banner-title">Título</Label>
            <Input id="banner-title" {...form.register("title")} />
            {form.formState.errors.title && (
              <p className="text-xs text-destructive">{form.formState.errors.title.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="banner-subtitle">Subtítulo</Label>
            <Textarea id="banner-subtitle" rows={2} {...form.register("subtitle")} />
          </div>

          <div className="space-y-1.5">
            <Label>Imagem</Label>
            {preview && (
              <img
                src={preview}
                alt="Pré-visualização do banner"
                className="h-32 w-full rounded-lg object-cover"
              />
            )}
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline" size="sm" disabled={uploading}>
                <label className="cursor-pointer">
                  {uploading ? (
                    <Loader2 className="animate-spin" aria-hidden />
                  ) : (
                    <ImagePlus aria-hidden />
                  )}
                  Enviar imagem
                  <input
                    type="file"
                    accept={IMAGE_MIME_TYPES.join(",")}
                    className="sr-only"
                    onChange={(event) => handleUpload(event.target.files?.[0])}
                  />
                </label>
              </Button>
              {imageUrl && (
                <Button type="button" variant="ghost" size="sm" onClick={removeImage}>
                  <Trash2 aria-hidden /> Remover
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">JPG, PNG, WebP ou AVIF até 5 MB.</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="banner-alt">Texto alternativo (acessibilidade)</Label>
            <Input id="banner-alt" {...form.register("altText")} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="banner-link-type">Destino do botão</Label>
              <Select
                value={linkType}
                onValueChange={(value) =>
                  form.setValue("linkType", value as BannerLinkType, { shouldDirty: true })
                }
              >
                <SelectTrigger id="banner-link-type" aria-label="Destino do botão">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BANNER_LINK_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {BANNER_LINK_LABELS[type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="banner-cta">Texto do botão</Label>
              <Input
                id="banner-cta"
                disabled={linkType === "none"}
                {...form.register("ctaLabel")}
              />
              {form.formState.errors.ctaLabel && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.ctaLabel.message}
                </p>
              )}
            </div>
          </div>

          {linkType !== "none" && linkType !== "catalog" && linkType !== "service" && (
            <div className="space-y-1.5">
              <Label htmlFor="banner-link-value">Valor do destino</Label>
              <Input id="banner-link-value" {...form.register("linkValue")} />
              <p className="text-xs text-muted-foreground">{linkHint[linkType]}</p>
              {form.formState.errors.linkValue && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.linkValue.message}
                </p>
              )}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="banner-order">Ordem</Label>
              <Input id="banner-order" type="number" min={0} {...form.register("sortOrder")} />
            </div>
            <label className="flex items-center gap-3 pt-6 text-sm">
              <Switch
                checked={form.watch("active")}
                onCheckedChange={(value) => form.setValue("active", value, { shouldDirty: true })}
                aria-label="Banner ativo"
              />
              Ativo na página inicial
            </label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending || uploading}>
              {mutation.isPending && <Loader2 className="animate-spin" aria-hidden />}
              Salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
