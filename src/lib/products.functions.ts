import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  productFormSchema,
  type AdminProductDetail,
  type AdminProductRow,
} from "@/lib/products";

const listInput = z.object({
  search: z.string().trim().max(120).optional(),
  status: z.enum(["all", "active", "inactive"]).default("all"),
  featured: z.boolean().optional(),
  onSale: z.boolean().optional(),
  inStock: z.boolean().optional(),
  categoryId: z.string().uuid().nullable().optional(),
  brandId: z.string().uuid().nullable().optional(),
  page: z.number().int().min(0).default(0),
  pageSize: z.number().int().min(5).max(100).default(20),
});

const idInput = z.object({ id: z.string().uuid() });

const saveInput = z.object({
  id: z.string().uuid().optional(),
  expectedUpdatedAt: z.string().optional(),
  values: productFormSchema,
});

const flagInput = z.object({
  id: z.string().uuid(),
  expectedUpdatedAt: z.string().optional(),
  field: z.enum(["active", "featured", "on_sale"]),
  value: z.boolean(),
});

const imageInput = z.object({
  productId: z.string().uuid(),
  path: z.string().trim().min(3).max(300),
  altText: z.string().trim().max(160).optional(),
});

const imageIdInput = z.object({ productId: z.string().uuid(), imageId: z.string().uuid() });

const reorderInput = z.object({
  productId: z.string().uuid(),
  order: z.array(z.string().uuid()).max(30),
});

/**
 * Autorização SEMPRE no servidor: sessão válida (middleware) + papel admin
 * verificado pela função `has_role`. O RLS do banco continua sendo a última
 * barreira. Todas as mutações passam por aqui, o que permite adicionar
 * auditoria futuramente em um único ponto.
 */
async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error) throw new Error("Não foi possível validar suas permissões.");
  if (!data) throw new Error("Acesso restrito a administradores.");
}

function emptyToNull(value: string | undefined): string | null {
  return value && value.trim() !== "" ? value.trim() : null;
}

export const listProductsAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => listInput.parse(data))
  .handler(async ({ data, context }): Promise<{ rows: AdminProductRow[]; total: number }> => {
    await assertAdmin(context);
    const { supabase } = context;

    let query = supabase
      .from("products")
      .select(
        "id, name, slug, sku, internal_code, category_id, brand_id, price, old_price, unit, stock, min_stock, active, featured, on_sale, sort_order, updated_at, image_url, categories(name), brands(name), product_images(image_url, is_primary, sort_order)",
        { count: "exact" },
      )
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true })
      .range(data.page * data.pageSize, data.page * data.pageSize + data.pageSize - 1);

    if (data.status === "active") query = query.eq("active", true);
    if (data.status === "inactive") query = query.eq("active", false);
    if (data.featured) query = query.eq("featured", true);
    if (data.onSale) query = query.eq("on_sale", true);
    if (data.inStock) query = query.gt("stock", 0);
    if (data.categoryId) query = query.eq("category_id", data.categoryId);
    if (data.brandId) query = query.eq("brand_id", data.brandId);

    if (data.search) {
      const term = `%${data.search.replace(/[%_,()]/g, "")}%`;
      query = query.or(
        `name.ilike.${term},slug.ilike.${term},sku.ilike.${term},internal_code.ilike.${term}`,
      );
    }

    const { data: rows, error, count } = await query;
    if (error) throw new Error("Não foi possível carregar os produtos.");

    return {
      total: count ?? 0,
      rows: (rows ?? []).map((row: any): AdminProductRow => {
        const images = (row.product_images ?? []).slice().sort(
          (a: any, b: any) =>
            Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order,
        );
        return {
          id: row.id,
          name: row.name,
          slug: row.slug,
          sku: row.sku,
          internalCode: row.internal_code,
          categoryId: row.category_id,
          brandId: row.brand_id,
          categoryName: row.categories?.name ?? null,
          brandName: row.brands?.name ?? null,
          price: row.price === null ? null : Number(row.price),
          oldPrice: row.old_price === null ? null : Number(row.old_price),
          unit: row.unit,
          stock: row.stock,
          minStock: row.min_stock,
          active: row.active,
          featured: row.featured,
          onSale: row.on_sale,
          sortOrder: row.sort_order,
          updatedAt: row.updated_at,
          primaryImage: images[0]?.image_url ?? row.image_url ?? null,
        };
      }),
    };
  });

