/**
 * O bucket `product-images` é PRIVADO (buckets públicos estão bloqueados pela
 * política do workspace). Guardamos apenas o caminho do objeto em
 * `product_images.image_url` / `products.image_url` e resolvemos para URLs
 * assinadas na hora de exibir. Valores absolutos (http/https) continuam sendo
 * usados como estão, para imagens hospedadas fora do Storage.
 */
import { supabase } from "@/integrations/supabase/client";

export const PRODUCT_IMAGE_BUCKET = "product-images";
const SIGNED_URL_TTL = 60 * 60; // 1 hora

export function isStoragePath(value: string): boolean {
  return !/^(https?:)?\/\//.test(value) && !value.startsWith("data:");
}

/** Resolve uma lista de referências para URLs exibíveis (assina o que for path). */
export async function resolveImageUrls(refs: string[]): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  const paths = Array.from(new Set(refs.filter((ref) => ref && isStoragePath(ref))));
  if (paths.length === 0) return map;

  const { data, error } = await supabase.storage
    .from(PRODUCT_IMAGE_BUCKET)
    .createSignedUrls(paths, SIGNED_URL_TTL);

  if (error || !data) return map;
  for (const item of data) {
    if (item.signedUrl && item.path) map.set(item.path, item.signedUrl);
  }
  return map;
}
