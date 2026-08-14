import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type AdminSummary = {
  isAdmin: boolean;
  email: string | null;
  userId: string;
  lastSignInAt: string | null;
  counts: {
    products: number;
    activeProducts: number;
    featuredProducts: number;
    onSaleProducts: number;
    categories: number;
    brands: number;
  } | null;
};

/**
 * Verificação de papel feita no servidor, contra a tabela `user_roles`
 * (via função `has_role`). Nada é decidido no cliente.
 */
export const getAdminSummary = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminSummary> => {
    const { supabase, userId, claims } = context;

    const { data: isAdmin, error: roleError } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    if (roleError) throw new Error("Não foi possível verificar suas permissões.");

    const email = typeof claims["email"] === "string" ? (claims["email"] as string) : null;

    if (!isAdmin) {
      return { isAdmin: false, email, userId, lastSignInAt: null, counts: null };
    }

    const head = { count: "exact" as const, head: true };
    const [products, activeProducts, featuredProducts, onSaleProducts, categories, brands] =
      await Promise.all([
        supabase.from("products").select("id", head),
        supabase.from("products").select("id", head).eq("active", true),
        supabase.from("products").select("id", head).eq("featured", true),
        supabase.from("products").select("id", head).eq("on_sale", true),
        supabase.from("categories").select("id", head),
        supabase.from("brands").select("id", head),
      ]);

    for (const result of [
      products,
      activeProducts,
      featuredProducts,
      onSaleProducts,
      categories,
      brands,
    ]) {
      if (result.error) throw new Error("Não foi possível carregar os indicadores.");
    }

    const { data: userData } = await supabase.auth.getUser();

    return {
      isAdmin: true,
      email,
      userId,
      lastSignInAt: userData?.user?.last_sign_in_at ?? null,
      counts: {
        products: products.count ?? 0,
        activeProducts: activeProducts.count ?? 0,
        featuredProducts: featuredProducts.count ?? 0,
        onSaleProducts: onSaleProducts.count ?? 0,
        categories: categories.count ?? 0,
        brands: brands.count ?? 0,
      },
    };
  });