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

    const count = async (
      table: "products" | "categories" | "brands",
      filter?: (q: ReturnType<typeof supabase.from>) => unknown,
    ) => {
      let query = supabase.from(table).select("id", { count: "exact", head: true });
      if (filter) query = filter(query as never) as typeof query;
      const { count: total, error } = await query;
      if (error) throw new Error("Não foi possível carregar os indicadores.");
      return total ?? 0;
    };

    const [products, activeProducts, featuredProducts, onSaleProducts, categories, brands] =
      await Promise.all([
        count("products"),
        count("products", (q) => (q as never as { eq: Function }).eq("active", true)),
        count("products", (q) => (q as never as { eq: Function }).eq("featured", true)),
        count("products", (q) => (q as never as { eq: Function }).eq("on_sale", true)),
        count("categories"),
        count("brands"),
      ]);

    const { data: userData } = await supabase.auth.getUser();

    return {
      isAdmin: true,
      email,
      userId,
      lastSignInAt: userData?.user?.last_sign_in_at ?? null,
      counts: { products, activeProducts, featuredProducts, onSaleProducts, categories, brands },
    };
  });