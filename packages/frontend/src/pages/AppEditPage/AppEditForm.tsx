import AppCodePreview from "@pages/AppDetailPage/AppCodePreview.tsx";
import type { ProjectEditFormData } from "@pages/AppEditPage/ProjectEditFormData.ts";
import type { ProjectDetails } from "@shared/domain/readModels/project/ProjectDetails.ts";
import type { MpkArchiveFile } from "@sharedComponents/MpkExplorer.tsx";
import type Keycloak from "keycloak-js";
import type React from "react";
import AppEditActions from "./AppEditActions.tsx";
import AppEditBasicInfo from "./AppEditBasicInfo.tsx";
import AppEditBreadcrumb from "./AppEditBreadcrumb.tsx";
import AppEditCategorization from "./AppEditCategorization.tsx";
import AppEditFilesSection from "./AppEditFilesSection.tsx";
import type { UploadSuccessResult } from "./AppEditFileUpload.tsx";
import AppEditTokenManager from "./AppEditTokenManager.tsx";
import AppEditToolbar from "./AppEditToolbar.tsx";

const AppEditForm: React.FC<{
  project: ProjectDetails;
  appMetadata: ProjectEditFormData;
  slug: string;
  keycloak: Keycloak;
  previewedFile: string | null;
  previewedArchiveFile: MpkArchiveFile | null;
  mainExecutable?: string;
  onPreviewFile: (filePath: string) => void;
  onPreviewArchive: (file: MpkArchiveFile) => void;
  onSetIcon: (filePath: string) => void;
  onDeleteFile: (filePath: string) => void;
  onSetMainExecutable: (filePath: string) => void;
  onUploadSuccess: (result: UploadSuccessResult) => void;
  onFormChange: (changes: Partial<ProjectEditFormData>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onFlushSave: () => void;
  onDeleteApplication: () => void;
  onTransferOwner: (newOwnerId: string) => Promise<boolean> | boolean;
  isPublishing: boolean;
  publishedMessage: string | null;
  isSaving: boolean;
  hasUnsavedChanges: boolean;
  saveError: string | null;
  onSaveDraft: () => void;
  onRetrySave: () => void;
}> = ({
  project,
  appMetadata,
  slug,
  keycloak,
  previewedFile,
  previewedArchiveFile,
  mainExecutable,
  onPreviewFile,
  onPreviewArchive,
  onSetIcon,
  onDeleteFile,
  onSetMainExecutable,
  onUploadSuccess,
  onFormChange,
  onSubmit,
  onFlushSave,
  onDeleteApplication,
  onTransferOwner,
  isPublishing,
  publishedMessage,
  isSaving,
  hasUnsavedChanges,
  saveError,
  onSaveDraft,
  onRetrySave,
}) => {
  return (
    <>
      <AppEditBreadcrumb project={project} />
      <AppEditToolbar
        slug={project.slug}
        revision={project.version.revision}
        isSaving={isSaving}
        hasUnsavedChanges={hasUnsavedChanges}
        saveError={saveError}
        onSaveDraft={onSaveDraft}
        onRetrySave={onRetrySave}
        isPublishing={isPublishing}
        publishedMessage={publishedMessage}
      />
      <div className="space-y-8">
        <form
          id="app-edit-form"
          className="space-y-8"
          onSubmit={onSubmit}
          onBlur={onFlushSave}
        >
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
            onPreviewArchive={onPreviewArchive}
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
            previewedArchiveFile={previewedArchiveFile}
            showFileList={false}
          />
        </form>
        <AppEditTokenManager
          slug={slug}
          keycloak={keycloak}
          onTransferOwner={onTransferOwner}
          projectOwnerId={project.idp_user_id}
        />
      </div>
    </>
  );
};

export default AppEditForm;
