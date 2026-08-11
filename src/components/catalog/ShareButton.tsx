import { Check, Share2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

export function ShareButton({ title, text }: { title: string; text?: string }) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title, text, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copiado para a área de transferência");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Compartilhamento cancelado ou bloqueado pelo navegador — sem erro técnico ao cliente.
    }
  }

  return (
    <Button type="button" variant="outline" onClick={handleShare} aria-label={`Compartilhar ${title}`}>
      {copied ? <Check className="size-4" aria-hidden /> : <Share2 className="size-4" aria-hidden />}
      {copied ? "Link copiado" : "Compartilhar"}
    </Button>
  );
}