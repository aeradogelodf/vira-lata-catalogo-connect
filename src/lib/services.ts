import { z } from "zod";

import { slugify } from "@/lib/taxonomy";

export { slugify };

const optionalText = (max: number) =>
  z.string().trim().max(max, `Máximo de ${max} caracteres.`).optional().or(z.literal(""));

const optionalPrice = z
  .union([z.string(), z.number(), z.null()])
  .transform((value) => {
    if (value === null) return null;
    const raw = typeof value === "number" ? value : value.trim().replace(",", ".");
    if (raw === "") return null;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : Number.NaN;
  })
  .refine((value) => value === null || !Number.isNaN(value), "Informe um valor numérico válido.")
  .refine((value) => value === null || value >= 0, "O preço não pode ser negativo.")
  .refine((value) => value === null || value <= 999999, "Valor acima do limite permitido.");

export const serviceFormSchema = z.object({
  name: z.string().trim().min(2, "Informe um nome com ao menos 2 caracteres.").max(120),
  slug: z
    .string()
    .trim()
    .min(2, "O slug deve ter ao menos 2 caracteres.")
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use apenas letras minúsculas, números e hífens."),
  description: optionalText(2000),
  price: optionalPrice,
  priceNote: optionalText(120),
  imageUrl: optionalText(500),
  sortOrder: z.coerce
    .number({ message: "Informe um número inteiro para a ordem." })
    .int("Informe um número inteiro para a ordem.")
    .min(0, "A ordem não pode ser negativa.")
    .max(9999),
  featured: z.boolean(),
  active: z.boolean(),
});

export type ServiceFormValues = z.input<typeof serviceFormSchema>;
export type ServiceFormParsed = z.output<typeof serviceFormSchema>;

export type AdminService = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number | null;
  priceNote: string | null;
  imageUrl: string | null;
  sortOrder: number;
  featured: boolean;
  active: boolean;
  updatedAt: string;
};

/** Serviço exibido no catálogo público (imagem já resolvida para URL exibível). */
export type PublicService = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number | null;
  priceNote: string | null;
  imageUrl: string | null;
  featured: boolean;
};

export const SERVICE_IMAGE_PREFIX = "servicos";

export function buildServiceImagePath(slug: string, mimeType: string): string {
  const ext =
    ({ "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/avif": "avif" } as
      Record<string, string>)[mimeType] ?? "bin";
  const unique = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  return `${SERVICE_IMAGE_PREFIX}/${slug || "servico"}/${unique}.${ext}`;
}

export function emptyServiceForm(sortOrder: number): ServiceFormValues {
  return {
    name: "",
    slug: "",
    description: "",
    price: "",
    priceNote: "",
    imageUrl: "",
    sortOrder,
    featured: false,
    active: true,
  };
}

export function toServiceForm(service: AdminService): ServiceFormValues {
  return {
    name: service.name,
    slug: service.slug,
    description: service.description ?? "",
    price: service.price === null ? "" : String(service.price),
    priceNote: service.priceNote ?? "",
    imageUrl: service.imageUrl ?? "",
    sortOrder: service.sortOrder,
    featured: service.featured,
    active: service.active,
  };
}