export const getProductAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => idInput.parse(data))
  .handler(async ({ data, context }): Promise<AdminProductDetail> => {
    await assertAdmin(context);
    const { data: row, error } = await context.supabase
      .from("products")
      .select(
        "*, product_images(id, image_url, alt_text, sort_order, is_primary)",
      )
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error("Não foi possível carregar o produto.");
    if (!row) throw new Error("Produto não encontrado.");

    return {
      id: row.id,
      internalCode: row.internal_code,
      updatedAt: row.updated_at,
      images: (row.product_images ?? [])
        .slice()
        .sort(
          (a: any, b: any) =>
            Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order,
        )
        .map((image: any) => ({
          id: image.id,
          imageUrl: image.image_url,
          altText: image.alt_text,
          sortOrder: image.sort_order,
          isPrimary: image.is_primary,
        })),
      values: {
        name: row.name,
        slug: row.slug,
        description: row.description ?? "",
        categoryId: row.category_id,
        brandId: row.brand_id,
        subcategory: row.subcategory ?? "",
        sku: row.sku ?? "",
        price: row.price === null ? null : Number(row.price),
        oldPrice: row.old_price === null ? null : Number(row.old_price),
        unit: row.unit,
        packageSize: row.package_size ?? "",
        stock: row.stock,
        minStock: row.min_stock,
        active: row.active,
        featured: row.featured,
        onSale: row.on_sale,
        sortOrder: row.sort_order,
        seoTitle: row.seo_title ?? "",
        seoDescription: row.seo_description ?? "",
      },
    };
  });

export const saveProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => saveInput.parse(data))
  .handler(async ({ data, context }): Promise<{ id: string }> => {
    await assertAdmin(context);
    const { supabase } = context;
    const values = data.values;

    let duplicate = supabase.from("products").select("id").eq("slug", values.slug).limit(1);
    if (data.id) duplicate = duplicate.neq("id", data.id);
    const { data: existing, error: duplicateError } = await duplicate;
    if (duplicateError) throw new Error("Não foi possível validar o slug.");
    if ((existing ?? []).length > 0) throw new Error("Já existe um produto com este slug.");

    const payload = {
      name: values.name,
      slug: values.slug,
      description: emptyToNull(values.description),
      category_id: values.categoryId,
      brand_id: values.brandId,
      subcategory: emptyToNull(values.subcategory),
      sku: emptyToNull(values.sku),
      price: values.price,
      old_price: values.oldPrice,
      unit: values.unit,
      package_size: emptyToNull(values.packageSize),
      stock: values.stock,
      min_stock: values.minStock,
      active: values.active,
      featured: values.featured,
      on_sale: values.onSale,
      sort_order: values.sortOrder,
      seo_title: emptyToNull(values.seoTitle),
      seo_description: emptyToNull(values.seoDescription),
    };

    if (!data.id) {
      const { data: inserted, error } = await supabase
        .from("products")
        .insert(payload)
        .select("id")
        .single();
      if (error) throw new Error("Não foi possível criar o produto.");
      return { id: inserted.id };
    }

    let update = supabase.from("products").update(payload).eq("id", data.id);
    if (data.expectedUpdatedAt) update = update.eq("updated_at", data.expectedUpdatedAt);
    const { data: updated, error } = await update.select("id");
    if (error) throw new Error("Não foi possível salvar o produto.");
    if ((updated ?? []).length === 0) {
      throw new Error(
        "Este produto foi alterado por outro administrador. Recarregue antes de salvar.",
      );
    }
    return { id: data.id };
  });

export const toggleProductFlag = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => flagInput.parse(data))
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    await assertAdmin(context);

    if (data.field === "on_sale" && data.value) {
      const { data: row, error } = await context.supabase
        .from("products")
        .select("price, old_price")
        .eq("id", data.id)
        .maybeSingle();
      if (error || !row) throw new Error("Não foi possível carregar o produto.");
      const price = row.price === null ? null : Number(row.price);
      const oldPrice = row.old_price === null ? null : Number(row.old_price);
      if (price === null || oldPrice === null || oldPrice <= price) {
        throw new Error(
          "Para ativar a promoção, cadastre o preço atual e um preço anterior maior.",
        );
      }
    }

    const patch: Record<string, boolean> = { [data.field]: data.value };
    let update = context.supabase
      .from("products")
      .update(patch as never)
      .eq("id", data.id);
    if (data.expectedUpdatedAt) update = update.eq("updated_at", data.expectedUpdatedAt);
    const { data: rows, error } = await update.select("id");
    if (error) throw new Error("Não foi possível atualizar o produto.");
    if ((rows ?? []).length === 0) {
      throw new Error("Produto alterado por outro administrador. Recarregue a lista.");
    }
    return { ok: true };
  });

