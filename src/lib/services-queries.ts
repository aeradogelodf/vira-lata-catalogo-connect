import { queryOptions } from "@tanstack/react-query";

import { fetchServices } from "@/data/services";

export const serviceQueries = {
  public: () =>
    queryOptions({
      queryKey: ["services", "public"],
      queryFn: fetchServices,
      staleTime: 30_000,
    }),
};
