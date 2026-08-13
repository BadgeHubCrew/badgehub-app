import type { ApiClient } from "@api/apiClient.ts";
import { getDevelopmentStatus } from "@shared/domain/readModels/project/AppMetadataJSON.ts";
import type { ProjectDetails } from "@shared/domain/readModels/project/ProjectDetails.ts";
import GitLink from "@sharedComponents/GitLink.tsx";
import type React from "react";
import AppInstallButton from "./AppInstallButton.tsx";

const AppDetailHeader: React.FC<{
  apiClient: ApiClient;
  project: ProjectDetails;
}> = ({ apiClient, project }) => {
  const appMetadata = project.version.app_metadata;
  const mpkFile = project.version.files.find((file) =>
    file.full_path.toLowerCase().endsWith(".mpk")
  );
  return (
    <section className="card bg-base-200 shadow-lg">
      <div className="card-body p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1
              className="text-3xl font-bold mb-2"
              data-testid="app-detail-name"
            >
              {appMetadata.name}
            </h1>
            {(project.version?.app_metadata.author && (
              <p className="opacity-70 mb-1">
                By {project.version?.app_metadata.author}
              </p>
            )) ||
              null}
            <p className="text-xs opacity-50">
              Published:{" "}
              {project.version?.published_at
                ? new Date(project.version?.published_at).toLocaleDateString()
                : "—"}
            </p>
          </div>
          <div className="mt-4 sm:mt-0 sm:ml-4 flex-shrink-0 flex flex-wrap items-start gap-3">
            {mpkFile && (
              <AppInstallButton
                apiClient={apiClient}
                mpkUrl={mpkFile.url}
                revision={project.version.revision}
                slug={project.slug}
              />
            )}
            <GitLink url={appMetadata.git_url} showText={true} />
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-base-300">
          {getDevelopmentStatus(appMetadata) === "work_in_progress" && (
            <span className="badge badge-warning text-sm font-semibold mr-2">
              WIP
            </span>
          )}
          {appMetadata.badges?.map((dev: string) => (
            <span
              key={dev}
              className="badge badge-success text-sm font-semibold mr-2"
            >
              {dev}
            </span>
          ))}
          {appMetadata.categories?.map((cat) => (
            <span
              key={cat}
              className="badge badge-neutral text-sm font-semibold mr-2"
            >
              {cat}
            </span>
          ))}
          {[]?.map((tag: string) => (
            <span
              key={tag}
              className="badge badge-neutral text-sm font-semibold mr-2"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AppDetailHeader;
