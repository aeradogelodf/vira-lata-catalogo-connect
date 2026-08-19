import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, ArrowRight, ImagePlus, Loader2, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { PRODUCT_IMAGE_BUCKET, resolveImageUrls } from "@/lib/product-images";
import {
  buildImagePath,
  IMAGE_MAX_BYTES,
  IMAGE_MIME_TYPES,
  type AdminProductImage,
} from "@/lib/products";
import {
  addProductImage,
  deleteProductImage,
  reorderProductImages,
  setPrimaryProductImage,
} from "@/lib/products.functions";

function message(error: unknown): string {
  return error instanceof Error && error.message
    ? error.message
    : "Não foi possível concluir a operação.";
}

export function ProductImagesEditor({
  productId,
  images,
  productName,
  onChanged,
}: {
  productId: string;
  images: AdminProductImage[];
  productName: string;
  onChanged: () => void;
}) {
  const queryClient = useQueryClient();
  const [previews, setPreviews] = useState<Map<string, string>>(new Map());
  const [uploading, setUploading] = useState(false);

  const add = useServerFn(addProductImage);
  const remove = useServerFn(deleteProductImage);
  const setPrimary = useServerFn(setPrimaryProductImage);
  const reorder = useServerFn(reorderProductImages);

  useEffect(() => {
    let active = true;
    resolveImageUrls(images.map((image) => image.imageUrl)).then((map) => {
      if (active) setPreviews(map);
    });
    return () => {
      active = false;
    };
  }, [images]);

  function refresh() {
    queryClient.invalidateQueries({ queryKey: ["admin", "product", productId] });
    queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
    queryClient.invalidateQueries({ queryKey: ["catalog"] });
    onChanged();
  }

  const mutate = <T,>(fn: (input: T) => Promise<unknown>) =>
    useMutation({
      mutationFn: fn,
      onSuccess: refresh,
      onError: (error) => toast.error(message(error)),
    });

  const removeMutation = mutate((imageId: string) =>
    remove({ data: { productId, imageId } }),
  );
  const primaryMutation = mutate((imageId: string) =>
    setPrimary({ data: { productId, imageId } }),
  );
  const reorderMutation = mutate((order: string[]) => reorder({ data: { productId, order } }));

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        if (!(IMAGE_MIME_TYPES as readonly string[]).includes(file.type)) {
          toast.error(`${file.name}: formato não suportado (use JPG, PNG, WebP ou AVIF).`);
          continue;
        }
        if (file.size > IMAGE_MAX_BYTES) {
          toast.error(`${file.name}: arquivo maior que 5 MB.`);
          continue;
        }
        const path = buildImagePath(productId, file.type);
        const { error } = await supabase.storage
          .from(PRODUCT_IMAGE_BUCKET)
          .upload(path, file, { contentType: file.type, upsert: false });
        if (error) {
          toast.error(`${file.name}: falha no envio.`);
          continue;
        }
        try {
          await add({ data: { productId, path, altText: productName } });
        } catch (error) {
          // Evita arquivo órfão quando o registro no banco falha.
          await supabase.storage.from(PRODUCT_IMAGE_BUCKET).remove([path]);
          toast.error(message(error));
        }
      }
      refresh();
    } finally {
      setUploading(false);
    }
  }

  function move(index: number, direction: -1 | 1) {
    const next = [...images];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    const current = next[index];
    const swap = next[target];
    if (!current || !swap) return;
    next[index] = swap;
    next[target] = current;
    reorderMutation.mutate(next.map((image) => image.id));
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="font-display text-sm font-bold">Imagens</h3>
          <p className="text-xs text-muted-foreground">
            JPG, PNG, WebP ou AVIF até 5 MB. A primeira imagem é a principal.
          </p>
        </div>
        <Button asChild variant="outline" size="sm" disabled={uploading}>
          <label className="cursor-pointer">
            {uploading ? <Loader2 className="animate-spin" aria-hidden /> : <ImagePlus aria-hidden />}
            Enviar imagem
            <input
              type="file"
              accept={IMAGE_MIME_TYPES.join(",")}
              multiple
              className="sr-only"
              onChange={(event) => {
                void handleFiles(event.target.files);
                event.target.value = "";
              }}
            />
          </label>
        </Button>
      </div>

      {images.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          Nenhuma imagem enviada ainda.
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {images.map((image, index) => (
            <li key={image.id} className="overflow-hidden rounded-lg border border-border">
              <div className="aspect-square bg-muted">
                {previews.get(image.imageUrl) ? (
                  <img
                    src={previews.get(image.imageUrl)}
                    alt={image.altText ?? `Imagem de ${productName}`}
                    loading="lazy"
                    className="size-full object-cover"
                  />
                ) : (
                  <div className="flex size-full items-center justify-center">
                    <Loader2 className="size-4 animate-spin text-muted-foreground" aria-hidden />
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between gap-1 p-1.5">
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Mover para a esquerda"
                  onClick={() => move(index, -1)}
                  disabled={index === 0 || reorderMutation.isPending}
                >
                  <ArrowLeft />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={image.isPrimary ? "Imagem principal" : "Definir como principal"}
                  onClick={() => primaryMutation.mutate(image.id)}
                  disabled={image.isPrimary || primaryMutation.isPending}
                >
                  <Star className={image.isPrimary ? "fill-warning text-warning" : ""} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Mover para a direita"
                  onClick={() => move(index, 1)}
                  disabled={index === images.length - 1 || reorderMutation.isPending}
                >
                  <ArrowRight />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Remover imagem"
                  onClick={() => removeMutation.mutate(image.id)}
                  disabled={removeMutation.isPending}
                >
                  <Trash2 className="text-destructive" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
