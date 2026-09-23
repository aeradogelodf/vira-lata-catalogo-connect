import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const requestSchema = z.object({
  paths: z.array(z.string().trim().min(1).max(500)).max(200),
});

const BUCKET = "product-images";
const SIGNED_URL_TTL = 60 * 60;

/**
 * Returns signed URLs only for files referenced by currently active public
 * catalog records. Storage itself remains private and has no anonymous read
 * policy.
 */
export const getPublicImageUrls = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => requestSchema.parse(data))
  .handler(async ({ data }): Promise<Record<string, string>> => {
    const paths = Array.from(new Set(data.paths));
    if (paths.length === 0) return {};

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [products, productImages, services, banners] = await Promise.all([
      supabaseAdmin.from("products").select("image_url").eq("active", true).in("image_url", paths),
      supabaseAdmin
        .from("product_images")
        .select("image_url, products!inner(active)")
        .in("image_url", paths)
        .eq("products.active", true),
      supabaseAdmin.from("services").select("image_url").eq("active", true).in("image_url", paths),
      supabaseAdmin.from("banners").select("image_url").eq("active", true).in("image_url", paths),
    ]);

    const results = [products, productImages, services, banners];
    if (results.some((result) => result.error)) {
      console.error("Could not validate public catalog image references.");
      throw new Error("Não foi possível carregar as imagens.");
    }

    const allowed = Array.from(
      new Set(
        results.flatMap((result) =>
          (result.data ?? [])
            .map((row) => row.image_url)
            .filter((value): value is string => typeof value === "string"),
        ),
      ),
    );
    if (allowed.length === 0) return {};

    const { data: signed, error } = await supabaseAdmin.storage
      .from(BUCKET)
      .createSignedUrls(allowed, SIGNED_URL_TTL);
    if (error || !signed) {
      console.error("Could not create signed catalog image URLs.");
      throw new Error("Não foi possível carregar as imagens.");
    }

    return Object.fromEntries(
      signed.flatMap((item) => (item.path && item.signedUrl ? [[item.path, item.signedUrl]] : [])),
    );
  });