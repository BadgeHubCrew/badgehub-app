import { FileListItem } from "@pages/AppEditPage/FileListItem.tsx";
import type { ProjectDetails } from "@shared/domain/readModels/project/ProjectDetails.ts";
import type Keycloak from "keycloak-js";
import type React from "react";
import { useMemo } from "react";

interface AppEditFileListProps {
  project: ProjectDetails;
  onSetIcon?: (filePath: string) => void;
  iconFilePath?: string;
  onDeleteFile?: (filePath: string) => void;
  mainExecutable?: string;
  onSetMainExecutable?: (filePath: string) => void;
  onPreview?: (filePath: string) => void;
  slug: string;
  keycloak: Keycloak;
  recentPaths?: ReadonlySet<string>;
}

/**
 * Displays a list of project files with actions to delete or set an icon/main executable.
 * Sorted by most recently updated first so new uploads appear at the top.
 */
const AppEditFileList: React.FC<AppEditFileListProps> = ({
  project,
  onSetIcon,
  iconFilePath,
  onDeleteFile,
  mainExecutable,
  onSetMainExecutable,
  onPreview,
  slug,
  keycloak,
  recentPaths,
}) => {
  const files = useMemo(() => {
    const list = project?.version?.files ?? [];
    return [...list].sort(
      (a, b) => Date.parse(b.updated_at) - Date.parse(a.updated_at)
    );
  }, [project?.version?.files]);

  if (files.length === 0) {
    return (
      <p
        className="opacity-50 italic text-sm"
        data-testid="app-edit-file-list-empty"
      >
        No files yet. Drop files above to add them to this draft.
      </p>
    );
  }

  return (
    <ul
      className="list-none text-sm space-y-1"
      data-testid="app-edit-file-list"
    >
      {files.map((file) => (
        <FileListItem
          key={file.full_path}
          file={file}
          onDeleteFile={onDeleteFile}
          onSetIcon={onSetIcon}
          iconFilePath={iconFilePath}
          mainExecutable={mainExecutable}
          onSetMainExecutable={onSetMainExecutable}
          onPreview={onPreview}
          slug={slug}
          keycloak={keycloak}
          isRecent={recentPaths?.has(file.full_path) ?? false}
        />
      ))}
    </ul>
  );
};

export default AppEditFileList;
