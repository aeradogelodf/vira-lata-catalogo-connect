import { queryOptions } from "@tanstack/react-query";

import {
  fetchBrands,
  fetchCategories,
  fetchProductBySlug,
  fetchProducts,
} from "@/data/catalog";

/**
 * Cache: produtos mudam com mais frequência que taxonomia. As URLs assinadas
 * do Storage duram 1h, então nenhum staleTime passa de ~10 minutos para evitar
 * exibir links expirados.
 */
const PRODUCT_STALE = 60_000; // 1 min
const TAXONOMY_STALE = 5 * 60_000; // 5 min

export const catalogQueries = {
  products: () =>
    queryOptions({
      queryKey: ["catalog", "products"],
      queryFn: fetchProducts,
      staleTime: PRODUCT_STALE,
    }),
  categories: () =>
    queryOptions({
      queryKey: ["catalog", "categories"],
      queryFn: fetchCategories,
      staleTime: TAXONOMY_STALE,
    }),
  brands: () =>
    queryOptions({
      queryKey: ["catalog", "brands"],
      queryFn: fetchBrands,
      staleTime: TAXONOMY_STALE,
    }),
  product: (slug: string) =>
    queryOptions({
      queryKey: ["catalog", "product", slug],
      queryFn: () => fetchProductBySlug(slug),
      staleTime: PRODUCT_STALE,
    }),
};
