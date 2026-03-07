import React from "react";
import Breadcrumb from "@sharedComponents/Breadcrumb.tsx";

const AppCreationBreadcrumb: React.FC = () => (
  <Breadcrumb
    items={[
      { label: "Home", to: "/" },
      { label: "Create New App" },
    ]}
  />
);

export default AppCreationBreadcrumb;
