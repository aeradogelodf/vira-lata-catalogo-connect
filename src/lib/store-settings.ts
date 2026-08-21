/**
 * CONFIGURAÇÕES DA LOJA — contratos, validação e utilidades.
 *
 * A partir da Etapa 06 a tabela `store_settings` é a fonte única de verdade
 * das informações institucionais. `src/config/store.ts` permanece apenas como
 * fallback técnico (usado enquanto a consulta não resolve).
 */
import { z } from "zod";

import { STORE } from "@/config/store";

export const WEEK_DAYS = [
  { day: "seg", label: "Segunda" },
  { day: "ter", label: "Terça" },
  { day: "qua", label: "Quarta" },
  { day: "qui", label: "Quinta" },
  { day: "sex", label: "Sexta" },
  { day: "sab", label: "Sábado" },
  { day: "dom", label: "Domingo" },
] as const;

export type WeekDay = (typeof WEEK_DAYS)[number]["day"];

export type OpeningHour = {
  day: WeekDay;
  label: string;
  opensAt: string | null;
  closesAt: string | null;
};

export type StoreInfo = {
  name: string;
  tradeName: string | null;
  segment: string | null;
  shortDescription: string | null;
  longDescription: string | null;
  whatsapp: { e164: string; display: string | null };
  phone: string | null;
  email: string | null;
  address: {
    street: string | null;
    number: string | null;
    complement: string | null;
    district: string | null;
    city: string | null;
    state: string | null;
    postalCode: string | null;
    country: string;
  };
  openingHours: OpeningHour[];
  socials: {
    instagram: string | null;
    facebook: string | null;
    tiktok: string | null;
    website: string | null;
    other: string | null;
  };
  catalog: { hideOutOfStock: boolean };
  updatedAt: string | null;
};

/** Fallback técnico: usado apenas antes de a consulta ao banco resolver. */
export const FALLBACK_STORE: StoreInfo = {
  name: STORE.name,
  tradeName: STORE.name,
  segment: STORE.segment,
  shortDescription: STORE.shortDescription,
  longDescription: null,
  whatsapp: { e164: STORE.whatsapp.e164, display: STORE.whatsapp.display },
  phone: null,
  email: STORE.email,
  address: {
    street: STORE.address.street,
    number: null,
    complement: null,
    district: STORE.address.district,
    city: STORE.address.city,
    state: STORE.address.state,
    postalCode: STORE.address.postalCode,
    country: STORE.address.country,
  },
  openingHours: STORE.openingHours.map((hour) => ({
    day: hour.day as WeekDay,
    label: hour.label,
    opensAt: hour.opensAt,
    closesAt: hour.closesAt,
  })),
  socials: {
    instagram: STORE.socials.instagram,
    facebook: STORE.socials.facebook,
    tiktok: null,
    website: null,
    other: null,
  },
  catalog: { hideOutOfStock: false },
  updatedAt: null,
};

/** Endereço formatado para exibição pública (ignora campos vazios). */
export function formatAddress(store: StoreInfo): string {
  const { street, number, complement, district, city, state, postalCode } = store.address;
  const line1 = [street, number].filter(Boolean).join(", ");
  const parts = [line1 || null, complement, district, [city, state].filter(Boolean).join(" — ") || null]
    .filter((part): part is string => Boolean(part && part.trim()))
    .join(", ");
  return postalCode ? `${parts}${parts ? ", " : ""}CEP ${postalCode}` : parts;
}

export function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

