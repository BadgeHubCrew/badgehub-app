import React from "react";
import { Link } from "react-router-dom";

const AppBreadcrumb: React.FC<{ projectName: string }> = ({ projectName }) => (
  <nav className="mb-6 text-sm" aria-label="Breadcrumb">
    <ol className="list-none p-0 inline-flex space-x-2">
      <li className="flex items-center">
        <Link to="/" className="text-emerald-400 hover:text-emerald-300">
          Home
        </Link>
      </li>
      <li className="flex items-center">
        <span className="mx-2 text-slate-400">/</span>
        <Link
          to="/#apps-grid"
          className="text-emerald-400 hover:text-emerald-300"
        >
          Apps
        </Link>
      </li>
      <li className="flex items-center">
        <span className="mx-2 text-slate-400">/</span>
        <span className="text-slate-500">{projectName}</span>
      </li>
    </ol>
  </nav>
);

export default AppBreadcrumb;
