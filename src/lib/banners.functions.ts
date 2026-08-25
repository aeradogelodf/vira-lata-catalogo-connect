import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { bannerFormSchema, type AdminBanner, type BannerLinkType } from "@/lib/banners";

const listInput = z.object({ search: z.string().trim().max(80).optional() });

const saveInput = z.object({
  id: z.string().uuid().optional(),
  expectedUpdatedAt: z.string().optional(),
  values: bannerFormSchema,
});

const idInput = z.object({ id: z.string().uuid() });
const toggleInput = idInput.extend({ value: z.boolean() });
const reorderInput = z.object({ order: z.array(z.string().uuid()).min(1).max(200) });

type Ctx = { supabase: any; userId: string };

async function assertAdmin(context: Ctx) {
  const { data, error } = await context.supabase.rpc("is_admin");
  if (error) throw new Error("Não foi possível validar suas permissões.");
  if (!data) throw new Error("Acesso restrito a administradores.");
}

const FIELDS =
  "id, title, subtitle, image_url, alt_text, cta_label, link_type, link_value, sort_order, active, updated_at";

function mapRow(row: any): AdminBanner {
  return {
    id: row.id,
    title: row.title,
    subtitle: row.subtitle,
    imageUrl: row.image_url,
    altText: row.alt_text,
    ctaLabel: row.cta_label,
    linkType: row.link_type as BannerLinkType,
    linkValue: row.link_value,
    sortOrder: row.sort_order,
    active: row.active,
    updatedAt: row.updated_at,
  };
}

export const listBannersAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => listInput.parse(data))
  .handler(async ({ data, context }): Promise<AdminBanner[]> => {
    await assertAdmin(context);
    let query = context.supabase
      .from("banners")
      .select(FIELDS)
      .order("sort_order", { ascending: true })
      .order("title", { ascending: true });

    if (data.search) {
      const term = `%${data.search.replace(/[%_]/g, "")}%`;
      query = query.or(`title.ilike.${term},subtitle.ilike.${term}`);
    }

    const { data: rows, error } = await query;
    if (error) throw new Error("Não foi possível carregar os banners.");
    return (rows ?? []).map(mapRow);
  });

export const saveBanner = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => saveInput.parse(data))
  .handler(async ({ data, context }): Promise<{ id: string }> => {
    await assertAdmin(context);
    const { supabase } = context;
    const values = data.values;

    const payload = {
      title: values.title,
      subtitle: values.subtitle ? values.subtitle : null,
      image_url: values.imageUrl ? values.imageUrl : null,
      alt_text: values.altText ? values.altText : null,
      cta_label: values.linkType === "none" ? null : (values.ctaLabel ?? null),
      link_type: values.linkType,
      link_value:
        values.linkType === "none" || !values.linkValue ? null : values.linkValue.trim(),
      sort_order: values.sortOrder,
      active: values.active,
    };

    if (!data.id) {
      const { data: inserted, error } = await supabase
        .from("banners")
        .insert(payload)
        .select("id")
        .single();
      if (error) throw new Error("Não foi possível criar o banner.");
      return { id: inserted.id };
    }

    let update = supabase.from("banners").update(payload).eq("id", data.id);
    if (data.expectedUpdatedAt) update = update.eq("updated_at", data.expectedUpdatedAt);
    const { data: updated, error } = await update.select("id");
    if (error) throw new Error("Não foi possível salvar as alterações.");
    if ((updated ?? []).length === 0) {
      throw new Error(
        "Este banner foi alterado por outro administrador. Recarregue a lista antes de salvar.",
      );
    }
    return { id: data.id };
  });

export const toggleBannerActive = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => toggleInput.parse(data))
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    await assertAdmin(context);
    const { error } = await context.supabase
      .from("banners")
      .update({ active: data.value })
      .eq("id", data.id);
    if (error) throw new Error("Não foi possível atualizar o banner.");
    return { ok: true };
  });

export const reorderBanners = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => reorderInput.parse(data))
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    await assertAdmin(context);
    for (const [index, id] of data.order.entries()) {
      const { error } = await context.supabase
        .from("banners")
        .update({ sort_order: index })
        .eq("id", id);
      if (error) throw new Error("Não foi possível reordenar os banners.");
    }
    return { ok: true };
  });

export const deleteBanner = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => idInput.parse(data))
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("banners").delete().eq("id", data.id);
    if (error) throw new Error("Não foi possível excluir o banner.");
    return { ok: true };
  });
