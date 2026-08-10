/**
 * FONTE ÚNICA DE VERDADE (temporária) das informações institucionais.
 *
 * Etapa 00: os dados vivem aqui porque o banco/painel ainda não existem.
 * Etapa 07/08: esta camada passa a ler `store_settings` do Lovable Cloud —
 * nenhum componente deve duplicar estes valores, todos importam daqui.
 *
 * Regra: nada de informação inventada. Campos desconhecidos ficam `null`.
 */

export type WeekDay = "seg" | "ter" | "qua" | "qui" | "sex" | "sab" | "dom";

export interface OpeningHour {
  day: WeekDay;
  label: string;
  opensAt: string | null;
  closesAt: string | null;
}

export interface StoreSettings {
  name: string;
  slug: string;
  segment: string;
  shortDescription: string;
  whatsapp: { display: string; e164: string };
  address: {
    street: string;
    district: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  openingHours: OpeningHour[];
  /** Pendente: definido no painel administrativo (Etapa 07). */
  socials: { instagram: string | null; facebook: string | null };
  /** Pendente: e-mail institucional não informado. */
  email: string | null;
}

export const STORE: StoreSettings = {
  name: "Agropet Vira Lata",
  slug: "agropet-vira-lata",
  segment: "Pet shop, agropecuária, produtos e serviços para animais",
  shortDescription:
    "Catálogo digital da Agropet Vira Lata: produtos e serviços para o seu animal, com atendimento pelo WhatsApp.",
  whatsapp: { display: "(61) 3399-7123", e164: "556133997123" },
  address: {
    street: "QN 7, Conjunto B, Setor Norte",
    district: "Ceilândia Sul",
    city: "Brasília",
    state: "DF",
    postalCode: "72215-072",
    country: "BR",
  },
  openingHours: [
    { day: "seg", label: "Segunda", opensAt: "07:00", closesAt: "19:00" },
    { day: "ter", label: "Terça", opensAt: "07:00", closesAt: "19:00" },
    { day: "qua", label: "Quarta", opensAt: "07:00", closesAt: "19:00" },
    { day: "qui", label: "Quinta", opensAt: "07:00", closesAt: "19:00" },
    { day: "sex", label: "Sexta", opensAt: "07:00", closesAt: "19:00" },
    { day: "sab", label: "Sábado", opensAt: "08:00", closesAt: "19:00" },
    { day: "dom", label: "Domingo", opensAt: null, closesAt: null },
  ],
  socials: { instagram: null, facebook: null },
  email: null,
};

export const fullAddress = `${STORE.address.street}, ${STORE.address.district}, ${STORE.address.city} — ${STORE.address.state}, CEP ${STORE.address.postalCode}`;