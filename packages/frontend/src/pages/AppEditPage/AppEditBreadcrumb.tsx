import React from "react";
import { ProjectDetails } from "@shared/domain/readModels/project/ProjectDetails.ts";
import Breadcrumb from "@sharedComponents/Breadcrumb.tsx";

const AppEditBreadcrumb: React.FC<{ project: ProjectDetails }> = ({
  project,
}) => {
  const appMetadata = project.version.app_metadata;
  return (
    <Breadcrumb
      items={[
        { label: "Home", to: "/" },
        { label: "Apps", to: "/page/my-projects" },
        { label: appMetadata.name ?? project.slug, to: `/page/project/${project.slug}` },
        { label: "Edit" },
      ]}
    />
  );
};

export default AppEditBreadcrumb;
