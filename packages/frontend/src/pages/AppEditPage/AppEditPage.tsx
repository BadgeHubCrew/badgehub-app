import React, { useState } from "react";
import { getFreshAuthorizedTsRestClient } from "@api/tsRestClient.ts";
import Header from "@sharedComponents/Header.tsx";
import Footer from "@sharedComponents/Footer.tsx";
import AppEditForm from "./AppEditForm.tsx";
import AppEditStateView from "./AppEditStateView.tsx";
import { ProjectDetails } from "@shared/domain/readModels/project/ProjectDetails.ts";
import { ProjectEditFormData } from "@pages/AppEditPage/ProjectEditFormData.ts";
import { useSession } from "@sharedComponents/keycloakSession/SessionContext.tsx";
import { AppMetadataJSON } from "@shared/domain/readModels/project/AppMetadataJSON.ts";
import { useNavigate } from "react-router-dom";
import { VariantJSON } from "@shared/domain/readModels/project/VariantJSON.ts";
import { assertDefined } from "@shared/util/assertions.ts";
import { useDraftProject, PossiblyStaleProject } from "@hooks/useDraftProject.ts";

function getAndEnsureApplication(newProjectData: ProjectDetails): VariantJSON {
  const application: VariantJSON =
    newProjectData.version.app_metadata.application?.[0] || {};
  newProjectData.version.app_metadata.application =
    newProjectData.version.app_metadata.application || [];
  newProjectData.version.app_metadata.application[0] = application;
  return application;
}

