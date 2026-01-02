import Header from "@sharedComponents/Header.tsx";
import Footer from "@sharedComponents/Footer.tsx";
import { memo, useState } from "react";
import { publicTsRestClient as defaultTsRestClient } from "../../api/tsRestClient.ts";
import { AppGridWithFilterAndPagination } from "@sharedComponents/AppGridWithFilterAndPagination.tsx";
import { useSession } from "@sharedComponents/keycloakSession/SessionContext.tsx";
import { PleaseLoginMessage } from "@sharedComponents/PleaseLoginMessage.tsx";
import { useTitle } from "@hooks/useTitle.ts";
import { useUserDraftProjectsFetcher } from "@hooks/useUserDraftProjectsFetcher.ts";

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
      <div
        className="min-h-screen flex flex-col bg-gray-900 text-slate-200"
        data-testid="my-projects-page"
      >
        <Header searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow">
          {appFetcher ? (
            <AppGridWithFilterAndPagination
              appFetcher={appFetcher}
              searchQuery={searchQuery}
              editable={true}
            />
          ) : (
            <PleaseLoginMessage whatToSee={"see your projects"} />
          )}
        </main>
        <Footer />
      </div>
    );
  }
);

export default MyProjectsPage;
