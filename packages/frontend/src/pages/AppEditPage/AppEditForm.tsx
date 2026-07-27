import AppCodePreview from "@pages/AppDetailPage/AppCodePreview.tsx";
import type { ProjectEditFormData } from "@pages/AppEditPage/ProjectEditFormData.ts";
import type { ProjectDetails } from "@shared/domain/readModels/project/ProjectDetails.ts";
import type Keycloak from "keycloak-js";
import type React from "react";
import AppEditActions from "./AppEditActions.tsx";
import AppEditBasicInfo from "./AppEditBasicInfo.tsx";
import AppEditBreadcrumb from "./AppEditBreadcrumb.tsx";
import AppEditCategorization from "./AppEditCategorization.tsx";
import AppEditFilesSection from "./AppEditFilesSection.tsx";
import type { UploadSuccessResult } from "./AppEditFileUpload.tsx";
import AppEditTokenManager from "./AppEditTokenManager.tsx";

const AppEditForm: React.FC<{
  project: ProjectDetails;
  appMetadata: ProjectEditFormData;
  slug: string;
  keycloak: Keycloak;
  previewedFile: string | null;
  mainExecutable?: string;
  onPreviewFile: (filePath: string) => void;
  onSetIcon: (filePath: string) => void;
  onDeleteFile: (filePath: string) => void;
  onSetMainExecutable: (filePath: string) => void;
  onUploadSuccess: (result: UploadSuccessResult) => void;
  onFormChange: (changes: Partial<ProjectEditFormData>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onDeleteApplication: () => void;
}> = ({
  project,
  appMetadata,
  slug,
  keycloak,
  previewedFile,
  mainExecutable,
  onPreviewFile,
  onSetIcon,
  onDeleteFile,
  onSetMainExecutable,
  onUploadSuccess,
  onFormChange,
  onSubmit,
  onDeleteApplication,
}) => {
  return (
    <>
      <AppEditBreadcrumb project={project} />
      <h1 className="text-3xl font-bold mb-6">
        Editing {project.slug}/rev{project.version.revision}
      </h1>
      <div className="space-y-8">
        <form className="space-y-8" onSubmit={onSubmit}>
          <AppEditActions
            onClickDeleteApplication={onDeleteApplication}
            workInProgress={
              appMetadata.development_status === "work_in_progress"
            }
            onWorkInProgressChange={(workInProgress) =>
              onFormChange({
                development_status: workInProgress
                  ? "work_in_progress"
                  : "stable",
              })
            }
          />
          <AppEditBasicInfo form={appMetadata} onChange={onFormChange} />
          <AppEditCategorization form={appMetadata} onChange={onFormChange} />
          <AppEditFilesSection
            project={project}
            appMetadata={appMetadata}
            slug={slug}
            keycloak={keycloak}
            mainExecutable={mainExecutable}
            onPreviewFile={onPreviewFile}
            onSetIcon={onSetIcon}
            onDeleteFile={onDeleteFile}
            onSetMainExecutable={onSetMainExecutable}
            onUploadSuccess={onUploadSuccess}
          />
          <AppCodePreview
            project={project}
            isDraft={true}
            keycloak={keycloak}
            previewedFile={previewedFile}
            showFileList={false}
          />
        </form>
        <AppEditTokenManager slug={slug} keycloak={keycloak} />
      </div>
    </>
  );
};

export default AppEditForm;
