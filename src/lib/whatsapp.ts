import type { StoreInfo } from "@/lib/store-settings";

/**
 * Fonte única das mensagens de WhatsApp.
 * O número e o nome vêm explicitamente de `store_settings`, evitando estado
 * global compartilhado entre renderizações do servidor.
 */
/** Mensagens sempre contextualizadas — nunca genéricas quando há contexto. */
export function whatsappUrl(message: string, store: StoreInfo): string {
  const number = store.whatsapp.e164.replace(/\D/g, "");
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

export const whatsappMessages = {
  general: (store: StoreInfo) =>
    `Olá! Vim pelo catálogo da ${store.name} e gostaria de mais informações.`,
  product: (productName: string, store: StoreInfo) =>
    `Olá! Vi no catálogo da ${store.name} o produto ${productName} e gostaria de saber mais informações.`,
  service: (serviceName: string, store: StoreInfo) =>
    `Olá! Vi no catálogo da ${store.name} o serviço ${serviceName} e gostaria de agendar/saber mais.`,
  favorites: (productNames: string[], store: StoreInfo) =>
    `Olá! Separei alguns produtos no catálogo da ${store.name}:\n\n${productNames
      .map((n) => `• ${n}`)
      .join("\n")}\n\nGostaria de mais informações.`,
};
