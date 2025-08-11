import type { ProjectDetails } from "@shared/domain/readModels/project/ProjectDetails.ts";
import MarkdownText from "@sharedComponents/MarkdownText.tsx";
import type React from "react";

const AppDescription: React.FC<{ project: ProjectDetails }> = ({
  project: {
    version: { app_metadata },
  },
}) => {
  const longDescription = app_metadata.long_description?.trim();
  const shortDescription = app_metadata.description?.trim();
  const primaryDescription = longDescription || shortDescription;

  return (
    <section className="card bg-base-200 shadow-lg">
      <div className="card-body">
        <h2 className="card-title text-2xl mb-4">Description</h2>
        <div className="prose prose-sm sm:prose lg:prose-lg xl:prose-xl max-w-none text-base-content/80 space-y-4">
          {primaryDescription ? (
            <MarkdownText>{primaryDescription}</MarkdownText>
          ) : (
            <p>No description provided.</p>
          )}
        </div>
      </div>
    </section>
  );
};

export default AppDescription;
