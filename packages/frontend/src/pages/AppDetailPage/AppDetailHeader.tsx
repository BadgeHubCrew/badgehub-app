import React from "react";
import { ProjectDetails } from "@shared/domain/readModels/project/ProjectDetails.ts";
import GitLink from "@sharedComponents/GitLink.tsx";

const AppDetailHeader: React.FC<{ project: ProjectDetails }> = ({
  project,
}) => {
  const appMetadata = project.version.app_metadata;
  return (
    <section className="bg-gray-800 p-6 rounded-lg shadow-lg">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1
            className="text-3xl font-bold text-slate-100 mb-2"
            data-testid="app-detail-name"
          >
            {appMetadata.name}
          </h1>
          {(project.version?.app_metadata.author && (
            <p className="text-slate-400 mb-1">
              By {project.version?.app_metadata.author}
            </p>
          )) ||
            null}
          <p className="text-xs text-slate-500">
            Published:{" "}
            {project.version?.published_at
              ? new Date(project.version?.published_at).toLocaleDateString()
              : "—"}
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-4 flex-shrink-0 flex items-center">
          <GitLink url={appMetadata.git_url} showText={true} />
        </div>
      </div>
      <div className="mt-4 pt-4 border-t border-gray-700">
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
    </section>
  );
};

export default AppDetailHeader;
