import { memo, useState } from "react";
import { publicTsRestClient as defaultTsRestClient } from "../../api/tsRestClient.ts";
import { AppGridWithFilterAndPagination } from "@sharedComponents/AppGridWithFilterAndPagination.tsx";
import { useSession } from "@sharedComponents/keycloakSession/SessionContext.tsx";
import { PleaseLoginMessage } from "@sharedComponents/PleaseLoginMessage.tsx";
import { useTitle } from "@hooks/useTitle.ts";
import { useUserDraftProjectsFetcher } from "@hooks/useUserDraftProjectsFetcher.ts";
import PageLayout from "@sharedComponents/PageLayout.tsx";

interface AppProps {
  tsRestClient?: typeof defaultTsRestClient;
}

const MyProjectsPage = memo(
  ({ tsRestClient = defaultTsRestClient }: AppProps) => {
    useTitle("My Projects");
    const { user, keycloak } = useSession();
    const [searchQuery, setSearchQuery] = useState("");
    const appFetcher = useUserDraftProjectsFetcher({
      tsRestClient,
      user,
      keycloak,
    });
    return (
      <PageLayout
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        data-testid="my-projects-page"
      >
        {appFetcher ? (
          <AppGridWithFilterAndPagination
            appFetcher={appFetcher}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            editable={true}
          />
        ) : (
          <PleaseLoginMessage whatToSee={"see your projects"} />
        )}
      </PageLayout>
    );
  }
);

export default MyProjectsPage;
