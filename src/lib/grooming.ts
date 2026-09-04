/**
 * Banho & Tosa — portes (pet_sizes) e a combinação serviço + porte
 * (service_pricing) com preço e duração. Schemas Zod compartilhados
 * entre o formulário administrativo e as server functions.
 */
import { z } from "zod";

import { slugify } from "@/lib/taxonomy";

export { slugify };

const optionalText = (max: number) =>
  z.string().trim().max(max, `Máximo de ${max} caracteres.`).optional().or(z.literal(""));

const requiredPrice = z
  .union([z.string(), z.number()])
  .transform((value) => {
    const raw = typeof value === "number" ? value : value.trim().replace(/\./g, "").replace(",", ".");
    if (raw === "") return Number.NaN;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? Math.round(parsed * 100) / 100 : Number.NaN;
  })
  .refine((value) => !Number.isNaN(value), "Informe um preço válido.")
  .refine((value) => value >= 0, "O preço não pode ser negativo.")
  .refine((value) => value <= 999999, "Valor acima do limite permitido.");

export const petSizeFormSchema = z.object({
  name: z.string().trim().min(2, "Informe um nome com ao menos 2 caracteres.").max(60),
  slug: z
    .string()
    .trim()
    .min(2, "O identificador deve ter ao menos 2 caracteres.")
    .max(60)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use apenas letras minúsculas, números e hífens."),
  description: optionalText(300),
  sortOrder: z.coerce
    .number({ message: "Informe um número inteiro para a ordem." })
    .int("Informe um número inteiro para a ordem.")
    .min(0, "A ordem não pode ser negativa.")
    .max(9999),
  active: z.boolean(),
});

export type PetSizeFormValues = z.input<typeof petSizeFormSchema>;

export const servicePricingFormSchema = z.object({
  serviceId: z.string().uuid("Selecione um serviço."),
  sizeId: z.string().uuid("Selecione um porte."),
  price: requiredPrice,
  durationMinutes: z.coerce
    .number({ message: "Informe a duração em minutos." })
    .int("Informe a duração em minutos inteiros.")
    .min(1, "A duração deve ser de pelo menos 1 minuto.")
    .max(1440, "A duração não pode passar de 1440 minutos (24 h)."),
  note: optionalText(160),
  active: z.boolean(),
});

export type ServicePricingFormValues = z.input<typeof servicePricingFormSchema>;

export type PetSize = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sortOrder: number;
  active: boolean;
  updatedAt: string;
};

export type ServicePricing = {
  id: string;
  serviceId: string;
  sizeId: string;
  price: number;
  durationMinutes: number;
  note: string | null;
  active: boolean;
  updatedAt: string;
};

/** Preço por porte já resolvido para exibição pública. */
export type PublicServicePrice = {
  sizeId: string;
  sizeName: string;
  price: number;
  durationMinutes: number;
  note: string | null;
};

export function emptyPetSizeForm(sortOrder: number): PetSizeFormValues {
  return { name: "", slug: "", description: "", sortOrder, active: true };
}

export function toPetSizeForm(size: PetSize): PetSizeFormValues {
  return {
    name: size.name,
    slug: size.slug,
    description: size.description ?? "",
    sortOrder: size.sortOrder,
    active: size.active,
  };
}

export function emptyPricingForm(serviceId: string, sizeId: string): ServicePricingFormValues {
  return { serviceId, sizeId, price: "", durationMinutes: 60, note: "", active: true };
}

export function toPricingForm(row: ServicePricing): ServicePricingFormValues {
  return {
    serviceId: row.serviceId,
    sizeId: row.sizeId,
    price: String(row.price).replace(".", ","),
    durationMinutes: row.durationMinutes,
    note: row.note ?? "",
    active: row.active,
  };
}

/** "90" -> "1 h 30 min" — usado apenas para exibição. */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
}
