import { queryOptions } from "@tanstack/react-query";

import { fetchStoreSettings } from "@/data/store";

export const storeQueries = {
  settings: () =>
    queryOptions({
      queryKey: ["store", "settings"],
      queryFn: fetchStoreSettings,
      staleTime: 60_000,
    }),
};
