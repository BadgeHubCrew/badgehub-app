import { useAsyncResource } from "@hooks/useAsyncResource.ts";
import { useTitle } from "@hooks/useTitle.ts";
import PageLayout from "@sharedComponents/PageLayout.tsx";
import {
  normalizePublicProjectError,
  publicProjectErrorFromStatus,
  publicProjectErrorMessage,
} from "@utils/publicProjectErrors.ts";
import type React from "react";
import { publicApiClient as defaultApiClient } from "../../api/apiClient.ts";
import AppBreadcrumb from "./AppBreadcrumb.tsx";
import AppCodePreview from "./AppCodePreview.tsx";
import AppDescription from "./AppDescription.tsx";
import AppDetailHeader from "./AppDetailHeader.tsx";
import AppRating from "./AppRating.tsx";
import AppSidebarAuthor from "./AppSidebarAuthor.tsx";
// import AppReviews from "./AppDetailPage/AppReviews";
import AppSidebarDetails from "./AppSidebarDetails.tsx";
import AppSidebarSimilar from "./AppSidebarSimilar.tsx";

const AppDetailPage: React.FunctionComponent<{
  apiClient?: typeof defaultApiClient;
  slug: string;
}> = ({ apiClient = defaultApiClient, slug }) => {
  useTitle(slug);
  const {
    data: project,
    error,
    loading,
  } = useAsyncResource(async () => {
    const res = await apiClient.getProject({ params: { slug } });
    if (res.status === 200) {
      return res.body;
    }
    throw new Error(publicProjectErrorFromStatus(res.status));
  }, [slug, apiClient]);

  const errorMessage = error
    ? publicProjectErrorMessage(normalizePublicProjectError(error))
    : null;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 min-h-screen">
        Loading...
      </div>
    );
  }
  if (errorMessage) {
    return (
      <div
        data-testid="app-detail-error"
        className="flex justify-center items-center h-64 text-error min-h-screen"
      >
        {errorMessage}
      </div>
    );
  }
  if (!project) {
    return (
      <div
        data-testid="app-detail-error"
        className="flex justify-center items-center h-64 text-error min-h-screen"
      >
        App not found.
      </div>
    );
  }
  const appMetadata = project.version.app_metadata;
  return (
    <PageLayout data-testid="app-detail-page">
      <AppBreadcrumb projectName={appMetadata.name ?? project.slug} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <AppDetailHeader project={project} />
          <AppRating project={project} apiClient={apiClient} />
          <AppDescription project={project} />
          <AppCodePreview project={project} />
          {/*<AppReviews project={project} />*/}
        </div>
        <aside className="lg:col-span-1 space-y-8">
          <AppSidebarDetails project={project} />
          <AppSidebarAuthor project={project} />
          <AppSidebarSimilar project={project} apiClient={apiClient} />
        </aside>
      </div>
    </PageLayout>
  );
};

export default AppDetailPage;
