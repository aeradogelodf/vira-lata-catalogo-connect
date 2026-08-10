import { STORE } from "@/config/store";

/** Mensagens sempre contextualizadas — nunca genéricas quando há contexto. */
export function whatsappUrl(message: string): string {
  return `https://wa.me/${STORE.whatsapp.e164}?text=${encodeURIComponent(message)}`;
}

export const whatsappMessages = {
  general: () => `Olá! Vim pelo catálogo da ${STORE.name} e gostaria de mais informações.`,
  product: (productName: string) =>
    `Olá! Vi no catálogo da ${STORE.name} o produto ${productName} e gostaria de saber mais informações.`,
  service: (serviceName: string) =>
    `Olá! Vi no catálogo da ${STORE.name} o serviço ${serviceName} e gostaria de agendar/saber mais.`,
  favorites: (productNames: string[]) =>
    `Olá! Separei alguns produtos no catálogo da ${STORE.name}:\n\n${productNames
      .map((n) => `• ${n}`)
      .join("\n")}\n\nGostaria de mais informações.`,
};