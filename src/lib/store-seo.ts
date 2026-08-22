/** Dados estruturados gerados a partir de `store_settings` (sem hardcode). */
import { formatAddress, type StoreInfo } from "@/lib/store-settings";

const SCHEMA_DAY: Record<string, string> = {
  seg: "Monday",
  ter: "Tuesday",
  qua: "Wednesday",
  qui: "Thursday",
  sex: "Friday",
  sab: "Saturday",
  dom: "Sunday",
};

function sameAs(store: StoreInfo): string[] {
  return [
    store.socials.instagram,
    store.socials.facebook,
    store.socials.tiktok,
    store.socials.website,
    store.socials.other,
  ].filter((url): url is string => Boolean(url));
}

export function localBusinessJsonLd(store: StoreInfo): Record<string, unknown> {
  const links = sameAs(store);
  const hours = store.openingHours
    .filter((hour) => hour.opensAt && hour.closesAt)
    .map((hour) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: SCHEMA_DAY[hour.day],
      opens: hour.opensAt,
      closes: hour.closesAt,
    }));

  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: store.name,
    ...(store.shortDescription ? { description: store.shortDescription } : {}),
    telephone: `+${store.whatsapp.e164.replace(/\D/g, "")}`,
    ...(store.email ? { email: store.email } : {}),
    ...(formatAddress(store)
      ? {
          address: {
            "@type": "PostalAddress",
            streetAddress: [store.address.street, store.address.number]
              .filter(Boolean)
              .join(", "),
            addressLocality: [store.address.district, store.address.city]
              .filter(Boolean)
              .join(", "),
            addressRegion: store.address.state,
            postalCode: store.address.postalCode,
            addressCountry: store.address.country,
          },
        }
      : {}),
    ...(hours.length > 0 ? { openingHoursSpecification: hours } : {}),
    ...(links.length > 0 ? { sameAs: links } : {}),
    ...(store.socials.website ? { url: store.socials.website } : {}),
  };

  return data;
}

export function organizationJsonLd(store: StoreInfo): Record<string, unknown> {
  const links = sameAs(store);
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: store.tradeName ?? store.name,
    legalName: store.name,
    ...(store.shortDescription ? { description: store.shortDescription } : {}),
    ...(store.email ? { email: store.email } : {}),
    ...(links.length > 0 ? { sameAs: links } : {}),
  };
}
