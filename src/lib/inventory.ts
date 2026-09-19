import { z } from "zod";

export const inventoryMovementTypeSchema = z.enum([
  "entry",
  "exit",
  "adjustment",
  "inventory",
]);

export type InventoryMovementType = z.infer<typeof inventoryMovementTypeSchema>;

export const inventoryMovementInputSchema = z.object({
  productId: z.string().uuid(),
  movementType: inventoryMovementTypeSchema,
  quantity: z.number().int().min(0).max(1_000_000),
  reason: z.string().trim().max(300).optional(),
  expectedUpdatedAt: z.string().datetime({ offset: true }),
}).superRefine((value, context) => {
  if ((value.movementType === "entry" || value.movementType === "exit") && value.quantity < 1) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["quantity"], message: "Informe uma quantidade maior que zero." });
  }
  if (value.movementType === "adjustment" && !value.reason) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["reason"], message: "Informe o motivo do ajuste." });
  }
});

export type InventoryProduct = {
  id: string;
  name: string;
  internalCode: string;
  stock: number;
  minStock: number;
  price: number | null;
  active: boolean;
  updatedAt: string;
};

export type InventoryMovement = {
  id: string;
  productId: string | null;
  productName: string;
  productInternalCode: string;
  movementType: InventoryMovementType;
  quantity: number;
  previousStock: number;
  currentStock: number;
  reason: string | null;
  performedByEmail: string | null;
  createdAt: string;
};

export type InventoryDashboardData = {
  summary: {
    products: number;
    activeProducts: number;
    lowStock: number;
    outOfStock: number;
    estimatedValue: number;
    lastMovementAt: string | null;
  };
  products: InventoryProduct[];
  movements: InventoryMovement[];
};

export const movementLabels: Record<InventoryMovementType, string> = {
  entry: "Entrada",
  exit: "Saída",
  adjustment: "Ajuste",
  inventory: "Inventário",
};