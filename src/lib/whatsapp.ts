import { FALLBACK_STORE, type StoreInfo } from "@/lib/store-settings";

/**
 * Fonte única das mensagens de WhatsApp.
 * O número e o nome vêm de `store_settings` (banco); o fallback técnico só é
 * usado enquanto a consulta pública não resolve.
 */
let activeStore: StoreInfo = FALLBACK_STORE;

export function setActiveStore(store: StoreInfo): void {
  activeStore = store;
}

export function getActiveStore(): StoreInfo {
  return activeStore;
}

/** Mensagens sempre contextualizadas — nunca genéricas quando há contexto. */
export function whatsappUrl(message: string, store: StoreInfo = activeStore): string {
  const number = store.whatsapp.e164.replace(/\D/g, "");
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

const storeName = (store?: StoreInfo) => (store ?? activeStore).name;

export const whatsappMessages = {
  general: (store?: StoreInfo) =>
    `Olá! Vim pelo catálogo da ${storeName(store)} e gostaria de mais informações.`,
  product: (productName: string, store?: StoreInfo) =>
    `Olá! Vi no catálogo da ${storeName(store)} o produto ${productName} e gostaria de saber mais informações.`,
  service: (serviceName: string, store?: StoreInfo) =>
    `Olá! Vi no catálogo da ${storeName(store)} o serviço ${serviceName} e gostaria de agendar/saber mais.`,
  favorites: (productNames: string[], store?: StoreInfo) =>
    `Olá! Separei alguns produtos no catálogo da ${storeName(store)}:\n\n${productNames
      .map((n) => `• ${n}`)
      .join("\n")}\n\nGostaria de mais informações.`,
};
