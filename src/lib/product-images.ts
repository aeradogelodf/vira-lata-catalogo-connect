/**
 * O bucket `product-images` é PRIVADO (buckets públicos estão bloqueados pela
 * política do workspace). Guardamos apenas o caminho do objeto em
 * `product_images.image_url` / `products.image_url` e resolvemos para URLs
 * assinadas na hora de exibir. Valores absolutos (http/https) continuam sendo
 * usados como estão, para imagens hospedadas fora do Storage.
 */
import { getPublicImageUrls } from "@/lib/product-images.functions";
import { supabase } from "@/integrations/supabase/client";
import { ImageUrlCache, signedImageInfo } from "@/lib/image-url-cache";

export const PRODUCT_IMAGE_BUCKET = "product-images";
const IMAGE_BATCH_SIZE = 50;
const browserCache = new ImageUrlCache();
const pending = new Map<string, Promise<Map<string, string>>>();

export function isStoragePath(value: string): boolean {
  return !/^(https?:)?\/\//.test(value) && !value.startsWith("data:");
}

/** Resolve uma lista de referências para URLs exibíveis (assina o que for path). */
export async function resolveImageUrls(refs: string[], options: { force?: boolean } = {}): Promise<Map<string, string>> {
  const paths = Array.from(new Set(refs.filter((ref) => ref && isStoragePath(ref))));
  if (paths.length === 0) return new Map();

  const signed = new Map<string, string>();
  // Cache only in the browser, partitioned by identity; RLS still decides access.
  let session: Awaited<ReturnType<typeof supabase.auth.getSession>>["data"]["session"] = null;
  try {
    const { data: auth } = await supabase.auth.getSession();
    session = auth.session;
  } catch { /* Public validation remains available without a session. */ }
  const scope = session?.user.id ?? "public";
  const cacheKey = (path: string) => `${scope}:${path}`;
  const inBrowser = typeof window !== "undefined";
  for (const path of paths) {
    if (options.force) browserCache.delete(cacheKey(path));
    const cached = inBrowser ? browserCache.get(cacheKey(path)) : undefined;
    if (cached) signed.set(path, cached);
  }
  const remaining = paths.filter((path) => !signed.has(path));
  for (let index = 0; index < remaining.length; index += IMAGE_BATCH_SIZE) {
    const batch = remaining.slice(index, index + IMAGE_BATCH_SIZE);
    const key = `${scope}:${[...batch].sort().join("|")}`;
    const signBatch = async () => {
      const result = new Map<string, string>();
      // Retry a transient failure once; never widen access for drafts.
      for (let attempt = 0; attempt < 2; attempt++) {
        const missing = batch.filter((path) => !result.has(path));
        if (missing.length === 0) break;
        if (session) {
          try {
            const { data } = await supabase.storage.from(PRODUCT_IMAGE_BUCKET).createSignedUrls(missing, 3600);
            for (const item of data ?? []) {
              if (!item.error && item.path && item.signedUrl) result.set(item.path, item.signedUrl);
            }
          } catch { /* Retry or use the validated public fallback. */ }
        }
        const publicPaths = missing.filter((path) => !result.has(path));
        if (publicPaths.length) {
          try {
            const urls = await getPublicImageUrls({ data: { paths: publicPaths } });
            for (const [path, url] of Object.entries(urls)) result.set(path, url);
          } catch { /* One unavailable image must not reject the catalog. */ }
        }
      }
      return result;
    };
    const request = (inBrowser ? pending.get(key) : undefined) ?? signBatch();
    if (inBrowser) pending.set(key, request);
    try {
      for (const [path, url] of await request) {
        signed.set(path, url);
        if (inBrowser) browserCache.set(cacheKey(path), url, signedImageInfo(url)?.expiresAt ?? Date.now() + 3600_000);
      }
    } finally {
      if (inBrowser && pending.get(key) === request) pending.delete(key);
    }
  }
  return signed;
}
