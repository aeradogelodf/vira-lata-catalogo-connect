import { queryOptions } from "@tanstack/react-query";

import { fetchBanners } from "@/data/banners";

export const bannerQueries = {
  public: () =>
    queryOptions({
      queryKey: ["banners", "public"],
      queryFn: fetchBanners,
      staleTime: 60_000,
    }),
};