// ---------------------------------------------------------------------------
// Validação (compartilhada entre formulário e servidor)
// ---------------------------------------------------------------------------

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Use no máximo ${max} caracteres.`)
    .optional()
    .transform((value) => (value ? value : ""));

const optionalUrl = z
  .string()
  .trim()
  .max(200)
  .optional()
  .transform((value) => value ?? "")
  .refine((value) => value === "" || /^https?:\/\/[^\s]+\.[^\s]+$/.test(value), {
    message: "Informe uma URL completa iniciando com http:// ou https://.",
  });

const timeSchema = z
  .string()
  .trim()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use o formato HH:MM.");

export const openingHourSchema = z
  .object({
    day: z.enum(["seg", "ter", "qua", "qui", "sex", "sab", "dom"]),
    label: z.string().trim().min(3).max(20),
    closed: z.boolean(),
    opensAt: z.string().trim().optional().transform((v) => v ?? ""),
    closesAt: z.string().trim().optional().transform((v) => v ?? ""),
  })
  .superRefine((value, ctx) => {
    if (value.closed) return;
    for (const field of ["opensAt", "closesAt"] as const) {
      const parsed = timeSchema.safeParse(value[field]);
      if (!parsed.success) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [field],
          message: "Informe o horário no formato HH:MM.",
        });
      }
    }
    if (value.opensAt && value.closesAt && value.opensAt >= value.closesAt) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["closesAt"],
        message: "O fechamento deve ser depois da abertura.",
      });
    }
  });

export const storeSettingsSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome da loja.").max(80),
  tradeName: optionalText(80),
  segment: optionalText(120),
  shortDescription: optionalText(200),
  longDescription: optionalText(1200),
  whatsapp: z
    .string()
    .trim()
    .min(1, "Informe o WhatsApp.")
    .refine((v) => {
      const d = digitsOnly(v);
      return d.length >= 10 && d.length <= 15;
    }, "Informe um número de WhatsApp válido com DDD."),
  whatsappDisplay: optionalText(30),
  phone: optionalText(30).refine((v) => v === "" || digitsOnly(v).length >= 8, {
    message: "Informe um telefone válido.",
  }),
  email: optionalText(120).refine((v) => v === "" || z.string().email().safeParse(v).success, {
    message: "Informe um e-mail válido.",
  }),
  street: optionalText(160),
  number: optionalText(20),
  complement: optionalText(80),
  district: optionalText(80),
  city: optionalText(80),
  state: optionalText(2).refine((v) => v === "" || /^[A-Za-z]{2}$/.test(v), {
    message: "Use a sigla do estado (2 letras).",
  }),
  postalCode: optionalText(10).refine((v) => v === "" || /^\d{5}-?\d{3}$/.test(v), {
    message: "Use o formato 00000-000.",
  }),
  country: z.string().trim().min(2).max(2).default("BR"),
  openingHours: z.array(openingHourSchema).length(7, "Informe os sete dias da semana."),
  instagramUrl: optionalUrl,
  facebookUrl: optionalUrl,
  tiktokUrl: optionalUrl,
  websiteUrl: optionalUrl,
  otherSocialUrl: optionalUrl,
  hideOutOfStock: z.boolean(),
});

export type StoreSettingsFormValues = z.input<typeof storeSettingsSchema>;
export type StoreSettingsParsed = z.output<typeof storeSettingsSchema>;

/** Converte o registro público (StoreInfo) nos valores do formulário. */
export function toFormValues(store: StoreInfo): StoreSettingsParsed {
  const byDay = new Map(store.openingHours.map((hour) => [hour.day, hour]));
  return {
    name: store.name,
    tradeName: store.tradeName ?? "",
    segment: store.segment ?? "",
    shortDescription: store.shortDescription ?? "",
    longDescription: store.longDescription ?? "",
    whatsapp: store.whatsapp.e164,
    whatsappDisplay: store.whatsapp.display ?? "",
    phone: store.phone ?? "",
    email: store.email ?? "",
    street: store.address.street ?? "",
    number: store.address.number ?? "",
    complement: store.address.complement ?? "",
    district: store.address.district ?? "",
    city: store.address.city ?? "",
    state: store.address.state ?? "",
    postalCode: store.address.postalCode ?? "",
    country: store.address.country || "BR",
    openingHours: WEEK_DAYS.map(({ day, label }) => {
      const hour = byDay.get(day);
      const closed = !hour?.opensAt || !hour?.closesAt;
      return {
        day,
        label,
        closed,
        opensAt: hour?.opensAt ?? "",
        closesAt: hour?.closesAt ?? "",
      };
    }),
    instagramUrl: store.socials.instagram ?? "",
    facebookUrl: store.socials.facebook ?? "",
    tiktokUrl: store.socials.tiktok ?? "",
    websiteUrl: store.socials.website ?? "",
    otherSocialUrl: store.socials.other ?? "",
    hideOutOfStock: store.catalog.hideOutOfStock,
  };
}
