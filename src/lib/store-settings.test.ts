import { describe, expect, test } from "bun:test";
import { FALLBACK_STORE, storeSettingsSchema, toFormValues } from "./store-settings";

describe("store links", () => {
  test("Instagram and Facebook may be empty", () => {
    const parsed = storeSettingsSchema.parse(toFormValues(FALLBACK_STORE));
    expect(parsed.instagramUrl).toBe("");
    expect(parsed.facebookUrl).toBe("");
  });
  test("multiple named links survive form conversion and validation", () => {
    const extra = [
      { label: "Site oficial", url: "https://example.com" },
      { label: "Avaliações", url: "https://example.com/reviews" },
    ];
    const store = { ...FALLBACK_STORE, socials: { ...FALLBACK_STORE.socials, extra } };
    expect(storeSettingsSchema.parse(toFormValues(store)).extraLinks).toEqual(extra);
  });
  test("additional links require a title and a safe HTTP URL", () => {
    const values = toFormValues(FALLBACK_STORE);
    expect(storeSettingsSchema.safeParse({ ...values, extraLinks: [{ label: "", url: "https://example.com" }] }).success).toBe(false);
    expect(storeSettingsSchema.safeParse({ ...values, extraLinks: [{ label: "Site", url: "javascript:alert(1)" }] }).success).toBe(false);
  });
});