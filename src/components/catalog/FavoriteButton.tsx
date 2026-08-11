import { Heart } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useFavorites } from "@/hooks/use-favorites";
import { cn } from "@/lib/utils";

export function FavoriteButton({
  productId,
  productName,
  className,
  size = "icon",
}: {
  productId: string;
  productName: string;
  className?: string;
  size?: "icon" | "sm";
}) {
  const { isFavorite, toggle } = useFavorites();
  const active = isFavorite(productId);

  return (
    <Button
      type="button"
      variant="outline"
      size={size}
      aria-pressed={active}
      aria-label={
        active ? `Remover ${productName} dos favoritos` : `Salvar ${productName} nos favoritos`
      }
      onClick={() => toggle(productId)}
      className={cn("bg-background/90 backdrop-blur", className)}
    >
      <Heart className={cn("size-4", active && "fill-primary text-primary")} aria-hidden />
      {size === "sm" && <span>{active ? "Salvo" : "Favoritar"}</span>}
    </Button>
  );
}