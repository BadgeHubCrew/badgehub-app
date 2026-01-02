import { useCallback } from "react";
import Keycloak from "keycloak-js";
import {
  publicTsRestClient as defaultTsRestClient,
} from "@api/tsRestClient.ts";
import type { AppFetcher } from "@sharedComponents/AppGridWithFilterAndPagination.tsx";
import type { User } from "@sharedComponents/keycloakSession/SessionContext.tsx";

interface UseUserDraftProjectsFetcherParams {
  tsRestClient?: typeof defaultTsRestClient;
  user?: User;
  keycloak?: Keycloak;
}

export const useUserDraftProjectsFetcher = ({
  tsRestClient = defaultTsRestClient,
  user,
  keycloak,
}: UseUserDraftProjectsFetcherParams): AppFetcher | undefined => {
  const appFetcher = useCallback(async () => {
    if (!user || !keycloak) {
      throw new Error("Authentication required");
    }
    await keycloak.updateToken(30).catch((e) => {
      console.error("Failed to update token", e);
      throw new Error(
        "Failed to update token. Please try logging in again."
      );
    });

    const result = await tsRestClient
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
          "Failed to fetch your draft projects. Message: " + e.message
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
  }, [keycloak, tsRestClient, user]);

  const userIsLoggedIn = keycloak?.authenticated && user?.id;
  return userIsLoggedIn ? appFetcher : undefined;
};
