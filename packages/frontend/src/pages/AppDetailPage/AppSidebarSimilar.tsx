import React from "react";
import { ProjectDetails } from "@shared/domain/readModels/project/ProjectDetails.ts";
import { publicTsRestClient as defaultTsRestClient } from "../../api/tsRestClient.ts";
import { ERROR_ICON_URL } from "@config.ts";
import { ProjectSummary } from "@shared/domain/readModels/project/ProjectSummaries.ts";
import { useAsyncResource } from "@hooks/useAsyncResource.ts";
import {
  normalizePublicProjectError,
  publicProjectErrorFromStatus,
  publicProjectErrorMessage,
} from "@utils/publicProjectErrors.ts";

/**
 * Renders a single project item in the list.
 */
const ProjectItem: React.FC<{ project: ProjectSummary }> = ({ project }) => (
  <div className="flex items-start space-x-3">
    {project.icon_map?.["64x64"] && (
      <img
        src={project.icon_map["64x64"].url}
        alt={`${project.name} Icon`}
        className="h-12 w-12 flex-shrink-0 rounded-md bg-gray-700 object-cover"
        // Basic fallback in case the image URL is broken
        onError={(e) => {
          e.currentTarget.src = ERROR_ICON_URL;
        }}
      />
    )}
    <div>
      <a
        href={`/page/project/${project.slug}`} // This link should point to your project detail page
        className="text-sm font-semibold text-emerald-400 hover:underline"
      >
        {project.name}
      </a>
      {project.categories && project.categories.length > 0 && (
        <p className="text-xs text-slate-400">
          {project.categories.join(", ")}
        </p>
      )}
    </div>
  </div>
);

/**
 * A helper component to render a skeleton loading state, providing a better UX.
 */
const SkeletonLoader: React.FC = () => (
  <>
    {[...Array(3)].map((_, i) => (
      <div key={i} className="flex animate-pulse items-start space-x-3">
        <div className="h-12 w-12 flex-shrink-0 rounded-md bg-gray-700"></div>
        <div className="flex-grow space-y-2 pt-1">
          <div className="h-4 w-3/4 rounded bg-gray-700"></div>
          <div className="h-3 w-1/2 rounded bg-gray-700"></div>
        </div>
      </div>
    ))}
  </>
);

/**
 * Displays a sidebar with a list of other projects by the same author.
 */
const AppSidebarSimilar: React.FC<{
  project: ProjectDetails;
  tsRestClient: typeof defaultTsRestClient;
}> = ({ project, tsRestClient = defaultTsRestClient }) => {
  const { data: similarProjects, error, loading } = useAsyncResource(
    async () => {
      if (!project.idp_user_id) {
        return [];
      }
      const result = await tsRestClient.getProjectSummaries({
        query: {
          userId: project.idp_user_id,
          pageLength: 4,
        },
      });
      if (result.status === 200) {
        return result.body.filter((p) => p.slug !== project.slug).slice(0, 3);
      }
      throw new Error(publicProjectErrorFromStatus(result.status));
    },
    [project.idp_user_id, project.slug, tsRestClient]
  );

  const renderContent = () => {
    if (loading) {
      return <SkeletonLoader />;
    }
    if (error) {
      return (
        <p className="text-sm text-red-400">
          {publicProjectErrorMessage(normalizePublicProjectError(error))}
        </p>
      );
    }
    if (similarProjects && similarProjects.length > 0) {
      return similarProjects.map((p) => (
        <ProjectItem key={p.slug} project={p} />
      ));
    }
    return (
      <p className="text-sm text-slate-400">
        No other projects by this author found.
      </p>
    );
  };

  return (
    <section className="w-full max-w-sm rounded-lg bg-gray-800 p-6 shadow-lg">
      <h2 className="mb-4 border-b border-gray-700 pb-2 text-xl font-semibold text-slate-100">
        Other Projects by {project.version.app_metadata.author || "this author"}
      </h2>
      <div className="space-y-4">{renderContent()}</div>
    </section>
  );
};

export default AppSidebarSimilar;
