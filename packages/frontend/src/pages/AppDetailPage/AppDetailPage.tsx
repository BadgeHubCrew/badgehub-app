import { useAsyncResource } from "@hooks/useAsyncResource.ts";
import { useTitle } from "@hooks/useTitle.ts";
import type { ProjectDetails } from "@shared/domain/readModels/project/ProjectDetails.ts";
import type { ProjectVersions } from "@shared/domain/readModels/project/ProjectVersions.ts";
import PageLayout from "@sharedComponents/PageLayout.tsx";
import {
  normalizePublicProjectError,
  publicProjectErrorFromStatus,
  publicProjectErrorMessage,
} from "@utils/publicProjectErrors.ts";
import type React from "react";
import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
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

function parseRevisionParam(value: string | null): number | undefined {
  if (value == null || value === "") {
    return undefined;
  }
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    return undefined;
  }
  return parsed;
}

const AppDetailPage: React.FunctionComponent<{
  apiClient?: typeof defaultApiClient;
  slug: string;
}> = ({ apiClient = defaultApiClient, slug }) => {
  useTitle(slug);
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedRevision = useMemo(
    () => parseRevisionParam(searchParams.get("revision")),
    [searchParams]
  );

  const {
    data: project,
    error,
    loading,
  } = useAsyncResource(async () => {
    const res =
      requestedRevision != null
        ? await apiClient.getProjectForRevision({
            params: { slug, revision: requestedRevision },
          })
        : await apiClient.getProject({ params: { slug } });
    if (res.status === 200) {
      return res.body as ProjectDetails;
    }
    throw new Error(publicProjectErrorFromStatus(res.status));
  }, [slug, requestedRevision, apiClient]);

  const { data: versions } = useAsyncResource(async () => {
    const res = await apiClient.getProjectVersions({ params: { slug } });
    if (res.status === 200) {
      return res.body as ProjectVersions;
    }
    // Non-fatal: picker is optional; still show the project details.
    return [] as ProjectVersions;
  }, [slug, apiClient]);

  const onSelectRevision = useCallback(
    (revision: number) => {
      const latestRevision =
        project?.latest_revision ??
        versions?.[0]?.latestRevision ??
        project?.version.revision;
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (latestRevision != null && revision === latestRevision) {
            next.delete("revision");
          } else {
            next.set("revision", String(revision));
          }
          return next;
        },
        { replace: true }
      );
    },
    [
      project?.latest_revision,
      project?.version.revision,
      setSearchParams,
      versions,
    ]
  );

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
  const viewingHistorical =
    project.latest_revision != null &&
    project.version.revision !== project.latest_revision;

  return (
    <PageLayout data-testid="app-detail-page">
      <AppBreadcrumb projectName={appMetadata.name ?? project.slug} />
      {viewingHistorical && (
        <div
          role="status"
          data-testid="historical-version-banner"
          className="alert alert-info mb-6"
        >
          <span>
            Viewing historical version{" "}
            <strong>{appMetadata.version?.trim() || "Unversioned"}</strong>{" "}
            (revision {project.version.revision}). The latest published revision
            is {project.latest_revision}.
          </span>
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <AppDetailHeader project={project} apiClient={apiClient} />
          <AppRating project={project} apiClient={apiClient} />
          <AppDescription project={project} />
          <AppCodePreview project={project} />
          {/*<AppReviews project={project} />*/}
        </div>
        <aside className="lg:col-span-1 space-y-8">
          <AppSidebarDetails
            project={project}
            versions={versions}
            onSelectRevision={onSelectRevision}
          />
          <AppSidebarAuthor project={project} />
          <AppSidebarSimilar project={project} apiClient={apiClient} />
        </aside>
      </div>
    </PageLayout>
  );
};

export default AppDetailPage;
