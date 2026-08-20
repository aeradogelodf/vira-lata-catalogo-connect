import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

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
import { ProductImagesEditor } from "@/components/admin/ProductImagesEditor";
import {
  EMPTY_PRODUCT,
  PRODUCT_UNITS,
  PRODUCT_UNIT_LABEL,
  productFormSchema,
  slugify,
  type ProductFormValues,
} from "@/lib/products";
import { getProductAdmin, saveProduct } from "@/lib/products.functions";
import type { TaxonomyRow } from "@/lib/taxonomy";

const NONE = "__none__";

function message(error: unknown): string {
  return error instanceof Error && error.message
    ? error.message
    : "Não foi possível concluir a operação.";
}

export function ProductFormDialog({
  open,
  productId,
  categories,
  brands,
  onOpenChange,
}: {
  open: boolean;
  productId: string | null;
  categories: TaxonomyRow[];
  brands: TaxonomyRow[];
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const load = useServerFn(getProductAdmin);
  const save = useServerFn(saveProduct);

  const detail = useQuery({
    queryKey: ["admin", "product", productId],
    queryFn: () => load({ data: { id: productId as string } }),
    enabled: open && productId !== null,
    retry: false,
  });

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema) as never,
    defaultValues: EMPTY_PRODUCT,
  });

  useEffect(() => {
    if (!open) return;
    if (productId === null) {
      form.reset(EMPTY_PRODUCT);
      return;
    }
    if (detail.data) {
      const values = detail.data.values;
      form.reset({
        ...values,
        price: values.price === null ? "" : String(values.price),
        oldPrice: values.oldPrice === null ? "" : String(values.oldPrice),
      } as ProductFormValues);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, productId, detail.data]);

  const saveMutation = useMutation({
    mutationFn: (values: ProductFormValues) =>
      save({
        data: {
          ...(productId
            ? { id: productId, expectedUpdatedAt: detail.data?.updatedAt }
            : {}),
          values: productFormSchema.parse(values),
        },
      }),
    onSuccess: () => {
      toast.success(productId ? "Produto atualizado." : "Produto criado.");
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "summary"] });
      queryClient.invalidateQueries({ queryKey: ["catalog"] });
      onOpenChange(false);
    },
    onError: (error) => toast.error(message(error)),
  });

  const errors = form.formState.errors;
  const loading = productId !== null && detail.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{productId ? "Editar produto" : "Novo produto"}</DialogTitle>
          <DialogDescription>
            Os dados são gravados no banco e refletem imediatamente no catálogo público.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2, 3].map((index) => (
              <Skeleton key={index} className="h-10 w-full" />
            ))}
          </div>
        ) : detail.isError ? (
          <div className="p-4 text-center">
            <p className="text-sm text-destructive">{message(detail.error)}</p>
            <Button variant="outline" className="mt-3" onClick={() => detail.refetch()}>
              Tentar novamente
            </Button>
          </div>
        ) : (
          <form
            className="space-y-5"
            onSubmit={form.handleSubmit((values) => saveMutation.mutate(values))}
          >
            <section className="space-y-4">
              <h3 className="font-display text-sm font-bold">Identificação</h3>
              <div className="space-y-1.5">
                <Label htmlFor="p-name">Nome</Label>
                <Input
                  id="p-name"
                  aria-invalid={Boolean(errors.name)}
                  {...form.register("name", {
                    onChange: (event) => {
                      if (!productId && !form.getFieldState("slug").isDirty) {
                        form.setValue("slug", slugify(event.target.value));
                      }
                    },
                  })}
                />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="p-slug">Slug (URL)</Label>
                <Input id="p-slug" {...form.register("slug")} />
                {errors.slug ? (
                  <p className="text-xs text-destructive">{errors.slug.message}</p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Endereço público: /produto/{form.watch("slug") || "slug"}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="p-description">Descrição</Label>
                <Textarea id="p-description" rows={4} {...form.register("description")} />
                {errors.description && (
                  <p className="text-xs text-destructive">{errors.description.message}</p>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="p-category">Categoria</Label>
                  <Select
                    value={form.watch("categoryId") ?? NONE}
                    onValueChange={(value) =>
                      form.setValue("categoryId", value === NONE ? null : value, {
                        shouldDirty: true,
                      })
                    }
                  >
                    <SelectTrigger id="p-category">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>Sem categoria</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                          {category.active ? "" : " (inativa)"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {categories.length === 0 && (
                    <p className="text-xs text-muted-foreground">
                      Nenhuma categoria cadastrada ainda.
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="p-brand">Marca</Label>
                  <Select
                    value={form.watch("brandId") ?? NONE}
                    onValueChange={(value) =>
                      form.setValue("brandId", value === NONE ? null : value, {
                        shouldDirty: true,
                      })
                    }
                  >
                    <SelectTrigger id="p-brand">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>Sem marca</SelectItem>
                      {brands.map((brand) => (
                        <SelectItem key={brand.id} value={brand.id}>
                          {brand.name}
                          {brand.active ? "" : " (inativa)"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {brands.length === 0 && (
                    <p className="text-xs text-muted-foreground">
                      Nenhuma marca cadastrada ainda.
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="p-subcategory">Subcategoria (opcional)</Label>
                  <Input id="p-subcategory" {...form.register("subcategory")} />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="p-sku">SKU (opcional)</Label>
                  <Input id="p-sku" {...form.register("sku")} />
                </div>
              </div>

              {detail.data && (
                <p className="text-xs text-muted-foreground">
                  Código interno gerado pelo sistema: {detail.data.internalCode}
                </p>
              )}
            </section>

            <section className="space-y-4">
              <h3 className="font-display text-sm font-bold">Comercial</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="p-price">Preço atual (R$)</Label>
                  <Input id="p-price" inputMode="decimal" {...form.register("price")} />
                  {errors.price && (
                    <p className="text-xs text-destructive">{errors.price.message as string}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="p-old-price">Preço anterior (R$)</Label>
                  <Input id="p-old-price" inputMode="decimal" {...form.register("oldPrice")} />
                  {errors.oldPrice ? (
                    <p className="text-xs text-destructive">{errors.oldPrice.message as string}</p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Necessário para exibir promoção.
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="p-unit">Unidade</Label>
                  <Select
                    value={form.watch("unit")}
                    onValueChange={(value) =>
                      form.setValue("unit", value as ProductFormValues["unit"], {
                        shouldDirty: true,
                      })
                    }
                  >
                    <SelectTrigger id="p-unit">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRODUCT_UNITS.map((unit) => (
                        <SelectItem key={unit} value={unit}>
                          {PRODUCT_UNIT_LABEL[unit]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="p-package">Embalagem (opcional)</Label>
                  <Input id="p-package" placeholder="Ex.: 15 kg" {...form.register("packageSize")} />
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="font-display text-sm font-bold">Estoque e exibição</h3>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label htmlFor="p-stock">Estoque</Label>
                  <Input id="p-stock" type="number" min={0} {...form.register("stock")} />
                  {errors.stock && (
                    <p className="text-xs text-destructive">{errors.stock.message as string}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="p-min-stock">Estoque mínimo</Label>
                  <Input id="p-min-stock" type="number" min={0} {...form.register("minStock")} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="p-sort">Ordem</Label>
                  <Input id="p-sort" type="number" min={0} {...form.register("sortOrder")} />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                A disponibilidade no catálogo é derivada do estoque: zero significa
                “indisponível”, mas o produto continua visível.
              </p>

              {(
                [
                  ["active", "Ativo", "Produtos inativos não aparecem no catálogo público."],
                  ["featured", "Destaque", "Aparece nas vitrines de destaque."],
                  ["onSale", "Promoção", "Requer preço anterior maior que o atual."],
                ] as const
              ).map(([field, label, hint]) => (
                <div
                  key={field}
                  className="flex items-center justify-between rounded-lg border border-border p-3"
                >
                  <div>
                    <Label htmlFor={`p-${field}`}>{label}</Label>
                    <p className="text-xs text-muted-foreground">{hint}</p>
                  </div>
                  <Switch
                    id={`p-${field}`}
                    checked={Boolean(form.watch(field))}
                    onCheckedChange={(checked) =>
                      form.setValue(field, checked, { shouldDirty: true })
                    }
                  />
                </div>
              ))}
            </section>

            <section className="space-y-4">
              <h3 className="font-display text-sm font-bold">SEO</h3>
              <div className="space-y-1.5">
                <Label htmlFor="p-seo-title">Título SEO (opcional)</Label>
                <Input id="p-seo-title" {...form.register("seoTitle")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="p-seo-description">Descrição SEO (opcional)</Label>
                <Textarea id="p-seo-description" rows={2} {...form.register("seoDescription")} />
              </div>
            </section>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending && <Loader2 className="animate-spin" aria-hidden />}
                Salvar
              </Button>
            </DialogFooter>
          </form>
        )}

        {productId && detail.data && (
          <ProductImagesEditor
            productId={productId}
            productName={detail.data.values.name}
            images={detail.data.images}
            onChanged={() => detail.refetch()}
          />
        )}
        {!productId && (
          <p className="rounded-lg border border-dashed border-border p-4 text-xs text-muted-foreground">
            Salve o produto para habilitar o envio de imagens.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
