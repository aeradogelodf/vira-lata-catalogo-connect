/**
 * Regras puras de busca, filtro e ordenação do catálogo.
 * Ficam separadas da UI para que, no futuro, possam ser executadas no banco
 * (Etapa 08) sem alterar componentes.
 */
import type { Brand, Category, Product } from "@/types/catalog";

export type SortOption =
  | "relevance"
  | "name-asc"
  | "name-desc"
  | "price-asc"
  | "price-desc"
  | "promo";

export interface CatalogState {
  search: string;
  categorySlug: string | null;
  brandSlug: string | null;
  onlyAvailable: boolean;
  onlyPromotions: boolean;
  sort: SortOption;
}

export const initialCatalogState: CatalogState = {
  search: "",
  categorySlug: null,
  brandSlug: null,
  onlyAvailable: false,
  onlyPromotions: false,
  sort: "relevance",
};

export function hasActiveFilters(state: CatalogState): boolean {
  return (
    state.search.trim() !== "" ||
    state.categorySlug !== null ||
    state.brandSlug !== null ||
    state.onlyAvailable ||
    state.onlyPromotions ||
    state.sort !== "relevance"
  );
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function effectivePrice(product: Product): number | null {
  return product.promoPrice ?? product.price;
}

export function isPromotion(product: Product): boolean {
  return (
    product.promoPrice !== null &&
    product.price !== null &&
    product.promoPrice < product.price
  );
}

export interface CatalogIndexes {
  categoriesById: Map<string, Category>;
  brandsById: Map<string, Brand>;
}

export function buildIndexes(categories: Category[], brands: Brand[]): CatalogIndexes {
  return {
    categoriesById: new Map(categories.map((c) => [c.id, c])),
    brandsById: new Map(brands.map((b) => [b.id, b])),
  };
}

/** Pontuação de relevância: nome > marca > categoria > descrição. */
function score(product: Product, term: string, indexes: CatalogIndexes): number {
  const brand = product.brandId ? indexes.brandsById.get(product.brandId) : undefined;
  const category = product.categoryId
    ? indexes.categoriesById.get(product.categoryId)
    : undefined;

  if (normalize(product.name).includes(term)) return 4;
  if (brand && normalize(brand.name).includes(term)) return 3;
  if (category && normalize(category.name).includes(term)) return 2;
  if (product.description && normalize(product.description).includes(term)) return 1;
  return 0;
}

export function applyCatalog(
  products: Product[],
  state: CatalogState,
  indexes: CatalogIndexes,
): Product[] {
  const term = normalize(state.search.trim());
  let result = products;

  if (term) {
    result = result.filter((p) => score(p, term, indexes) > 0);
  }
  if (state.categorySlug) {
    result = result.filter((p) => {
      const category = p.categoryId ? indexes.categoriesById.get(p.categoryId) : undefined;
      return category?.slug === state.categorySlug;
    });
  }
  if (state.brandSlug) {
    result = result.filter((p) => {
      const brand = p.brandId ? indexes.brandsById.get(p.brandId) : undefined;
      return brand?.slug === state.brandSlug;
    });
  }
  if (state.onlyAvailable) {
    result = result.filter((p) => p.isAvailable);
  }
  if (state.onlyPromotions) {
    result = result.filter(isPromotion);
  }

  const sorted = [...result];
  switch (state.sort) {
    case "name-asc":
      sorted.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
      break;
    case "name-desc":
      sorted.sort((a, b) => b.name.localeCompare(a.name, "pt-BR"));
      break;
    case "price-asc":
    case "price-desc": {
      const dir = state.sort === "price-asc" ? 1 : -1;
      sorted.sort((a, b) => {
        const pa = effectivePrice(a);
        const pb = effectivePrice(b);
        // Produtos sem preço cadastrado ficam sempre no fim.
        if (pa === null && pb === null) return 0;
        if (pa === null) return 1;
        if (pb === null) return -1;
        return (pa - pb) * dir;
      });
      break;
    }
    case "promo":
      sorted.sort((a, b) => Number(isPromotion(b)) - Number(isPromotion(a)));
      break;
    case "relevance":
    default:
      if (term) {
        sorted.sort((a, b) => score(b, term, indexes) - score(a, term, indexes));
      } else {
        sorted.sort((a, b) => a.position - b.position);
      }
      break;
  }

  return sorted;
}

/**
 * Relacionados: mesma categoria, depois mesma marca. Nunca o próprio produto.
 */
export function relatedProducts(
  product: Product,
  all: Product[],
  limit = 4,
): Product[] {
  const others = all.filter((p) => p.id !== product.id);
  const sameCategory = product.categoryId
    ? others.filter((p) => p.categoryId === product.categoryId)
    : [];
  const sameBrand = product.brandId
    ? others.filter((p) => p.brandId === product.brandId && !sameCategory.includes(p))
    : [];
  return [...sameCategory, ...sameBrand].slice(0, limit);
}

export function formatPrice(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}