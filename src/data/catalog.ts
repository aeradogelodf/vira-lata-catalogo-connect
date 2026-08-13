/**
 * CAMADA DE DADOS DO CATÁLOGO (fonte única).
 *
 * Consome exclusivamente o backend (Lovable Cloud). Nenhum dado fictício e
 * nenhuma lista estática de fallback: com o banco vazio as funções devolvem
 * coleções vazias e a interface exibe os estados vazios já implementados.
 *
 * Apenas registros ativos são lidos — a leitura pública também é limitada por
 * RLS no banco, não somente por estes filtros.
 */
import { supabase } from "@/integrations/supabase/client";
import type { Brand, Category, Product, ProductImage } from "@/types/catalog";

/** Campos mínimos necessários ao catálogo público (nada administrativo). */
const PRODUCT_FIELDS =
  "id, slug, name, description, price, old_price, on_sale, category_id, brand_id, image_url, stock, featured, sort_order, seo_title, seo_description, product_images (id, image_url, alt_text, sort_order, is_primary)";

type ProductRow = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  price: number | string | null;
  old_price: number | string | null;
  on_sale: boolean;
  category_id: string | null;
  brand_id: string | null;
  image_url: string | null;
  stock: number;
  featured: boolean;
  sort_order: number;
  seo_title: string | null;
  seo_description: string | null;
  product_images: {
    id: string;
    image_url: string;
    alt_text: string | null;
    sort_order: number;
    is_primary: boolean;
  }[] | null;
};

function toNumber(value: number | string | null): number | null {
  if (value === null) return null;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function mapImages(row: ProductRow): ProductImage[] {
  const images = (row.product_images ?? [])
    .slice()
    .sort((a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order)
    .map<ProductImage>((image) => ({
      id: image.id,
      url: image.image_url,
      alt: image.alt_text,
      position: image.sort_order,
    }));

  if (images.length === 0 && row.image_url) {
    return [{ id: `${row.id}-main`, url: row.image_url, alt: row.name, position: 0 }];
  }
  return images;
}

function mapProduct(row: ProductRow): Product {
  const price = toNumber(row.price);
  const oldPrice = toNumber(row.old_price);
  // Promoção: o preço "de" é o antigo e o preço "por" é o atual.
  const promo = row.on_sale && price !== null && oldPrice !== null && oldPrice > price;

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    price: promo ? oldPrice : price,
    promoPrice: promo ? price : null,
    categoryId: row.category_id,
    brandId: row.brand_id,
    images: mapImages(row),
    // Produto sem estoque permanece visível, porém marcado como indisponível.
    isAvailable: row.stock > 0,
    isFeatured: row.featured,
    position: row.sort_order,
    seoTitle: row.seo_title,
    seoDescription: row.seo_description,
  };
}

export async function fetchProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_FIELDS)
    .eq("active", true)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) throw error;
  return (data as unknown as ProductRow[] | null)?.map(mapProduct) ?? [];
}

export async function fetchCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("id, slug, name, description, image_url, sort_order, active")
    .eq("active", true)
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    imageUrl: row.image_url,
    position: row.sort_order,
    isActive: row.active,
  }));
}

export async function fetchBrands(): Promise<Brand[]> {
  const { data, error } = await supabase
    .from("brands")
    .select("id, slug, name, description, logo_url, active")
    .eq("active", true)
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    logoUrl: row.logo_url,
    isActive: row.active,
  }));
}

export async function fetchProductBySlug(slug: string): Promise<Product | null> {
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_FIELDS)
    .eq("active", true)
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw error;
  return data ? mapProduct(data as unknown as ProductRow) : null;
}