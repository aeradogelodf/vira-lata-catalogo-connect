/**
 * CAMADA DE DADOS DO CATÁLOGO (fonte única).
 *
 * Etapa 01: não existe banco. Nenhum dado fictício é criado — as funções
 * devolvem coleções vazias e a interface trabalha com estados vazios.
 *
 * Etapa 08: basta trocar o corpo destas funções por consultas ao Lovable Cloud
 * (tabelas products, categories, brands, product_images) — nenhum componente
 * precisa ser reescrito, pois todos consomem apenas estes contratos.
 */
import type { Brand, Category, Product } from "@/types/catalog";

const products: Product[] = [];
const categories: Category[] = [];
const brands: Brand[] = [];

export async function fetchProducts(): Promise<Product[]> {
  return products;
}

export async function fetchCategories(): Promise<Category[]> {
  return categories.filter((c) => c.isActive).sort((a, b) => a.position - b.position);
}

export async function fetchBrands(): Promise<Brand[]> {
  return brands.filter((b) => b.isActive);
}

export async function fetchProductBySlug(slug: string): Promise<Product | null> {
  return products.find((p) => p.slug === slug) ?? null;
}