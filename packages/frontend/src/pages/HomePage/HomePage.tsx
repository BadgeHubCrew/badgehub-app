import Header from "@sharedComponents/Header.tsx";
import Hero from "@sharedComponents/Hero.tsx";
import Footer from "@sharedComponents/Footer.tsx";
import { memo, useState } from "react";
import { publicTsRestClient as defaultTsRestClient } from "../../api/tsRestClient.ts";
import {
  AppFetcher,
  AppGridWithFilterAndPagination,
} from "@sharedComponents/AppGridWithFilterAndPagination.tsx";
import { useTitle } from "@hooks/useTitle.ts";

interface AppProps {
  tsRestClient?: typeof defaultTsRestClient;
}

const HomePage = memo(({ tsRestClient = defaultTsRestClient }: AppProps) => {
  useTitle('');
  const appFetcher: AppFetcher = async (filters) => {
    const result = await tsRestClient?.getProjectSummaries({
      query: {
        categories: filters.categories,
        badges: filters.badges,
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
  };
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div
      className="min-h-screen flex flex-col bg-gray-900 text-slate-200"
      data-testid="main-page"
    >
      <Header searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow">
        <Hero />
        <AppGridWithFilterAndPagination
          appFetcher={appFetcher}
          searchQuery={searchQuery}
        />
      </main>
      <Footer />
    </div>
  );
});

export default HomePage;
