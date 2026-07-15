import { useProjectSummariesFetcher } from "@hooks/useProjectSummariesFetcher.ts";
import { useTitle } from "@hooks/useTitle.ts";
import { AppGridWithFilterAndPagination } from "@sharedComponents/AppGridWithFilterAndPagination.tsx";
import Hero from "@sharedComponents/Hero.tsx";
import PageLayout from "@sharedComponents/PageLayout.tsx";
import { memo, useState } from "react";
import { publicApiClient as defaultApiClient } from "../../api/apiClient.ts";

interface AppProps {
  apiClient?: typeof defaultApiClient;
}

const HomePage = memo(({ apiClient = defaultApiClient }: AppProps) => {
  useTitle("");
  const appFetcher = useProjectSummariesFetcher(apiClient);
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <PageLayout
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
      data-testid="main-page"
    >
      <Hero />
      <AppGridWithFilterAndPagination
        appFetcher={appFetcher}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />
    </PageLayout>
  );
});

export default HomePage;
