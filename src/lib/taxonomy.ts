import { z } from "zod";

/** Converte um nome em slug compatível com URL (sem acentos/símbolos). */
export function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

const slugSchema = z
  .string()
  .trim()
  .min(2, "O slug deve ter ao menos 2 caracteres.")
  .max(80, "O slug deve ter no máximo 80 caracteres.")
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use apenas letras minúsculas, números e hífens.");

const nameSchema = z
  .string()
  .trim()
  .min(2, "Informe um nome com ao menos 2 caracteres.")
  .max(80, "O nome deve ter no máximo 80 caracteres.");

const descriptionSchema = z
  .string()
  .trim()
  .max(500, "A descrição deve ter no máximo 500 caracteres.")
  .optional()
  .or(z.literal(""));

export const categoryFormSchema = z.object({
  name: nameSchema,
  slug: slugSchema,
  description: descriptionSchema,
  sortOrder: z.coerce.number().int().min(0, "Use um número inteiro positivo.").max(9999),
  active: z.boolean(),
});

export const brandFormSchema = z.object({
  name: nameSchema,
  slug: slugSchema,
  description: descriptionSchema,
  sortOrder: z.coerce.number().int().min(0, "Use um número inteiro positivo.").max(9999),
  active: z.boolean(),
});

export type CategoryFormValues = z.infer<typeof categoryFormSchema>;
export type BrandFormValues = z.infer<typeof brandFormSchema>;

export type TaxonomyRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sortOrder: number;
  active: boolean;
  updatedAt: string;
  productCount: number;
};

export type TaxonomyKind = "categories" | "brands";
