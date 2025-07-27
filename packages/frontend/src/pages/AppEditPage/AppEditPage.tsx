import React, { useEffect, useState } from "react";
import { tsRestClient as defaultTsRestClient } from "../../api/tsRestClient.ts";
import Header from "@sharedComponents/Header.tsx";
import Footer from "@sharedComponents/Footer.tsx";
import AppEditBreadcrumb from "./AppEditBreadcrumb.tsx";
import AppEditBasicInfo from "./AppEditBasicInfo.tsx";
import AppEditCategorization from "./AppEditCategorization.tsx";
import AppEditActions from "./AppEditActions.tsx";
import AppEditFileUpload from "./AppEditFileUpload";
import AppEditFilePreview from "./AppEditFilePreview";
import { ProjectDetails } from "@shared/domain/readModels/project/ProjectDetails.ts";
import { ProjectEditFormData } from "@pages/AppEditPage/ProjectEditFormData.ts";
import { useSession } from "@sharedComponents/keycloakSession/SessionContext.tsx";
import {
  AppMetadataJSON,
  IconSize,
} from "@shared/domain/readModels/project/AppMetadataJSON.ts";
import { useNavigate } from "react-router-dom";

const AppEditPage: React.FC<{
  tsRestClient?: typeof defaultTsRestClient;
  slug: string;
}> = ({ tsRestClient = defaultTsRestClient, slug }) => {
  const [project, setProject] = useState<
    (ProjectDetails & { stale?: true }) | null
  >(null);
  const [loading, setLoading] = useState(true);
  const [appMetadata, setAppMetadata] = useState<
    ProjectEditFormData | undefined
  >(undefined);
  const { user, keycloak } = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (project && !project.stale) return;
    let mounted = true;
    setLoading(true);
    (async () => {
      await keycloak?.updateToken(30);
      const res = await tsRestClient.getDraftProject({
        headers: { authorization: `Bearer ${keycloak?.token}` },
        params: { slug },
      });
      if (mounted && res.status === 200) {
        const project = res.body;
        setProject(project);
        const appMetadata = project.version.app_metadata;
        setAppMetadata(appMetadata);
      }
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, [keycloak, project, slug, tsRestClient, keycloak?.token]);

  const handleFormChange = (changes: Partial<ProjectEditFormData>) => {
    setAppMetadata((prev) => ({ ...prev, ...changes }) as ProjectEditFormData);
  };

  const handleDeleteFile = async (filePath: string) => {
    if (!keycloak?.token) return;
    await tsRestClient.deleteDraftFile({
      headers: { authorization: `Bearer ${keycloak?.token}` },
      params: { slug, filePath },
    });
    setProject(null); // Refresh project data after deletion
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appMetadata) return;
    await tsRestClient.changeDraftAppMetadata({
      headers: { authorization: `Bearer ${keycloak?.token}` },
      params: { slug },
      body: appMetadata,
    });
    await tsRestClient.publishVersion({
      headers: { authorization: `Bearer ${keycloak?.token}` },
      params: { slug },
      body: undefined,
    });
    if (project) {
      setProject({
        ...project,
        stale: true,
        version: { ...project.version, app_metadata: appMetadata },
      });
    }
  };

  const handleDeleteApplication = async () => {
    const response = await tsRestClient.deleteProject({
      headers: { authorization: `Bearer ${keycloak?.token}` },
      params: { slug },
    });
    if (response.status >= 200 && response.status < 300) {
      navigate("/page/my-projects");
    }
  };

  const onSetIcon = (size: IconSize, filePath: string) =>
    setAppMetadata((prev) => {
      return prev
        ? ({
            ...prev,
            icon_map: { ...prev?.icon_map, [size]: filePath },
          } as const satisfies AppMetadataJSON)
        : prev;
    });
  return (
    <div
      data-testid="app-edit-page"
      className="min-h-screen flex flex-col bg-gray-900 text-slate-200"
    >
      <Header />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow">
        {!loading && (!project || !appMetadata) ? (
          <div
            data-testid="app-edit-error"
            className="flex justify-center items-center h-64 text-red-400 bg-gray-900"
          >
            App not found.
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
            <form className="space-y-8" onSubmit={handleSubmit}>
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
                tsRestClient={tsRestClient}
                userToken={keycloak?.token}
                onUploadSuccess={() => setProject(null)}
              />
              <AppEditFilePreview
                tsRestClient={tsRestClient}
                user={user}
                project={project as ProjectDetails}
                onSetIcon={onSetIcon}
                iconFilePath={appMetadata?.icon_map?.["64x64"]}
                onDeleteFile={handleDeleteFile}
              />
              <AppEditActions
                onClickDeleteApplication={handleDeleteApplication}
              />
            </form>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default AppEditPage;
