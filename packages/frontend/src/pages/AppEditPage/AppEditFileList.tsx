import React from "react";
import { FileListItem } from "@pages/AppEditPage/FileListItem.tsx";
import { IconSize } from "@shared/domain/readModels/project/AppMetadataJSON.ts";
import { ProjectDetails } from "@shared/domain/readModels/project/ProjectDetails.ts";
import { User } from "@sharedComponents/keycloakSession/SessionContext.tsx";

interface AppEditFilePreviewProps {
  user?: User; // Optional user prop for authentication
  project: ProjectDetails;
  onSetIcon?: (iconSize: IconSize, filePath: string) => void;
  iconFilePath?: string;
  onDeleteFile?: (filePath: string) => void;
  mainExecutable?: string;
  onSetMainExecutable?: (filePath: string) => void;
}

/**
 * Displays a list of project files with actions to delete or set an icon/main executable.
 * This is the main component that orchestrates the file preview section.
 */
const AppEditFileList: React.FC<AppEditFilePreviewProps> = ({
  project,
  onSetIcon,
  iconFilePath,
  onDeleteFile,
  mainExecutable,
  onSetMainExecutable,
}) => {
  // Use nullish coalescing for a cleaner way to handle potentially undefined files
  const files = project?.version?.files ?? [];

  return (
    <section className="bg-gray-800 p-6 rounded-lg shadow-lg text-left mt-8">
      <h2 className="text-2xl font-semibold text-slate-100 mb-4">Files</h2>
      <div>
        <h3 className="text-lg font-medium text-slate-200 mb-2">
          Project Files:
        </h3>
        {files.length > 0 ? (
          <ul className="list-none text-slate-400 text-sm space-y-1">
            {files.map((file) => (
              <FileListItem
                // Using a stable identifier like full_path for the key is better than an index
                key={file.full_path}
                file={file}
                onDeleteFile={onDeleteFile}
                onSetIcon={onSetIcon}
                iconFilePath={iconFilePath}
                mainExecutable={mainExecutable}
                onSetMainExecutable={onSetMainExecutable}
              />
            ))}
          </ul>
        ) : (
          <p className="text-slate-500 italic">
            No files in this project version.
          </p>
        )}
      </div>
    </section>
  );
};

export default AppEditFileList;
