import { queryOptions } from "@tanstack/react-query";

import {
  fetchBrands,
  fetchCategories,
  fetchProductBySlug,
  fetchProducts,
} from "@/data/catalog";

export const catalogQueries = {
  products: () => queryOptions({ queryKey: ["catalog", "products"], queryFn: fetchProducts }),
  categories: () =>
    queryOptions({ queryKey: ["catalog", "categories"], queryFn: fetchCategories }),
  brands: () => queryOptions({ queryKey: ["catalog", "brands"], queryFn: fetchBrands }),
  product: (slug: string) =>
    queryOptions({
      queryKey: ["catalog", "product", slug],
      queryFn: () => fetchProductBySlug(slug),
    }),
};