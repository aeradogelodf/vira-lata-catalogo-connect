import { useQuery } from "@tanstack/react-query";

import { storeQueries } from "@/lib/store-queries";
import { FALLBACK_STORE, type StoreInfo } from "@/lib/store-settings";

/**
 * Informações institucionais vindas de `store_settings`.
 * O fallback técnico evita layout vazio enquanto a consulta carrega.
 */
export function useStore(): StoreInfo {
  const { data } = useQuery(storeQueries.settings());
  return data ?? FALLBACK_STORE;
}
