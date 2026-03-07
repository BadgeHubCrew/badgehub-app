import React from "react";
import { ProjectDetails } from "@shared/domain/readModels/project/ProjectDetails.ts";

const AppSidebarAuthor: React.FC<{ project: ProjectDetails }> = ({
  project,
}) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const author = (project as any).author || {}; // TODO
  return (
    <section className="bg-gray-800 p-6 rounded-lg shadow-lg todoElement">
      <h2 className="text-xl font-semibold text-slate-100 mb-4 border-b border-gray-700 pb-2">
        Author
      </h2>
      <div className="flex items-center">
        <img
          src={
            author.avatarUrl ||
            "https://placehold.co/50x50/047857/D1FAE5?text=DG"
          }
          alt="Author Avatar"
          className="w-12 h-12 rounded-full mr-4"
        />
        <div>
          <a
            href="#"
            className="text-lg font-semibold text-emerald-400 hover:underline"
          >
            {author.displayName || author.username || "Unknown"}
          </a>
          <p className="text-xs text-slate-400">
            Joined:{" "}
            {author.createdAt
              ? new Date(author.createdAt).toLocaleDateString()
              : "Jan 2022"}
          </p>
        </div>
      </div>
      <p className="text-sm text-slate-400 mt-3">
        {author.bio ||
          "Passionate about embedded systems and open-source. Sharing my projects with the community!"}
      </p>
      <a
        href="#"
        className="mt-3 inline-block btn btn-neutral btn-sm w-full text-center todoElement"
      >
        View Profile
      </a>
    </section>
  );
};

export default AppSidebarAuthor;
