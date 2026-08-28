import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { serviceFormSchema, type AdminService } from "@/lib/services";

const listInput = z.object({ search: z.string().trim().max(80).optional() });

const saveInput = z.object({
  id: z.string().uuid().optional(),
  expectedUpdatedAt: z.string().optional(),
  values: serviceFormSchema,
});

const idInput = z.object({ id: z.string().uuid() });
const toggleInput = idInput.extend({
  field: z.enum(["active", "featured"]),
  value: z.boolean(),
});
const reorderInput = z.object({ order: z.array(z.string().uuid()).min(1).max(200) });

type Ctx = { supabase: any; userId: string };

async function assertAdmin(context: Ctx) {
  const { data, error } = await context.supabase.rpc("is_admin");
  if (error) throw new Error("Não foi possível validar suas permissões.");
  if (!data) throw new Error("Acesso restrito a administradores.");
}

const FIELDS =
  "id, name, slug, description, price, price_note, image_url, sort_order, featured, active, updated_at";

function mapRow(row: any): AdminService {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    price: row.price === null ? null : Number(row.price),
    priceNote: row.price_note,
    imageUrl: row.image_url,
    sortOrder: row.sort_order,
    featured: row.featured,
    active: row.active,
    updatedAt: row.updated_at,
  };
}

export const listServicesAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => listInput.parse(data))
  .handler(async ({ data, context }): Promise<AdminService[]> => {
    await assertAdmin(context);
    let query = context.supabase
      .from("services")
      .select(FIELDS)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });

    if (data.search) {
      const term = `%${data.search.replace(/[%_]/g, "")}%`;
      query = query.or(`name.ilike.${term},slug.ilike.${term}`);
    }

    const { data: rows, error } = await query;
    if (error) throw new Error("Não foi possível carregar os serviços.");
    return (rows ?? []).map(mapRow);
  });

export const saveService = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => saveInput.parse(data))
  .handler(async ({ data, context }): Promise<{ id: string }> => {
    await assertAdmin(context);
    const { supabase } = context;
    const values = data.values;

    let duplicateQuery = supabase.from("services").select("id").eq("slug", values.slug).limit(1);
    if (data.id) duplicateQuery = duplicateQuery.neq("id", data.id);
    const { data: duplicate, error: duplicateError } = await duplicateQuery;
    if (duplicateError) throw new Error("Não foi possível validar o slug.");
    if ((duplicate ?? []).length > 0) throw new Error("Já existe um serviço com este slug.");

    const payload = {
      name: values.name,
      slug: values.slug,
      description: values.description ? values.description : null,
      price: values.price,
      price_note: values.priceNote ? values.priceNote : null,
      image_url: values.imageUrl ? values.imageUrl : null,
      sort_order: values.sortOrder,
      featured: values.featured,
      active: values.active,
    };

    if (!data.id) {
      const { data: inserted, error } = await supabase
        .from("services")
        .insert(payload)
        .select("id")
        .single();
      if (error) throw new Error("Não foi possível criar o serviço.");
      return { id: inserted.id };
    }

    let update = supabase.from("services").update(payload).eq("id", data.id);
    if (data.expectedUpdatedAt) update = update.eq("updated_at", data.expectedUpdatedAt);
    const { data: updated, error } = await update.select("id");
    if (error) throw new Error("Não foi possível salvar as alterações.");
    if ((updated ?? []).length === 0) {
      throw new Error(
        "Este serviço foi alterado por outro administrador. Recarregue a lista antes de salvar.",
      );
    }
    return { id: data.id };
  });

export const toggleServiceFlag = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => toggleInput.parse(data))
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    await assertAdmin(context);
    const { error } = await context.supabase
      .from("services")
      .update(
        data.field === "active" ? { active: data.value } : { featured: data.value },
      )
      .eq("id", data.id);
    if (error) throw new Error("Não foi possível atualizar o serviço.");
    return { ok: true };
  });

export const reorderServices = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => reorderInput.parse(data))
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    await assertAdmin(context);
    for (const [index, id] of data.order.entries()) {
      const { error } = await context.supabase
        .from("services")
        .update({ sort_order: index })
        .eq("id", id);
      if (error) throw new Error("Não foi possível reordenar os serviços.");
    }
    return { ok: true };
  });

export const deleteService = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => idInput.parse(data))
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    await assertAdmin(context);
    const { supabase } = context;

    // Remove o arquivo do Storage antes da linha para não deixar órfãos.
    const { data: row } = await supabase
      .from("services")
      .select("image_url")
      .eq("id", data.id)
      .maybeSingle();
    const path = row?.image_url as string | null | undefined;
    if (path && !/^(https?:)?\/\//.test(path)) {
      await supabase.storage.from("product-images").remove([path]);
    }

    const { error } = await supabase.from("services").delete().eq("id", data.id);
    if (error) throw new Error("Não foi possível excluir o serviço.");
    return { ok: true };
  });
