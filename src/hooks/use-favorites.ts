import { useCallback, useEffect, useState } from "react";

/**
 * Favoritos = lista de interesse (NÃO é carrinho/pedido).
 * Etapa 04: persistência local no dispositivo.
 * Futuro: o mesmo contrato pode ser servido por uma tabela `favorites`
 * vinculada a uma conta de cliente, sem mudar os componentes.
 */
const STORAGE_KEY = "agropet:favorites:v1";
const EVENT = "agropet:favorites-changed";

function read(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string") : [];
  } catch {
    return [];
  }
}

function write(ids: string[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  window.dispatchEvent(new Event(EVENT));
}

export function useFavorites() {
  const [ids, setIds] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setIds(read());
    setHydrated(true);
    const sync = () => setIds(read());
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const toggle = useCallback((productId: string) => {
    const current = read();
    write(
      current.includes(productId)
        ? current.filter((id) => id !== productId)
        : [...current, productId],
    );
  }, []);

  const isFavorite = useCallback((productId: string) => ids.includes(productId), [ids]);
  const clear = useCallback(() => write([]), []);

  return { ids, count: hydrated ? ids.length : 0, hydrated, toggle, isFavorite, clear };
}