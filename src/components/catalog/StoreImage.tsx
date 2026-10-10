import { useEffect, useState, type ImgHTMLAttributes } from "react";
import { PawPrint } from "lucide-react";

import { isStoragePath, resolveImageUrls } from "@/lib/product-images";
import { signedImageInfo } from "@/lib/image-url-cache";
import { cn } from "@/lib/utils";

/** Keeps the original reference, renews expiring signatures, and bounds retries. */
export function StoreImage({ src, alt = "", className, ...props }: ImgHTMLAttributes<HTMLImageElement>) {
  const reference = typeof src === "string" ? src : "";
  const [replacement, setReplacement] = useState<{ reference: string; url: string | null } | null>(null);
  const url = replacement?.reference === reference
    ? replacement.url
    : reference && !isStoragePath(reference) ? reference : null;
  const [failure, setFailure] = useState<{ reference: string; count: number }>({ reference: "", count: 0 });
  const count = failure.reference === reference ? failure.count : 0;

  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const path = signedImageInfo(reference)?.path ?? (isStoragePath(reference) ? reference : null);
    if (!path) return;
    async function renew(force: boolean) {
      if (!path) return;
      const urls = await resolveImageUrls([path], { force });
      if (!active) return;
      const next = urls.get(path) ?? null;
      setReplacement({ reference, url: next });
      schedule(next);
    }
    function schedule(current: string | null) {
      const expiresAt = current ? signedImageInfo(current)?.expiresAt : undefined;
      // A failed refresh is retried on reconnect/focus, not in an infinite loop.
      if (expiresAt && expiresAt > Date.now()) {
        timer = setTimeout(() => void renew(true), Math.max(1000, expiresAt - Date.now() - 60_000));
      }
    }
    const check = () => {
      const info = url ? signedImageInfo(url) : null;
      if (!url || (info && info.expiresAt - Date.now() <= 60_000)) {
        if (timer) clearTimeout(timer);
        void renew(true);
      }
    };
    if (!url || (signedImageInfo(url)?.expiresAt ?? Infinity) - Date.now() <= 60_000) void renew(count > 0);
    else schedule(url);
    window.addEventListener("online", check);
    window.addEventListener("focus", check);
    return () => {
      active = false;
      if (timer) clearTimeout(timer);
      window.removeEventListener("online", check);
      window.removeEventListener("focus", check);
    };
  }, [reference, url, count]);

  if (!url || count >= 2) {
    return (
      <div className={cn("grid place-items-center bg-secondary text-muted-foreground", className)} role="img" aria-label={alt ? `${alt} — imagem não disponível` : "Imagem não disponível"}>
        <PawPrint className="size-8" aria-hidden />
      </div>
    );
  }
  return <img {...props} src={url} alt={alt} className={className} suppressHydrationWarning onError={() => {
    const info = signedImageInfo(url);
    setFailure({ reference, count: count + 1 });
    if (info) {
      setReplacement({ reference, url: null });
    }
  }} />;
}