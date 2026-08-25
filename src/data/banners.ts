/**
 * Leitura pública dos banners (RLS: somente ativos). Sem lista estática:
 * banco vazio => a Home simplesmente não exibe o carrossel.
 */
import { supabase } from "@/integrations/supabase/client";
import { resolveImageUrls } from "@/lib/product-images";
import type { BannerLinkType, PublicBanner } from "@/lib/banners";

export async function fetchBanners(): Promise<PublicBanner[]> {
  const { data, error } = await supabase
    .from("banners")
    .select("id, title, subtitle, image_url, alt_text, cta_label, link_type, link_value")
    .eq("active", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) throw new Error("Não foi possível carregar os banners.");

  const rows = data ?? [];
  const signed = await resolveImageUrls(
    rows.map((row) => row.image_url).filter((value): value is string => Boolean(value)),
  );

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    subtitle: row.subtitle,
    imageUrl: row.image_url ? (signed.get(row.image_url) ?? row.image_url) : null,
    altText: row.alt_text,
    ctaLabel: row.cta_label,
    linkType: row.link_type as BannerLinkType,
    linkValue: row.link_value,
  }));
}
