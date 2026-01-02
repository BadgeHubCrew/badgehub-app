import React from "react";
import { publicTsRestClient as defaultTsRestClient } from "../../api/tsRestClient.ts";
import AppDetailHeader from "./AppDetailHeader.tsx";
import AppDescription from "./AppDescription.tsx";
import AppCodePreview from "./AppCodePreview.tsx";
// import AppReviews from "./AppDetailPage/AppReviews";
import AppSidebarDetails from "./AppSidebarDetails.tsx";
import AppSidebarAuthor from "./AppSidebarAuthor.tsx";
import AppSidebarSimilar from "./AppSidebarSimilar.tsx";
import AppBreadcrumb from "./AppBreadcrumb.tsx";
import { ProjectDetails } from "@shared/domain/readModels/project/ProjectDetails.ts";
import Header from "@sharedComponents/Header.tsx";
import Footer from "@sharedComponents/Footer.tsx";
import { useTitle } from "@hooks/useTitle.ts";
import { useAsyncResource } from "@hooks/useAsyncResource.ts";
import {
  normalizePublicProjectError,
  publicProjectErrorFromStatus,
  publicProjectErrorMessage,
} from "@utils/publicProjectErrors.ts";

const AppDetailPage: React.FunctionComponent<{
  tsRestClient?: typeof defaultTsRestClient;
  slug: string;
}> = ({ tsRestClient = defaultTsRestClient, slug }) => {
  useTitle(slug);
  const { data: project, error, loading } = useAsyncResource(
    async () => {
      const res = await tsRestClient.getProject({ params: { slug } });
      if (res.status === 200) {
        return res.body;
      }
      throw new Error(publicProjectErrorFromStatus(res.status));
    },
    [slug, tsRestClient]
  );

  const errorMessage = error
    ? publicProjectErrorMessage(normalizePublicProjectError(error))
    : null;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 text-slate-400 bg-gray-900 min-h-screen">
        Loading...
      </div>
    );
  }
  if (errorMessage) {
    return (
      <div
        data-testid="app-detail-error"
        className="flex justify-center items-center h-64 text-red-400 bg-gray-900 min-h-screen"
      >
        {errorMessage}
      </div>
    );
  }
  if (!project) {
    return (
      <div
        data-testid="app-detail-error"
        className="flex justify-center items-center h-64 text-red-400 bg-gray-900 min-h-screen"
      >
        App not found.
      </div>
    );
  }
  const appMetadata = project.version.app_metadata;
  return (
    <div
      data-testid={"app-detail-page"}
      className="min-h-screen flex flex-col bg-gray-900 text-slate-200"
    >
      <Header />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow">
        <AppBreadcrumb projectName={appMetadata.name ?? project.slug} />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <AppDetailHeader project={project} />
            <AppDescription project={project} />
            <AppCodePreview project={project} />
            {/*<AppReviews project={project} />*/}
          </div>
          <aside className="lg:col-span-1 space-y-8">
            <AppSidebarDetails project={project} />
            <AppSidebarAuthor project={project} />
            <AppSidebarSimilar project={project} tsRestClient={tsRestClient} />
          </aside>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AppDetailPage;
