import React from "react";
import { ProjectDetails } from "@shared/domain/readModels/project/ProjectDetails.ts";

const AppDescription: React.FC<{ project: ProjectDetails }> = ({
  project: {
    version: { app_metadata },
  },
}) => (
  <section className="bg-gray-800 p-6 rounded-lg shadow-lg">
    <h2 className="text-2xl font-semibold text-slate-100 mb-4">Description</h2>
    <div className="prose prose-sm sm:prose lg:prose-lg xl:prose-xl max-w-none text-slate-300 space-y-4">
      {app_metadata.description ? (
        <pre>{app_metadata.description}</pre>
      ) : (
        <p>No description provided.</p>
      )}
    </div>
  </section>
);

export default AppDescription;
