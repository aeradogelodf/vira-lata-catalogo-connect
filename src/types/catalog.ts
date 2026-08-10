/**
 * Contratos do catálogo. Espelham as tabelas previstas no Lovable Cloud
 * (Etapa 08). Nenhum dado fictício é criado aqui — apenas os tipos.
 */

export interface Category {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  position: number;
  isActive: boolean;
}

export interface Brand {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  logoUrl: string | null;
  isActive: boolean;
}

export interface ProductImage {
  id: string;
  url: string;
  alt: string | null;
  position: number;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  price: number | null;
  promoPrice: number | null;
  categoryId: string | null;
  brandId: string | null;
  images: ProductImage[];
  isAvailable: boolean;
  isFeatured: boolean;
  position: number;
  seoTitle: string | null;
  seoDescription: string | null;
}

export interface Service {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  price: number | null;
  imageUrl: string | null;
  isAvailable: boolean;
}

export interface Banner {
  id: string;
  title: string;
  subtitle: string | null;
  imageUrl: string;
  link: string | null;
  position: number;
  isActive: boolean;
}

export interface CatalogFilters {
  search?: string;
  categorySlug?: string;
  brandSlug?: string;
  onlyPromotions?: boolean;
  sort?: "relevance" | "price-asc" | "price-desc" | "name-asc";
}