import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  inventoryMovementInputSchema,
  type InventoryDashboardData,
  type InventoryMovement,
  type InventoryMovementType,
} from "@/lib/inventory";

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase.rpc("is_admin");
  if (error) throw new Error("Não foi possível validar suas permissões.");
  if (!data) throw new Error("Acesso restrito a administradores.");
}

function mapMovement(row: any): InventoryMovement {
  return {
    id: row.id,
    productId: row.product_id,
    productName: row.product_name,
    productInternalCode: row.product_internal_code,
    movementType: row.movement_type as InventoryMovementType,
    quantity: row.quantity,
    previousStock: row.previous_stock,
    currentStock: row.current_stock,
    reason: row.reason,
    performedByEmail: row.performed_by_email,
    createdAt: row.created_at,
  };
}

export const getInventoryDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<InventoryDashboardData> => {
    await assertAdmin(context);
    const [productsResult, movementsResult] = await Promise.all([
      context.supabase
        .from("products")
        .select("id, name, internal_code, stock, min_stock, price, active, updated_at")
        .order("name"),
      context.supabase
        .from("inventory_movements")
        .select("id, product_id, product_name, product_internal_code, movement_type, quantity, previous_stock, current_stock, reason, performed_by_email, created_at")
        .order("created_at", { ascending: false })
        .limit(500),
    ]);

    if (productsResult.error) throw new Error("Não foi possível carregar os saldos do estoque.");
    if (movementsResult.error) throw new Error("Não foi possível carregar as movimentações.");

    const products = (productsResult.data ?? []).map((row: any) => ({
      id: row.id,
      name: row.name,
      internalCode: row.internal_code,
      stock: row.stock,
      minStock: row.min_stock,
      price: row.price === null ? null : Number(row.price),
      active: row.active,
      updatedAt: row.updated_at,
    }));
    const movements = (movementsResult.data ?? []).map(mapMovement);

    return {
      summary: {
        products: products.length,
        activeProducts: products.filter((product) => product.active).length,
        lowStock: products.filter((product) => product.stock > 0 && product.stock <= product.minStock).length,
        outOfStock: products.filter((product) => product.stock === 0).length,
        estimatedValue: products.reduce((total, product) => total + product.stock * (product.price ?? 0), 0),
        lastMovementAt: movements[0]?.createdAt ?? null,
      },
      products,
      movements,
    };
  });

export const applyInventoryMovement = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => inventoryMovementInputSchema.parse(data))
  .handler(async ({ data, context }): Promise<InventoryMovement> => {
    await assertAdmin(context);

    const email = typeof context.claims["email"] === "string" ? context.claims["email"] : null;
    const claims = JSON.stringify({ sub: context.userId, email, role: "authenticated" });
    const databaseUrl = process.env["SUPABASE_DB_URL"];
    if (!databaseUrl) throw new Error("A operação segura de estoque está indisponível no momento.");

    const postgres = (await import("postgres")).default;
    const sql = postgres(databaseUrl, { max: 1, prepare: false });
    try {
      const movement = await sql.begin(async (transaction) => {
        await transaction`select set_config('request.jwt.claims', ${claims}, true)`;
        const rows = await transaction`
          select * from public.apply_inventory_movement(
            ${data.productId}::uuid,
            ${data.movementType}::text,
            ${data.quantity}::integer,
            ${data.reason ?? null}::text,
            ${data.expectedUpdatedAt}::timestamptz
          )
        `;
        return rows[0];
      });
      if (!movement) throw new Error("A movimentação não foi registrada.");
      return mapMovement(movement);
    } catch (error) {
      const detail = error instanceof Error ? error.message : "";
      if (detail.includes("Estoque insuficiente")) throw new Error("Estoque insuficiente. O saldo não pode ficar negativo.");
      if (detail.includes("alterado por outro administrador")) throw new Error("Este produto foi alterado por outro administrador. Recarregue antes de continuar.");
      if (detail.includes("motivo do ajuste")) throw new Error("Informe o motivo do ajuste.");
      if (detail.includes("Acesso restrito")) throw new Error("Acesso restrito a administradores.");
      throw new Error("Não foi possível registrar a movimentação.");
    } finally {
      await sql.end({ timeout: 2 });
    }
  });