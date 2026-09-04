/**
 * Leitura pública das configurações da loja (`store_settings`).
 * Registro único; se ainda não existir, devolve o fallback técnico.
 */
import { supabase } from "@/integrations/supabase/client";
import { setActiveStore } from "@/lib/whatsapp";
import {
  FALLBACK_STORE,
  WEEK_DAYS,
  type OpeningHour,
  type StoreInfo,
  type WeekDay,
} from "@/lib/store-settings";

const FIELDS =
  "name, trade_name, segment, short_description, long_description, whatsapp_e164, whatsapp_display, phone, email, street, number, complement, district, city, state, postal_code, country, opening_hours, instagram_url, facebook_url, tiktok_url, website_url, other_social_url, hide_out_of_stock, updated_at";

type Row = Record<string, unknown>;

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() !== "" ? value.trim() : null;
}

function mapHours(value: unknown): OpeningHour[] {
  const list = Array.isArray(value) ? (value as Row[]) : [];
  const byDay = new Map(list.map((item) => [String(item["day"]), item]));
  return WEEK_DAYS.map(({ day, label }) => {
    const item = byDay.get(day);
    return {
      day: day as WeekDay,
      label: text(item?.["label"]) ?? label,
      opensAt: text(item?.["opensAt"]),
      closesAt: text(item?.["closesAt"]),
    };
  });
}

export function mapStoreRow(row: Row): StoreInfo {
  return {
    name: text(row["name"]) ?? FALLBACK_STORE.name,
    tradeName: text(row["trade_name"]),
    segment: text(row["segment"]),
    shortDescription: text(row["short_description"]),
    longDescription: text(row["long_description"]),
    whatsapp: {
      e164: text(row["whatsapp_e164"]) ?? FALLBACK_STORE.whatsapp.e164,
      display: text(row["whatsapp_display"]),
    },
    phone: text(row["phone"]),
    email: text(row["email"]),
    address: {
      street: text(row["street"]),
      number: text(row["number"]),
      complement: text(row["complement"]),
      district: text(row["district"]),
      city: text(row["city"]),
      state: text(row["state"]),
      postalCode: text(row["postal_code"]),
      country: text(row["country"]) ?? "BR",
    },
    openingHours: mapHours(row["opening_hours"]),
    socials: {
      instagram: text(row["instagram_url"]),
      facebook: text(row["facebook_url"]),
      tiktok: text(row["tiktok_url"]),
      website: text(row["website_url"]),
      other: text(row["other_social_url"]),
    },
    catalog: { hideOutOfStock: row["hide_out_of_stock"] === true },
    updatedAt: text(row["updated_at"]),
  };
}

export async function fetchStoreSettings(): Promise<StoreInfo> {
  const { data, error } = await supabase
    // Visão pública: expõe apenas as colunas institucionais do catálogo.
    .from("store_settings_public")
    .select(FIELDS)
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  const store = data ? mapStoreRow(data as Row) : FALLBACK_STORE;
  // Mantém as mensagens de WhatsApp sincronizadas sem duplicar lógica.
  setActiveStore(store);
  return store;
}
