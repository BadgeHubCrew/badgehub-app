import React from "react";
import { ProjectDetails } from "@shared/domain/readModels/project/ProjectDetails.ts";

const AppDescription: React.FC<{ project: ProjectDetails }> = ({
  project: {
    version: { app_metadata },
  },
}) => (
  <section className="card bg-base-200 shadow-lg">
    <div className="card-body">
      <h2 className="card-title text-2xl mb-4">Description</h2>
      <div className="prose prose-sm sm:prose lg:prose-lg xl:prose-xl max-w-none text-base-content/80 space-y-4">
        {app_metadata.description ? (
          <div>
            <h3 className="text-base font-semibold mb-2">Short description</h3>
            <p className="whitespace-pre-wrap">{app_metadata.description}</p>
          </div>
        ) : null}

        {app_metadata.long_description ? (
          <div>
            <h3 className="text-base font-semibold mb-2">Long description</h3>
            <p className="whitespace-pre-wrap">{app_metadata.long_description}</p>
          </div>
        ) : null}

        {!app_metadata.description && !app_metadata.long_description ? (
          <p>No description provided.</p>
        ) : null}
      </div>
    </div>
  </section>
);

export default AppDescription;
