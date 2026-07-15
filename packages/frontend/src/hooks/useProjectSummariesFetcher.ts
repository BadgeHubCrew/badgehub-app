import { publicApiClient as defaultApiClient } from "@api/apiClient.ts";
import type { AppFetcher } from "@sharedComponents/AppGridWithFilterAndPagination.tsx";
import { useCallback } from "react";

export const useProjectSummariesFetcher = (
  apiClient: typeof defaultApiClient = defaultApiClient
): AppFetcher => {
  return useCallback(
    async (filters) => {
      const result = await apiClient?.getProjectSummaries({
        query: {
          category: filters.category,
          badge: filters.badge,
        },
      });
      switch (result.status) {
        case 200:
          return result.body;
        default:
          throw new Error(
            "Failed to fetch projects, reason " +
              (result.body as { reason: string })?.reason
          );
      }
    },
    [apiClient]
  );
};
