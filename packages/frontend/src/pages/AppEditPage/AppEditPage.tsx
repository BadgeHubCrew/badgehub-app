import React, { useEffect, useState } from "react";
import { getFreshAuthorizedTsRestClient } from "@api/tsRestClient.ts";
import Header from "@sharedComponents/Header.tsx";
import Footer from "@sharedComponents/Footer.tsx";
import AppEditBreadcrumb from "./AppEditBreadcrumb.tsx";
import AppEditBasicInfo from "./AppEditBasicInfo.tsx";
import AppEditCategorization from "./AppEditCategorization.tsx";
import AppEditActions from "./AppEditActions.tsx";
import AppEditFileUpload from "./AppEditFileUpload";
import AppEditFileList from "./AppEditFileList.tsx";
import AppCodePreview from "@pages/AppDetailPage/AppCodePreview.tsx";
import { ProjectDetails } from "@shared/domain/readModels/project/ProjectDetails.ts";
import { ProjectEditFormData } from "@pages/AppEditPage/ProjectEditFormData.ts";
import { useSession } from "@sharedComponents/keycloakSession/SessionContext.tsx";
import {
  AppMetadataJSON,
  IconSize,
} from "@shared/domain/readModels/project/AppMetadataJSON.ts";
import { useNavigate } from "react-router-dom";
import { VariantJSON } from "@shared/domain/readModels/project/VariantJSON.ts";
import { assertDefined } from "@shared/util/assertions.ts";
import AppEditTokenManager from "./AppEditTokenManager.tsx";
import { useAsyncResource } from "@hooks/useAsyncResource.ts";
import {
  draftProjectErrorFromStatus,
  normalizeDraftProjectError,
} from "@utils/draftProjectErrors.ts";

function getAndEnsureApplication(newProjectData: ProjectDetails): VariantJSON {
  const application: VariantJSON =
    newProjectData.version.app_metadata.application?.[0] || {};
  newProjectData.version.app_metadata.application =
    newProjectData.version.app_metadata.application || [];
  newProjectData.version.app_metadata.application[0] = application;
  return application;
}

type PossiblyStaleProject = ProjectDetails & { stale?: true };
const AppEditPage: React.FC<{
  slug: string;
}> = ({ slug }) => {
  const [project, setProject] = useState<PossiblyStaleProject | null>(null);
  const [previewedFile, setPreviewedFile] = useState<string | null>(null);
  const { user, keycloak } = useSession();
  const navigate = useNavigate();

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

  const shouldFetchProject = Boolean(keycloak) && (!project || project.stale);
  const { data: fetchedProject, error: fetchError, loading } = useAsyncResource(
    async () => {
      if (!keycloak) {
        throw new Error("authentication");
      }
      try {
        const res = await (
          await getFreshAuthorizedTsRestClient(keycloak)
        ).getDraftProject({
          params: { slug },
        });
        if (res.status === 200) {
          return res.body;
        }
        throw new Error(draftProjectErrorFromStatus(res.status));
      } catch (error) {
        console.error("Failed to fetch draft project:", error);
        if (!keycloak.authenticated) {
          throw new Error("authentication");
        }
        throw new Error(normalizeDraftProjectError(error));
      }
    },
    [keycloak, project?.stale, slug],
    { enabled: shouldFetchProject }
  );

  useEffect(() => {
    if (fetchedProject) {
      setProject(fetchedProject);
    }
  }, [fetchedProject]);

  const error = !keycloak
    ? "authentication"
    : fetchError
      ? normalizeDraftProjectError(fetchError)
      : null;

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

  const onSetIcon = (size: IconSize, filePath: string) =>
    setAppMetadata((prev) => ({
      ...prev,
      icon_map: { ...prev.icon_map, [size]: filePath },
    }));

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
        {!loading && (!project || !appMetadata || error) ? (
          <div
            data-testid="app-edit-error"
            className="flex flex-col justify-center items-center h-64 text-center bg-gray-900"
          >
            {error === "authentication" ? (
              <>
                <div className="text-yellow-400 text-xl mb-4">
                  Authentication Required
                </div>
                <div className="text-slate-400 mb-4">
                  You need to log in to edit this project.
                </div>
                <button
                  onClick={() => keycloak?.login()}
                  className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors"
                >
                  Log In
                </button>
              </>
            ) : error === "not_found" ? (
              <div className="text-red-400">App not found.</div>
            ) : error === "unknown" ? (
              <div className="text-red-400">
                Failed to load project. Please try again.
              </div>
            ) : (
              <div className="text-red-400">App not found.</div>
            )}
          </div>
        ) : loading ? (
          <div className="flex justify-center items-center h-64 text-slate-400 bg-gray-900">
            Loading...
          </div>
        ) : (
          <>
            <AppEditBreadcrumb project={project as ProjectDetails} />
            <h1 className="text-3xl font-bold text-slate-100 mb-6">
              Editing {project!.slug}/rev{project!.version.revision}
            </h1>
            <div className="space-y-8">
              <form className="space-y-8" onSubmit={handleSubmit}>
                <AppEditActions
                  onClickDeleteApplication={handleDeleteApplication}
                />
                <AppEditBasicInfo
                  form={appMetadata as ProjectEditFormData}
                  onChange={handleFormChange}
                />
                <AppEditCategorization
                  form={appMetadata as ProjectEditFormData}
                  onChange={handleFormChange}
                />
                <AppEditFileUpload
                  slug={slug}
                  keycloak={keycloak}
                  onUploadSuccess={updateDraftFiles}
                />
                {keycloak && (
                  <AppEditFileList
                    user={user}
                    project={project as ProjectDetails}
                    onSetIcon={onSetIcon}
                    iconFilePath={appMetadata?.icon_map?.["64x64"]}
                    onDeleteFile={handleDeleteFile}
                    mainExecutable={
                      mainExecutable /*TODO multi variant support in frontend*/
                    }
                    onSetMainExecutable={onSetMainExecutable}
                    onPreview={handlePreviewFile}
                    slug={slug}
                    keycloak={keycloak}
                  />
                )}
                {keycloak && (
                  <AppCodePreview
                    project={project as ProjectDetails}
                    isDraft={true}
                    keycloak={keycloak}
                    previewedFile={previewedFile}
                    showFileList={false}
                  />
                )}
              </form>
              {keycloak && (
                <AppEditTokenManager slug={slug} keycloak={keycloak} />
              )}
            </div>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default AppEditPage;
