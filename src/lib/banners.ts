/**
 * Contratos e validações dos banners da vitrine (Home).
 * Fonte única: tabela `banners`. Nenhum conteúdo estático.
 */
import { z } from "zod";

import { slugify } from "@/lib/taxonomy";
import { whatsappMessages, whatsappUrl } from "@/lib/whatsapp";
import type { StoreInfo } from "@/lib/store-settings";

export const BANNER_LINK_TYPES = [
  "none",
  "catalog",
  "product",
  "service",
  "whatsapp",
  "external",
] as const;

export type BannerLinkType = (typeof BANNER_LINK_TYPES)[number];

export const BANNER_LINK_LABELS: Record<BannerLinkType, string> = {
  none: "Sem botão",
  catalog: "Catálogo",
  product: "Produto (slug)",
  service: "Serviços",
  whatsapp: "WhatsApp",
  external: "Link externo",
};

const optionalText = (max: number) =>
  z.string().trim().max(max, `Máximo de ${max} caracteres.`).optional().or(z.literal(""));

export const bannerFormSchema = z
  .object({
    title: z.string().trim().min(2, "Informe um título com ao menos 2 caracteres.").max(120),
    subtitle: optionalText(200),
    imageUrl: optionalText(500),
    altText: optionalText(160),
    ctaLabel: optionalText(40),
    linkType: z.enum(BANNER_LINK_TYPES),
    linkValue: optionalText(500),
    sortOrder: z.coerce
      .number({ message: "Informe um número inteiro para a ordem." })
      .int("Informe um número inteiro para a ordem.")
      .min(0, "A ordem não pode ser negativa.")
      .max(9999),
    active: z.boolean(),
  })
  .superRefine((values, ctx) => {
    const value = (values.linkValue ?? "").trim();
    if (values.linkType === "product") {
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)) {
        ctx.addIssue({
          code: "custom",
          path: ["linkValue"],
          message: "Informe o slug do produto (ex.: racao-premium-15kg).",
        });
      }
    }
    if (values.linkType === "external") {
      let ok = false;
      try {
        const url = new URL(value);
        ok = url.protocol === "https:" || url.protocol === "http:";
      } catch {
        ok = false;
      }
      if (!ok) {
        ctx.addIssue({
          code: "custom",
          path: ["linkValue"],
          message: "Informe uma URL válida começando com https://",
        });
      }
    }
    if (values.linkType !== "none" && !(values.ctaLabel ?? "").trim()) {
      ctx.addIssue({
        code: "custom",
        path: ["ctaLabel"],
        message: "Informe o texto do botão.",
      });
    }
  });

export type BannerFormValues = z.input<typeof bannerFormSchema>;

export type AdminBanner = {
  id: string;
  title: string;
  subtitle: string | null;
  imageUrl: string | null;
  altText: string | null;
  ctaLabel: string | null;
  linkType: BannerLinkType;
  linkValue: string | null;
  sortOrder: number;
  active: boolean;
  updatedAt: string;
};

/** Banner exibido na Home (imagem já resolvida para URL exibível). */
export type PublicBanner = {
  id: string;
  title: string;
  subtitle: string | null;
  imageUrl: string | null;
  altText: string | null;
  ctaLabel: string | null;
  linkType: BannerLinkType;
  linkValue: string | null;
};

export const BANNER_IMAGE_PREFIX = "banners";

export function buildBannerImagePath(title: string, mimeType: string): string {
  const ext =
    (
      {
        "image/jpeg": "jpg",
        "image/png": "png",
        "image/webp": "webp",
        "image/avif": "avif",
      } as Record<string, string>
    )[mimeType] ?? "bin";
  const unique = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  return `${BANNER_IMAGE_PREFIX}/${slugify(title) || "banner"}/${unique}.${ext}`;
}

export function emptyBannerForm(sortOrder: number): BannerFormValues {
  return {
    title: "",
    subtitle: "",
    imageUrl: "",
    altText: "",
    ctaLabel: "",
    linkType: "catalog",
    linkValue: "",
    sortOrder,
    active: true,
  };
}

export function toBannerForm(banner: AdminBanner): BannerFormValues {
  return {
    title: banner.title,
    subtitle: banner.subtitle ?? "",
    imageUrl: banner.imageUrl ?? "",
    altText: banner.altText ?? "",
    ctaLabel: banner.ctaLabel ?? "",
    linkType: banner.linkType,
    linkValue: banner.linkValue ?? "",
    sortOrder: banner.sortOrder,
    active: banner.active,
  };
}

export type BannerTarget = { href: string; external: boolean } | null;

/** Converte o destino do banner em um href real — sem duplicar número de WhatsApp. */
export function bannerTarget(banner: PublicBanner, store: StoreInfo): BannerTarget {
  switch (banner.linkType) {
    case "catalog":
      return { href: "/catalogo", external: false };
    case "service":
      return { href: "/servicos", external: false };
    case "product":
      return banner.linkValue
        ? { href: `/produto/${banner.linkValue}`, external: false }
        : null;
    case "whatsapp":
      return {
        href: whatsappUrl(
          banner.linkValue?.trim()
            ? `${whatsappMessages.general(store)} (${banner.linkValue.trim()})`
            : whatsappMessages.general(store),
          store,
        ),
        external: true,
      };
    case "external":
      return banner.linkValue ? { href: banner.linkValue, external: true } : null;
    default:
      return null;
  }
}
