import type { ProjectEditFormData } from "@pages/AppEditPage/ProjectEditFormData.ts";
import type { ProjectDetails } from "@shared/domain/readModels/project/ProjectDetails.ts";
import type Keycloak from "keycloak-js";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import AppEditFileList from "./AppEditFileList.tsx";
import AppEditFileUpload, {
  type UploadSuccessResult,
} from "./AppEditFileUpload.tsx";

const RECENT_HIGHLIGHT_MS = 5_000;

const AppEditFilesSection: React.FC<{
  project: ProjectDetails;
  appMetadata: ProjectEditFormData;
  slug: string;
  keycloak: Keycloak;
  mainExecutable?: string;
  onPreviewFile: (filePath: string) => void;
  onSetIcon: (filePath: string) => void;
  onDeleteFile: (filePath: string) => void;
  onSetMainExecutable: (filePath: string) => void;
  onUploadSuccess: (result: UploadSuccessResult) => void;
}> = ({
  project,
  appMetadata,
  slug,
  keycloak,
  mainExecutable,
  onPreviewFile,
  onSetIcon,
  onDeleteFile,
  onSetMainExecutable,
  onUploadSuccess,
}) => {
  const [recentPaths, setRecentPaths] = useState<ReadonlySet<string>>(
    () => new Set()
  );
  const clearRecentTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  useEffect(() => {
    return () => {
      if (clearRecentTimerRef.current) {
        clearTimeout(clearRecentTimerRef.current);
      }
    };
  }, []);

  const handleUploadSuccess = useCallback(
    (result: UploadSuccessResult) => {
      if (result.uploadedPaths && result.uploadedPaths.length > 0) {
        setRecentPaths(new Set(result.uploadedPaths));
        if (clearRecentTimerRef.current) {
          clearTimeout(clearRecentTimerRef.current);
        }
        clearRecentTimerRef.current = setTimeout(() => {
          setRecentPaths(new Set());
          clearRecentTimerRef.current = null;
        }, RECENT_HIGHLIGHT_MS);
      }
      onUploadSuccess(result);
    },
    [onUploadSuccess]
  );

  return (
    <section className="card bg-base-200 shadow-lg text-left">
      <div className="card-body gap-4">
        <h2 className="card-title text-2xl">Project files</h2>
        <AppEditFileUpload
          slug={slug}
          keycloak={keycloak}
          onUploadSuccess={handleUploadSuccess}
        />
        <AppEditFileList
          project={project}
          onSetIcon={onSetIcon}
          iconFilePath={appMetadata?.icon_map?.["64x64"]}
          onDeleteFile={onDeleteFile}
          mainExecutable={mainExecutable}
          onSetMainExecutable={onSetMainExecutable}
          onPreview={onPreviewFile}
          slug={slug}
          keycloak={keycloak}
          recentPaths={recentPaths}
        />
      </div>
    </section>
  );
};

export default AppEditFilesSection;
