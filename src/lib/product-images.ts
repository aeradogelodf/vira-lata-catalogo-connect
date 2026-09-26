/**
 * O bucket `product-images` é PRIVADO (buckets públicos estão bloqueados pela
 * política do workspace). Guardamos apenas o caminho do objeto em
 * `product_images.image_url` / `products.image_url` e resolvemos para URLs
 * assinadas na hora de exibir. Valores absolutos (http/https) continuam sendo
 * usados como estão, para imagens hospedadas fora do Storage.
 */
import { getPublicImageUrls } from "@/lib/product-images.functions";
import { supabase } from "@/integrations/supabase/client";

export const PRODUCT_IMAGE_BUCKET = "product-images";
const IMAGE_BATCH_SIZE = 50;

export function isStoragePath(value: string): boolean {
  return !/^(https?:)?\/\//.test(value) && !value.startsWith("data:");
}

/** Resolve uma lista de referências para URLs exibíveis (assina o que for path). */
export async function resolveImageUrls(refs: string[]): Promise<Map<string, string>> {
  const paths = Array.from(new Set(refs.filter((ref) => ref && isStoragePath(ref))));
  if (paths.length === 0) return new Map();

  const signed = new Map<string, string>();
  try {
    // Administrators retain direct access to previews for inactive draft items.
    const { data: auth } = await supabase.auth.getSession();
    if (auth.session) {
      for (let index = 0; index < paths.length; index += IMAGE_BATCH_SIZE) {
        const batch = paths.slice(index, index + IMAGE_BATCH_SIZE);
        try {
          const { data } = await supabase.storage
            .from(PRODUCT_IMAGE_BUCKET)
            .createSignedUrls(batch, 60 * 60);
          for (const item of data ?? []) {
            if (item.path && item.signedUrl) signed.set(item.path, item.signedUrl);
          }
        } catch (error) {
          console.warn("Could not sign an admin image batch.", error);
        }
      }
    }
  } catch (error) {
    console.warn("Could not check image preview access.", error);
  }

  // Each public request stays below the server limit; one failed batch must
  // never turn a successful catalog query into a page error.
  const remaining = paths.filter((path) => !signed.has(path));
  for (let index = 0; index < remaining.length; index += IMAGE_BATCH_SIZE) {
    try {
      const batch = await getPublicImageUrls({
        data: { paths: remaining.slice(index, index + IMAGE_BATCH_SIZE) },
      });
      for (const [path, url] of Object.entries(batch)) signed.set(path, url);
    } catch (error) {
      console.warn("Could not sign a public image batch.", error);
    }
  }
  return signed;
}
