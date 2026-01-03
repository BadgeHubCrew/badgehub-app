import React from "react";
import AppEditBreadcrumb from "./AppEditBreadcrumb.tsx";
import AppEditBasicInfo from "./AppEditBasicInfo.tsx";
import AppEditCategorization from "./AppEditCategorization.tsx";
import AppEditActions from "./AppEditActions.tsx";
import AppEditFileUpload from "./AppEditFileUpload.tsx";
import AppEditFileList from "./AppEditFileList.tsx";
import AppEditTokenManager from "./AppEditTokenManager.tsx";
import AppCodePreview from "@pages/AppDetailPage/AppCodePreview.tsx";
import { ProjectDetails } from "@shared/domain/readModels/project/ProjectDetails.ts";
import { ProjectEditFormData } from "@pages/AppEditPage/ProjectEditFormData.ts";
import { IconSize } from "@shared/domain/readModels/project/AppMetadataJSON.ts";
import { User } from "@sharedComponents/keycloakSession/SessionContext.tsx";
import Keycloak from "keycloak-js";

const AppEditForm: React.FC<{
  project: ProjectDetails;
  appMetadata: ProjectEditFormData;
  slug: string;
  user?: User;
  keycloak: Keycloak;
  previewedFile: string | null;
  mainExecutable?: string;
  onPreviewFile: (filePath: string) => void;
  onSetIcon: (size: IconSize, filePath: string) => void;
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
      <h1 className="text-3xl font-bold text-slate-100 mb-6">
        Editing {project.slug}/rev{project.version.revision}
      </h1>
      <div className="space-y-8">
        <form className="space-y-8" onSubmit={onSubmit}>
          <AppEditActions onClickDeleteApplication={onDeleteApplication} />
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
