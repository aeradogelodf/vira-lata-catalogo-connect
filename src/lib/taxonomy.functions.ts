import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  brandFormSchema,
  categoryFormSchema,
  type TaxonomyRow,
} from "@/lib/taxonomy";
import { z } from "zod";

const kindSchema = z.enum(["categories", "brands"]);

const listInput = z.object({ kind: kindSchema, search: z.string().trim().max(80).optional() });

const saveInput = z.object({
  kind: kindSchema,
  id: z.string().uuid().optional(),
  expectedUpdatedAt: z.string().optional(),
  values: z.union([categoryFormSchema, brandFormSchema]),
});

const idInput = z.object({
  kind: kindSchema,
  id: z.string().uuid(),
  expectedUpdatedAt: z.string().optional(),
});

const toggleInput = idInput.extend({ active: z.boolean() });

const FK = { categories: "category_id", brands: "brand_id" } as const;

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error) throw new Error("Não foi possível validar suas permissões.");
  if (!data) throw new Error("Acesso restrito a administradores.");
}

export const listTaxonomy = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => listInput.parse(data))
  .handler(async ({ data, context }): Promise<TaxonomyRow[]> => {
    await assertAdmin(context);
    const { supabase } = context;

    let query = supabase
      .from(data.kind)
      .select("id, name, slug, description, sort_order, active, updated_at")
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });

    if (data.search) {
      const term = `%${data.search.replace(/[%_]/g, "")}%`;
      query = query.or(`name.ilike.${term},slug.ilike.${term}`);
    }

    const { data: rows, error } = await query;
    if (error) throw new Error("Não foi possível carregar os registros.");

    const fk = FK[data.kind];
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select(`id, ${fk}`);
    if (productsError) throw new Error("Não foi possível contar os produtos vinculados.");

    const counts = new Map<string, number>();
    for (const product of (products ?? []) as Record<string, string | null>[]) {
      const key = product[fk];
      if (key) counts.set(key, (counts.get(key) ?? 0) + 1);
    }

    return (rows ?? []).map((row: any) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      description: row.description,
      sortOrder: row.sort_order,
      active: row.active,
      updatedAt: row.updated_at,
      productCount: counts.get(row.id) ?? 0,
    }));
  });

export const saveTaxonomy = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => saveInput.parse(data))
  .handler(async ({ data, context }): Promise<{ id: string }> => {
    await assertAdmin(context);
    const { supabase } = context;
    const values = data.values;

    // Unicidade de slug validada no servidor (o banco também possui índice único).
    let duplicateQuery = supabase.from(data.kind).select("id").eq("slug", values.slug).limit(1);
    if (data.id) duplicateQuery = duplicateQuery.neq("id", data.id);
    const { data: duplicate, error: duplicateError } = await duplicateQuery;
    if (duplicateError) throw new Error("Não foi possível validar o slug.");
    if ((duplicate ?? []).length > 0) throw new Error("Já existe um registro com este slug.");

    const payload = {
      name: values.name,
      slug: values.slug,
      description: values.description ? values.description : null,
      sort_order: values.sortOrder,
      active: values.active,
    };

    if (!data.id) {
      const { data: inserted, error } = await supabase
        .from(data.kind)
        .insert(payload)
        .select("id")
        .single();
      if (error) throw new Error("Não foi possível criar o registro.");
      return { id: inserted.id };
    }

    let update = supabase.from(data.kind).update(payload).eq("id", data.id);
    if (data.expectedUpdatedAt) update = update.eq("updated_at", data.expectedUpdatedAt);
    const { data: updated, error } = await update.select("id");
    if (error) throw new Error("Não foi possível salvar as alterações.");
    if ((updated ?? []).length === 0) {
      throw new Error(
        "Este registro foi alterado por outro administrador. Recarregue a lista antes de salvar.",
      );
    }
    return { id: data.id };
  });

export const toggleTaxonomyActive = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => toggleInput.parse(data))
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    await assertAdmin(context);
    let update = context.supabase
      .from(data.kind)
      .update({ active: data.active })
      .eq("id", data.id);
    if (data.expectedUpdatedAt) update = update.eq("updated_at", data.expectedUpdatedAt);
    const { data: rows, error } = await update.select("id");
    if (error) throw new Error("Não foi possível atualizar o status.");
    if ((rows ?? []).length === 0) {
      throw new Error("Registro alterado por outro administrador. Recarregue a lista.");
    }
    return { ok: true };
  });

export const deleteTaxonomy = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => idInput.parse(data))
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    await assertAdmin(context);
    const { error } = await context.supabase.from(data.kind).delete().eq("id", data.id);
    if (error) throw new Error("Não foi possível excluir o registro.");
    return { ok: true };
  });
