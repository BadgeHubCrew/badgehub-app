import { publicApiClient as defaultApiClient } from "@api/apiClient.ts";
import type { AppFetcher } from "@sharedComponents/AppGridWithFilterAndPagination.tsx";
import type { User } from "@sharedComponents/keycloakSession/SessionContext.tsx";
import type Keycloak from "keycloak-js";
import { useCallback } from "react";

interface UseUserDraftProjectsFetcherParams {
  apiClient?: typeof defaultApiClient;
  user?: User;
  keycloak?: Keycloak;
}

export const useUserDraftProjectsFetcher = ({
  apiClient = defaultApiClient,
  user,
  keycloak,
}: UseUserDraftProjectsFetcherParams): AppFetcher | undefined => {
  const appFetcher = useCallback(async () => {
    if (!user || !keycloak) {
      throw new Error("Authentication required");
    }
    await keycloak.updateToken(30).catch((e) => {
      console.error("Failed to update token", e);
      throw new Error("Failed to update token. Please try logging in again.");
    });

    const result = await apiClient
      ?.getUserDraftProjects({
        params: {
          userId: user.id,
        },
        headers: {
          authorization: `Bearer ${keycloak.token}`,
        },
      })
      .catch((e) => {
        console.error("Failed to fetch draft projects", e);
        throw new Error(
          `Failed to fetch your draft projects. Message: ${e.message}`
        );
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
  }, [keycloak, apiClient, user]);

  const userIsLoggedIn = keycloak?.authenticated && user?.id;
  return userIsLoggedIn ? appFetcher : undefined;
};
