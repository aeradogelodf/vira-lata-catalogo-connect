import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { storeSettingsSchema } from "@/lib/store-settings";

async function assertAdmin(context: { supabase: { rpc: (fn: string) => Promise<{ data: unknown; error: unknown }> } }) {
  const { data, error } = await context.supabase.rpc("is_admin");
  if (error) throw new Error("Não foi possível validar suas permissões.");
  if (!data) throw new Error("Acesso restrito a administradores.");
}

/** Salva as configurações institucionais (registro único). Somente admin. */
export const saveStoreSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => storeSettingsSchema.parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context as never);
    const { supabase } = context;

    const payload = {
      singleton: true,
      name: data.name,
      trade_name: data.tradeName || null,
      segment: data.segment || null,
      short_description: data.shortDescription || null,
      long_description: data.longDescription || null,
      whatsapp_e164: data.whatsapp.replace(/\D/g, ""),
      whatsapp_display: data.whatsappDisplay || null,
      phone: data.phone || null,
      email: data.email || null,
      street: data.street || null,
      number: data.number || null,
      complement: data.complement || null,
      district: data.district || null,
      city: data.city || null,
      state: data.state ? data.state.toUpperCase() : null,
      postal_code: data.postalCode || null,
      country: (data.country || "BR").toUpperCase(),
      opening_hours: data.openingHours.map((hour) => ({
        day: hour.day,
        label: hour.label,
        opensAt: hour.closed ? null : hour.opensAt,
        closesAt: hour.closed ? null : hour.closesAt,
      })),
      instagram_url: data.instagramUrl || null,
      facebook_url: data.facebookUrl || null,
      tiktok_url: data.tiktokUrl || null,
      website_url: data.websiteUrl || null,
      other_social_url: data.otherSocialUrl || null,
      hide_out_of_stock: data.hideOutOfStock,
    };

    const { error } = await supabase
      .from("store_settings")
      .upsert(payload, { onConflict: "singleton" });

    if (error) throw new Error("Não foi possível salvar as configurações.");
    return { ok: true as const };
  });
