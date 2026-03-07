import React from "react";
import Breadcrumb from "@sharedComponents/Breadcrumb.tsx";

const AppBreadcrumb: React.FC<{ projectName: string }> = ({ projectName }) => (
  <Breadcrumb
    items={[
      { label: "Home", to: "/" },
      { label: "Apps", to: "/#apps-grid" },
      { label: projectName },
    ]}
  />
);

export default AppBreadcrumb;
