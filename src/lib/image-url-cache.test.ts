import { expect, test } from "bun:test";
import { ImageUrlCache, signedImageInfo } from "./image-url-cache";

test("reuse URLs until one minute before expiry", () => {
  const cache = new ImageUrlCache();
  cache.set("public:photo", "signed-url", 3600_000);
  expect(cache.get("public:photo", 1000)).toBe("signed-url");
  expect(cache.get("public:photo", 3540_000)).toBeUndefined();
});
test("private admin cache entries are isolated from public entries", () => {
  const cache = new ImageUrlCache();
  cache.set("admin:photo", "private-url", 3600_000);
  expect(cache.get("public:photo", 1000)).toBeUndefined();
});
test("recover original path and expiry without using token as authorization", () => {
  const token = `e30.${btoa(JSON.stringify({ exp: 3600 }))}.signature`;
  expect(signedImageInfo(`https://example.com/storage/v1/object/sign/product-images/a%20b/photo.png?token=${token}`)).toEqual({ path: "a b/photo.png", expiresAt: 3600_000 });
  expect(signedImageInfo("https://example.com/photo.png")).toBeNull();
});