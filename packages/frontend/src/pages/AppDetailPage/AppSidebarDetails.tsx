import React from "react";
import { ProjectDetails } from "@shared/domain/readModels/project/ProjectDetails.ts";

const AppSidebarDetails: React.FC<{ project: ProjectDetails }> = ({
  project,
}) => {
  const { app_metadata, revision } = project.version;
  const version =
    app_metadata.version && app_metadata.version.trim().length > 0
      ? app_metadata.version
      : null;
  const licenseType =
    app_metadata.license_type && app_metadata.license_type.trim().length > 0
      ? app_metadata.license_type
      : null;

  return (
    <section className="bg-gray-800 p-6 rounded-lg shadow-lg">
      <h2 className="text-xl font-semibold text-slate-100 mb-4 border-b border-gray-700 pb-2">
        App Details
      </h2>
      <ul className="text-sm text-slate-300 space-y-3 font-mono">
        {version && (
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
          <strong>Badges:</strong>{" "}
          {app_metadata.badges?.join(", ") ?? "—"}{" "}
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
        <li className={"todoElement"}>
          <strong>Rating:</strong>{" "}
          {
            "4.8/5 (120 votes)" // TODO
          }
        </li>
      </ul>
    </section>
  );
};

export default AppSidebarDetails;
