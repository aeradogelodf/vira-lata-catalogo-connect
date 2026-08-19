import { z } from "zod";

import { slugify } from "@/lib/taxonomy";

export { slugify };

export const PRODUCT_UNITS = ["kg", "unidade", "saco"] as const;
export type ProductUnit = (typeof PRODUCT_UNITS)[number];

export const PRODUCT_UNIT_LABEL: Record<ProductUnit, string> = {
  kg: "Quilo (kg)",
  unidade: "Unidade",
  saco: "Saco",
};

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

const intField = (label: string) =>
  z.coerce
    .number({ message: `Informe um número inteiro para ${label}.` })
    .int(`Informe um número inteiro para ${label}.`)
    .min(0, `${label} не pode ser negativo.`.replace("не", "não"))
    .max(1000000);

export const productFormSchema = z
  .object({
    name: z.string().trim().min(2, "Informe um nome com ao menos 2 caracteres.").max(120),
    slug: z
      .string()
      .trim()
      .min(2, "O slug deve ter ao menos 2 caracteres.")
      .max(120)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use apenas letras minúsculas, números e hífens."),
    description: optionalText(2000),
    categoryId: z.string().uuid().nullable(),
    brandId: z.string().uuid().nullable(),
    subcategory: optionalText(80),
    sku: optionalText(60),
    price: optionalPrice,
    oldPrice: optionalPrice,
    unit: z.enum(PRODUCT_UNITS),
    packageSize: optionalText(60),
    stock: intField("o estoque"),
    minStock: intField("o estoque mínimo"),
    active: z.boolean(),
    featured: z.boolean(),
    onSale: z.boolean(),
    sortOrder: intField("a ordem"),
    seoTitle: optionalText(120),
    seoDescription: optionalText(200),
  })
  .refine(
    (values) =>
      !values.onSale ||
      (values.price !== null && values.oldPrice !== null && values.oldPrice > values.price),
    {
      path: ["oldPrice"],
      message:
        "Para marcar promoção, informe o preço atual e um preço anterior maior que o atual.",
    },
  );

export type ProductFormValues = z.input<typeof productFormSchema>;
export type ProductFormParsed = z.output<typeof productFormSchema>;

export type AdminProductImage = {
  id: string;
  imageUrl: string;
  altText: string | null;
  sortOrder: number;
  isPrimary: boolean;
};

export type AdminProductRow = {
  id: string;
  name: string;
  slug: string;
  sku: string | null;
  internalCode: string;
  categoryId: string | null;
  brandId: string | null;
  categoryName: string | null;
  brandName: string | null;
  price: number | null;
  oldPrice: number | null;
  unit: ProductUnit;
  stock: number;
  minStock: number;
  active: boolean;
  featured: boolean;
  onSale: boolean;
  sortOrder: number;
  updatedAt: string;
  primaryImage: string | null;
};

export type AdminProductDetail = {
  values: ProductFormParsed;
  id: string;
  internalCode: string;
  updatedAt: string;
  images: AdminProductImage[];
};

export const EMPTY_PRODUCT: ProductFormValues = {
  name: "",
  slug: "",
  description: "",
  categoryId: null,
  brandId: null,
  subcategory: "",
  sku: "",
  price: "",
  oldPrice: "",
  unit: "unidade",
  packageSize: "",
  stock: 0,
  minStock: 0,
  active: true,
  featured: false,
  onSale: false,
  sortOrder: 0,
  seoTitle: "",
  seoDescription: "",
};

/** Formatos e limite aceitos no upload (validados também no servidor). */
export const IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"] as const;
export const IMAGE_MAX_BYTES = 5 * 1024 * 1024;

const EXTENSION: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

/** Caminho seguro e sem colisões dentro do bucket privado product-images. */
export function buildImagePath(productId: string, mimeType: string): string {
  const ext = EXTENSION[mimeType] ?? "bin";
  const unique = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  return `${productId}/${unique}.${ext}`;
}
