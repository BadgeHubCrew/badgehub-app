import React from "react";
import AppCard from "./AppCard.tsx";
import type { AppCardProps } from "../types.ts";

interface AppsGridProps {
  apps: AppCardProps[];
  editable?: boolean;
}

const AppsGrid: React.FC<AppsGridProps> = ({ apps, editable }) => {
  return (
    <>
      <section id="apps-grid">
        <h2 className="text-2xl font-semibold mb-6">
          Badge Projects
        </h2>
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          data-testid="app-cards-container"
        >
          {apps.length === 0 ? (
            <div className="col-span-full text-center opacity-60 py-8">
              No apps found.
            </div>
          ) : (
            apps.map((app) => (
              <AppCard key={app.slug} {...app} editable={editable} />
            ))
          )}
        </div>
      </section>
    </>
  );
};

export default AppsGrid;
