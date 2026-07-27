import { useTitle } from "@hooks/useTitle.ts";
import { useUserDraftProjectsFetcher } from "@hooks/useUserDraftProjectsFetcher.ts";
import { AppGridWithFilterAndPagination } from "@sharedComponents/AppGridWithFilterAndPagination.tsx";
import { AuthGate } from "@sharedComponents/keycloakSession/AuthGate.tsx";
import { useSession } from "@sharedComponents/keycloakSession/SessionContext.tsx";
import PageLayout from "@sharedComponents/PageLayout.tsx";
import Spinner from "@sharedComponents/Spinner.tsx";
import { memo, useState } from "react";
import { publicApiClient as defaultApiClient } from "../../api/apiClient.ts";

interface AppProps {
  apiClient?: typeof defaultApiClient;
}

const MyProjectsPage = memo(({ apiClient = defaultApiClient }: AppProps) => {
  useTitle("My Projects");
  const { user, keycloak } = useSession();
  const [searchQuery, setSearchQuery] = useState("");
  const appFetcher = useUserDraftProjectsFetcher({
    apiClient,
    user,
    keycloak,
  });
  return (
    <PageLayout
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
      data-testid="my-projects-page"
    >
      <AuthGate whatToSee="see your projects">
        {appFetcher ? (
          <AppGridWithFilterAndPagination
            appFetcher={appFetcher}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            editable={true}
          />
        ) : (
          <Spinner />
        )}
      </AuthGate>
    </PageLayout>
  );
});

export default MyProjectsPage;
