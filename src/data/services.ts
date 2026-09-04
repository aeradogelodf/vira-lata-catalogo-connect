/**
 * Leitura pública dos serviços (RLS: somente ativos). Sem lista estática:
 * banco vazio => página exibe estado vazio profissional.
 * Preços por porte vêm de service_pricing (RLS já filtra combinações ativas).
 */
import { supabase } from "@/integrations/supabase/client";
import { resolveImageUrls } from "@/lib/product-images";
import type { PublicServicePrice } from "@/lib/grooming";
import type { PublicService } from "@/lib/services";

export async function fetchServices(): Promise<PublicService[]> {
  // Duas consultas agregadas (sem N+1): serviços e todas as combinações visíveis.
  const [servicesResult, pricingResult] = await Promise.all([
    supabase
      .from("services")
      .select("id, name, slug, description, price, price_note, image_url, featured")
      .eq("active", true)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true }),
    supabase
      .from("service_pricing")
      .select("service_id, size_id, price, duration_minutes, note, pet_sizes(name, sort_order)"),
  ]);

  if (servicesResult.error) throw new Error("Não foi possível carregar os serviços.");

  const rows = servicesResult.data ?? [];
  const pricingRows = pricingResult.error ? [] : (pricingResult.data ?? []);

  const pricesByService = new Map<string, PublicServicePrice[]>();
  for (const row of pricingRows) {
    const size = (row as { pet_sizes: { name: string; sort_order: number } | null }).pet_sizes;
    if (!size) continue;
    const list = pricesByService.get(row.service_id) ?? [];
    list.push({
      sizeId: row.size_id,
      sizeName: size.name,
      price: Number(row.price),
      durationMinutes: row.duration_minutes,
      note: row.note,
    });
    pricesByService.set(row.service_id, list);
  }
  for (const [, list] of pricesByService) {
    list.sort((a, b) => a.sizeName.localeCompare(b.sizeName, "pt-BR"));
  }

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
    prices: pricesByService.get(row.id) ?? [],
  }));
}
