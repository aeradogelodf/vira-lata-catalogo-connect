/**
 * Leitura pública dos serviços (RLS: somente ativos). Sem lista estática:
 * banco vazio => página exibe estado vazio profissional.
 */
import { supabase } from "@/integrations/supabase/client";
import { resolveImageUrls } from "@/lib/product-images";
import type { PublicService } from "@/lib/services";

export async function fetchServices(): Promise<PublicService[]> {
  const { data, error } = await supabase
    .from("services")
    .select("id, name, slug, description, price, price_note, image_url, featured")
    .eq("active", true)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) throw new Error("Não foi possível carregar os serviços.");

  const rows = data ?? [];
  const signed = await resolveImageUrls(
    rows.map((row) => row.image_url).filter((value): value is string => Boolean(value)),
  );

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    price: row.price === null ? null : Number(row.price),
    priceNote: row.price_note,
    imageUrl: row.image_url ? (signed.get(row.image_url) ?? row.image_url) : null,
    featured: row.featured,
  }));
}