export const deleteProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => idInput.parse(data))
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    await assertAdmin(context);
    const { supabase } = context;

    // Remove primeiro os arquivos do Storage para não deixar órfãos.
    const { data: images } = await supabase
      .from("product_images")
      .select("image_url")
      .eq("product_id", data.id);
    const paths = (images ?? [])
      .map((image: any) => image.image_url as string)
      .filter((url: string) => url && !/^(https?:)?\/\//.test(url));
    if (paths.length > 0) {
      await supabase.storage.from("product-images").remove(paths);
    }

    const { error: imagesError } = await supabase
      .from("product_images")
      .delete()
      .eq("product_id", data.id);
    if (imagesError) throw new Error("Não foi possível remover as imagens do produto.");

    const { error } = await supabase.from("products").delete().eq("id", data.id);
    if (error) throw new Error("Não foi possível excluir o produto.");
    return { ok: true };
  });

export const addProductImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => imageInput.parse(data))
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    await assertAdmin(context);
    const { supabase } = context;

    const { count, error: countError } = await supabase
      .from("product_images")
      .select("id", { count: "exact", head: true })
      .eq("product_id", data.productId);
    if (countError) throw new Error("Não foi possível registrar a imagem.");

    const { error } = await supabase.from("product_images").insert({
      product_id: data.productId,
      image_url: data.path,
      alt_text: emptyToNull(data.altText),
      sort_order: count ?? 0,
      is_primary: (count ?? 0) === 0,
    });
    if (error) throw new Error("Não foi possível registrar a imagem.");
    return { ok: true };
  });

export const deleteProductImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => imageIdInput.parse(data))
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    await assertAdmin(context);
    const { supabase } = context;

    const { data: image, error: readError } = await supabase
      .from("product_images")
      .select("id, image_url, is_primary")
      .eq("id", data.imageId)
      .eq("product_id", data.productId)
      .maybeSingle();
    if (readError || !image) throw new Error("Imagem não encontrada.");

    const { error } = await supabase.from("product_images").delete().eq("id", data.imageId);
    if (error) throw new Error("Não foi possível remover a imagem.");

    if (image.image_url && !/^(https?:)?\/\//.test(image.image_url)) {
      await supabase.storage.from("product-images").remove([image.image_url]);
    }

    if (image.is_primary) {
      const { data: next } = await supabase
        .from("product_images")
        .select("id")
        .eq("product_id", data.productId)
        .order("sort_order", { ascending: true })
        .limit(1);
      const fallback = (next ?? [])[0];
      if (fallback) {
        await supabase.from("product_images").update({ is_primary: true }).eq("id", fallback.id);
      }
    }
    return { ok: true };
  });

export const setPrimaryProductImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => imageIdInput.parse(data))
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    await assertAdmin(context);
    const { supabase } = context;
    const { error: clearError } = await supabase
      .from("product_images")
      .update({ is_primary: false })
      .eq("product_id", data.productId);
    if (clearError) throw new Error("Não foi possível definir a imagem principal.");
    const { error } = await supabase
      .from("product_images")
      .update({ is_primary: true })
      .eq("id", data.imageId)
      .eq("product_id", data.productId);
    if (error) throw new Error("Não foi possível definir a imagem principal.");
    return { ok: true };
  });

export const reorderProductImages = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => reorderInput.parse(data))
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    await assertAdmin(context);
    for (const [index, imageId] of data.order.entries()) {
      const { error } = await context.supabase
        .from("product_images")
        .update({ sort_order: index })
        .eq("id", imageId)
        .eq("product_id", data.productId);
      if (error) throw new Error("Não foi possível reordenar as imagens.");
    }
    return { ok: true };
  });
