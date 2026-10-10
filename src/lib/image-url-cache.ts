/** Browser-only callers own an instance; never share signed URLs across SSR requests. */
export class ImageUrlCache {
  private entries = new Map<string, { url: string; expiresAt: number }>();

  get(key: string, now = Date.now()): string | undefined {
    const entry = this.entries.get(key);
    if (!entry || entry.expiresAt - now <= 60_000) {
      this.entries.delete(key);
      return undefined;
    }
    return entry.url;
  }

  set(key: string, url: string, expiresAt: number) {
    if (this.entries.size >= 1000) this.entries.delete(this.entries.keys().next().value ?? "");
    this.entries.set(key, { url, expiresAt });
  }

  delete(key: string) {
    this.entries.delete(key);
  }
}

export function signedImageInfo(reference: string): { path: string; expiresAt: number } | null {
  try {
    const url = new URL(reference);
    const prefix = "/storage/v1/object/sign/product-images/";
    const index = url.pathname.indexOf(prefix);
    if (index < 0) return null;
    const payload = url.searchParams.get("token")?.split(".")[1];
    const claims = payload
      ? JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")))
      : {};
    return {
      path: decodeURIComponent(url.pathname.slice(index + prefix.length)),
      expiresAt: typeof claims.exp === "number" ? claims.exp * 1000 : 0,
    };
  } catch {
    return null;
  }
}