const AppEditPage: React.FC<{
  slug: string;
}> = ({ slug }) => {
  const [previewedFile, setPreviewedFile] = useState<string | null>(null);
  const { user, keycloak } = useSession();
  const navigate = useNavigate();
  const { project, setProject, loading, error } = useDraftProject(
    slug,
    keycloak
  );

  const setAppMetadata = (
    appMetadataOrFn:
      | AppMetadataJSON
      | ((prev: AppMetadataJSON) => AppMetadataJSON)
  ) => {
    setProject((currProject) => {
      if (!currProject) return null;
      const newAppMetadata =
        typeof appMetadataOrFn === "function"
          ? appMetadataOrFn(currProject.version.app_metadata)
          : appMetadataOrFn;
      return {
        ...currProject,
        version: {
          ...currProject.version,
          app_metadata: newAppMetadata,
        },
      };
    });
  };
  const appMetadata = project?.version.app_metadata;
  if (appMetadata) {
    appMetadata.author ??= user?.name;
  }

  const handleFormChange = (changes: Partial<ProjectEditFormData>) => {
    setAppMetadata((prev) => ({ ...prev, ...changes }) as ProjectEditFormData);
  };

  const updateDraftFiles = async (result: {
    metadataChanged?: boolean;
    firstValidExecutable?: string | null;
  }) => {
    assertDefined(keycloak);
    await keycloak.updateToken(30);
    if (result.metadataChanged) {
      // Full refresh if metadata.json was uploaded
      setProject(null);
      return;
    }
    const updatedDraftProject = await (
      await getFreshAuthorizedTsRestClient(keycloak)
    ).getDraftProject({
      params: { slug },
    });
    if (updatedDraftProject.status === 200 && project) {
      setProject((prevProject) => {
        if (!prevProject) return null;
        const newProjectData = {
          ...prevProject,
          version: {
            ...prevProject.version,
            files: updatedDraftProject.body.version.files,
          },
        };
        // If no main executable is set, and a valid one was uploaded, set it as default.
        const newMainExecutable =
          newProjectData.version.app_metadata.application?.[0]?.executable;

        if (!newMainExecutable && result.firstValidExecutable) {
          const application = getAndEnsureApplication(newProjectData);
          application.executable = result.firstValidExecutable;
        }
        return newProjectData;
      });
    } else {
      window.alert("File refresh after upload failed");
    }
  };

  const handleDeleteFile = async (filePath: string) => {
    assertDefined(keycloak);
    await (
      await getFreshAuthorizedTsRestClient(keycloak)
    ).deleteDraftFile({
      params: { slug, filePath },
    });
    setProject((p) => {
      if (!p) return null;
      const newFiles = p.version.files.filter((f) => f.full_path !== filePath);
      const newMetadata = { ...p.version.app_metadata };
      // If the deleted file was the main executable, unset it.
      const application = newMetadata.application?.[0];
      if (application && application?.executable === filePath) {
        application.executable = undefined;
      }
      return {
        ...p,
        version: { ...p.version, files: newFiles, app_metadata: newMetadata },
      };
    });
  };

  const mainExecutable = appMetadata?.application?.[0]?.executable;
  const setMainExecutable = (newMainExecutable: string) => {
    setProject((prev: PossiblyStaleProject | null) => {
      if (!prev) {
        return prev;
      }
      const application = getAndEnsureApplication(prev);
      application.executable = newMainExecutable;
      return { ...prev };
    });
  };
  const handleSubmit = async (e: React.FormEvent) => {
    assertDefined(keycloak);
    e.preventDefault();
    if (!appMetadata) return;

    try {
      const changeAppMetdataResult = await (
        await getFreshAuthorizedTsRestClient(keycloak)
      ).changeDraftAppMetadata({
        params: { slug },
        body: appMetadata,
      });
      if (changeAppMetdataResult.status !== 204) {
        console.error("changeDraftAppMetadata failed", changeAppMetdataResult);
        window.alert("Save failed");
        return;
      }
      const publishResult = await (
        await getFreshAuthorizedTsRestClient(keycloak)
      ).publishVersion({
        params: { slug },
        body: undefined,
      });
      if (publishResult.status !== 204) {
        console.error("publish failed", changeAppMetdataResult);
        window.alert("Publish failed");
        return;
      }
      if (project) {
        setProject({
          ...project,
          stale: true,
          version: { ...project.version, app_metadata: appMetadata },
        });
      }
    } catch (e) {
      console.error(e);
      window.alert("Something went wrong during Save & Publish.");
    }
  };

  const handleDeleteApplication = async () => {
    try {
      assertDefined(keycloak);
      const response = await (
        await getFreshAuthorizedTsRestClient(keycloak)
      ).deleteProject({
        params: { slug },
      });
      if (response.status !== 204) {
        console.error("publish failed", response);
        window.alert("Publish failed");
        return;
      }
      navigate("/page/my-projects");
    } catch (e) {
      console.error(e);
      window.alert("Something went wrong during Save & Publish.");
    }
  };

  const handleSetIcon = async (filePath: string) => {
    assertDefined(keycloak);
    try {
      await keycloak.updateToken(30);
      const client = await getFreshAuthorizedTsRestClient(keycloak);
      const setIconResult = await client.setDraftIconFromFile({
        params: { slug },
        body: { filePath, sizes: ["64x64"] },
      });
      if (setIconResult.status !== 200) {
        console.error("setDraftIconFromFile failed", setIconResult);
        window.alert("Setting icon failed");
        return;
      }
      const updatedDraftProject = await client.getDraftProject({
        params: { slug },
      });
      if (updatedDraftProject.status === 200) {
        setProject(updatedDraftProject.body);
        return;
      }
      setAppMetadata((prev) => ({
        ...prev,
        icon_map: { ...prev.icon_map, ...setIconResult.body.iconPaths },
      }));
    } catch (e) {
      console.error(e);
      window.alert("Something went wrong while setting the icon.");
    }
  };

  const onSetMainExecutable = (filePath: string) => setMainExecutable(filePath);

  const handlePreviewFile = (filePath: string) => {
    setPreviewedFile(filePath);
  };

  return (
    <div
      data-testid="app-edit-page"
      className="min-h-screen flex flex-col bg-gray-900 text-slate-200"
    >
      <Header />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow">
        <AppEditStateView
          loading={loading}
          error={
            error ??
            (!project || !appMetadata ? "not_found" : null)
          }
          onLogin={() => keycloak?.login()}
        >
          {project && appMetadata && keycloak && (
            <AppEditForm
              project={project as ProjectDetails}
              appMetadata={appMetadata as ProjectEditFormData}
              slug={slug}
              user={user}
              keycloak={keycloak}
              previewedFile={previewedFile}
              mainExecutable={mainExecutable}
              onPreviewFile={handlePreviewFile}
              onSetIcon={handleSetIcon}
              onDeleteFile={handleDeleteFile}
              onSetMainExecutable={onSetMainExecutable}
              onUploadSuccess={updateDraftFiles}
              onFormChange={handleFormChange}
              onSubmit={handleSubmit}
              onDeleteApplication={handleDeleteApplication}
            />
          )}
        </AppEditStateView>
      </main>
      <Footer />
    </div>
  );
};

export default AppEditPage;
