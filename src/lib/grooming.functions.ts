import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  petSizeFormSchema,
  servicePricingFormSchema,
  type PetSize,
  type ServicePricing,
} from "@/lib/grooming";

type Ctx = { supabase: any; userId: string };

async function assertAdmin(context: Ctx) {
  const { data, error } = await context.supabase.rpc("is_admin");
  if (error) throw new Error("Não foi possível validar suas permissões.");
  if (!data) throw new Error("Acesso restrito a administradores.");
}

const idInput = z.object({ id: z.string().uuid() });

const SIZE_FIELDS = "id, name, slug, description, sort_order, active, updated_at";
const PRICING_FIELDS =
  "id, service_id, size_id, price, duration_minutes, note, active, updated_at";

function mapSize(row: any): PetSize {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    sortOrder: row.sort_order,
    active: row.active,
    updatedAt: row.updated_at,
  };
}

function mapPricing(row: any): ServicePricing {
  return {
    id: row.id,
    serviceId: row.service_id,
    sizeId: row.size_id,
    price: Number(row.price),
    durationMinutes: row.duration_minutes,
    note: row.note,
    active: row.active,
    updatedAt: row.updated_at,
  };
}

/* -------------------------------- Portes -------------------------------- */

export const listPetSizesAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<PetSize[]> => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("pet_sizes")
      .select(SIZE_FIELDS)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });
    if (error) throw new Error("Não foi possível carregar os portes.");
    return (data ?? []).map(mapSize);
  });

export const savePetSize = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ id: z.string().uuid().optional(), values: petSizeFormSchema }).parse(data),
  )
  .handler(async ({ data, context }): Promise<{ id: string }> => {
    await assertAdmin(context);
    const { supabase } = context;
    const values = data.values;

    // Integridade também no servidor: nome e identificador únicos.
    // Duas consultas exatas evitam que vírgulas, "%" ou "_" no nome quebrem
    // a sintaxe do filtro combinado e gerem falsos positivos.
    const excludeSelf = <T extends { neq: (c: string, v: string) => T }>(query: T) =>
      data.id ? query.neq("id", data.id) : query;

    const [bySlug, byName] = await Promise.all([
      excludeSelf(supabase.from("pet_sizes").select("id").eq("slug", values.slug).limit(1)),
      excludeSelf(supabase.from("pet_sizes").select("id").ilike("name", values.name).limit(1)),
    ]);

    if (bySlug.error || byName.error) throw new Error("Não foi possível validar o porte.");
    if ((bySlug.data ?? []).length > 0) throw new Error("Já existe um porte com este identificador.");
    if ((byName.data ?? []).length > 0) throw new Error("Já existe um porte com este nome.");


    const payload = {
      name: values.name,
      slug: values.slug,
      description: values.description ? values.description : null,
      sort_order: values.sortOrder,
      active: values.active,
    };

    if (!data.id) {
      const { data: inserted, error } = await supabase
        .from("pet_sizes")
        .insert(payload)
        .select("id")
        .single();
      if (error) throw new Error("Não foi possível criar o porte.");
      return { id: inserted.id };
    }

    const { error } = await supabase.from("pet_sizes").update(payload).eq("id", data.id);
    if (error) throw new Error("Não foi possível salvar as alterações do porte.");
    return { id: data.id };
  });

export const togglePetSize = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => idInput.extend({ value: z.boolean() }).parse(data))
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    await assertAdmin(context);
    const { error } = await context.supabase
      .from("pet_sizes")
      .update({ active: data.value })
      .eq("id", data.id);
    if (error) throw new Error("Não foi possível atualizar o porte.");
    return { ok: true };
  });

export const deletePetSize = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => idInput.parse(data))
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    await assertAdmin(context);
    const { supabase } = context;
    // Protege configurações existentes: exclusão só quando não há vínculos.
    const { count, error: countError } = await supabase
      .from("service_pricing")
      .select("id", { count: "exact", head: true })
      .eq("size_id", data.id);
    if (countError) throw new Error("Não foi possível verificar as configurações vinculadas.");
    if ((count ?? 0) > 0) {
      throw new Error(
        "Este porte possui preços configurados. Desative-o ou remova as configurações antes de excluir.",
      );
    }
    const { error } = await supabase.from("pet_sizes").delete().eq("id", data.id);
    if (error) throw new Error("Não foi possível excluir o porte.");
    return { ok: true };
  });

/* -------------------------- Preços e duração ---------------------------- */

export const listServicePricingAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ServicePricing[]> => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("service_pricing")
      .select(PRICING_FIELDS);
    if (error) throw new Error("Não foi possível carregar os preços.");
    return (data ?? []).map(mapPricing);
  });

export const saveServicePricing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ id: z.string().uuid().optional(), values: servicePricingFormSchema }).parse(data),
  )
  .handler(async ({ data, context }): Promise<{ id: string }> => {
    await assertAdmin(context);
    const { supabase } = context;
    const values = data.values;

    let dup = supabase
      .from("service_pricing")
      .select("id")
      .eq("service_id", values.serviceId)
      .eq("size_id", values.sizeId)
      .limit(1);
    if (data.id) dup = dup.neq("id", data.id);
    const { data: duplicates, error: dupError } = await dup;
    if (dupError) throw new Error("Não foi possível validar a combinação.");
    if ((duplicates ?? []).length > 0) {
      throw new Error("Já existe uma configuração para este serviço e porte.");
    }

    const payload = {
      service_id: values.serviceId,
      size_id: values.sizeId,
      price: values.price,
      duration_minutes: values.durationMinutes,
      note: values.note ? values.note : null,
      active: values.active,
    };

    if (!data.id) {
      const { data: inserted, error } = await supabase
        .from("service_pricing")
        .insert(payload)
        .select("id")
        .single();
      if (error) throw new Error("Não foi possível salvar o preço.");
      return { id: inserted.id };
    }

    const { error } = await supabase.from("service_pricing").update(payload).eq("id", data.id);
    if (error) throw new Error("Não foi possível salvar as alterações.");
    return { id: data.id };
  });

export const toggleServicePricing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => idInput.extend({ value: z.boolean() }).parse(data))
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    await assertAdmin(context);
    const { error } = await context.supabase
      .from("service_pricing")
      .update({ active: data.value })
      .eq("id", data.id);
    if (error) throw new Error("Não foi possível atualizar a combinação.");
    return { ok: true };
  });

export const deleteServicePricing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => idInput.parse(data))
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("service_pricing").delete().eq("id", data.id);
    if (error) throw new Error("Não foi possível excluir a configuração.");
    return { ok: true };
  });
