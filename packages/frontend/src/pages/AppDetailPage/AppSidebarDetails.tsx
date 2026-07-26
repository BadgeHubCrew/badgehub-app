import type { ProjectDetails } from "@shared/domain/readModels/project/ProjectDetails.ts";
import type { ProjectVersions } from "@shared/domain/readModels/project/ProjectVersions.ts";
import type React from "react";
import AppVersionPicker from "./AppVersionPicker.tsx";

const AppSidebarDetails: React.FC<{
  project: ProjectDetails;
  versions?: ProjectVersions | null;
  onSelectRevision?: (revision: number) => void;
}> = ({ project, versions, onSelectRevision }) => {
  const { app_metadata, revision } = project.version;
  const version =
    app_metadata.version && app_metadata.version.trim().length > 0
      ? app_metadata.version
      : null;
  const licenseType =
    app_metadata.license_type && app_metadata.license_type.trim().length > 0
      ? app_metadata.license_type
      : null;
  const ratingsText = project.ratings
    ? `${project.ratings.average.toFixed(1)}/5 (${project.ratings.count} ratings)`
    : "No ratings yet";
  const showVersionPicker =
    versions != null && versions.length > 1 && onSelectRevision != null;

  return (
    <section className="card bg-base-200 shadow-lg">
      <div className="card-body p-6">
        <h2 className="text-xl font-semibold mb-4 border-b border-base-300 pb-2">
          App Details
        </h2>
        {showVersionPicker && (
          <div className="mb-4">
            <AppVersionPicker
              versions={versions}
              selectedRevision={revision}
              onSelectRevision={onSelectRevision}
            />
          </div>
        )}
        <ul className="text-sm space-y-3 font-mono">
          {!showVersionPicker && version && (
            <li>
              <strong>Version:</strong> {version}
            </li>
          )}
          <li>
            <strong>Revision:</strong> {revision ?? "—"}
          </li>
          {licenseType && (
            <li>
              <strong>License:</strong> {licenseType}
            </li>
          )}
          <li>
            <strong>Badges:</strong> {app_metadata.badges?.join(", ") ??
              "—"}{" "}
          </li>
          <li>
            <strong>Categories:</strong>{" "}
            {app_metadata.categories?.join(",") ?? "—"}
          </li>
          <li>
            <strong>Type:</strong> {app_metadata.project_type ?? "app"}
          </li>
          <li className={"todoElement"}>
            <strong>Downloads:</strong> {"Download count not available"}
          </li>
          <li>
            <strong>Rating:</strong> {ratingsText}
          </li>
        </ul>
      </div>
    </section>
  );
};

export default AppSidebarDetails;
