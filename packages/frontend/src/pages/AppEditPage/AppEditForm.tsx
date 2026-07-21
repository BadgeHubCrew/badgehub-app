import AppCodePreview from "@pages/AppDetailPage/AppCodePreview.tsx";
import type { ProjectEditFormData } from "@pages/AppEditPage/ProjectEditFormData.ts";
import type { ProjectDetails } from "@shared/domain/readModels/project/ProjectDetails.ts";
import type { User } from "@sharedComponents/keycloakSession/SessionContext.tsx";
import type Keycloak from "keycloak-js";
import type React from "react";
import AppEditActions from "./AppEditActions.tsx";
import AppEditBasicInfo from "./AppEditBasicInfo.tsx";
import AppEditBreadcrumb from "./AppEditBreadcrumb.tsx";
import AppEditCategorization from "./AppEditCategorization.tsx";
import AppEditFileList from "./AppEditFileList.tsx";
import AppEditFileUpload from "./AppEditFileUpload.tsx";
import AppEditTokenManager from "./AppEditTokenManager.tsx";

const AppEditForm: React.FC<{
  project: ProjectDetails;
  appMetadata: ProjectEditFormData;
  slug: string;
  user?: User;
  keycloak: Keycloak;
  previewedFile: string | null;
  mainExecutable?: string;
  onPreviewFile: (filePath: string) => void;
  onSetIcon: (filePath: string) => void;
  onDeleteFile: (filePath: string) => void;
  onSetMainExecutable: (filePath: string) => void;
  onUploadSuccess: (result: {
    metadataChanged?: boolean;
    firstValidExecutable?: string | null;
  }) => void;
  onFormChange: (changes: Partial<ProjectEditFormData>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onDeleteApplication: () => void;
}> = ({
  project,
  appMetadata,
  slug,
  user,
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
          <AppEditFileUpload
            slug={slug}
            keycloak={keycloak}
            onUploadSuccess={onUploadSuccess}
          />
          <AppEditFileList
            user={user}
            project={project}
            onSetIcon={onSetIcon}
            iconFilePath={appMetadata?.icon_map?.["64x64"]}
            onDeleteFile={onDeleteFile}
            mainExecutable={mainExecutable}
            onSetMainExecutable={onSetMainExecutable}
            onPreview={onPreviewFile}
            slug={slug}
            keycloak={keycloak}
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
