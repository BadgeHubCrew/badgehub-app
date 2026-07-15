import { type DummyApp, dummyApps } from "@__test__/fixtures";
import type { ApiClient } from "@api/apiClient.ts";
import type { ProjectDetails } from "@shared/domain/readModels/project/ProjectDetails.ts";

export function privateApiClientBuilder(apps: DummyApp[] = dummyApps) {
  return {
    getUserDraftProjects: async () => ({
      status: 200,
      body: apps.map((a) => a.summary),
      headers: new Headers(),
    }),
    getDraftProject: async (args?: {
      params?: { slug?: string };
      slug?: string;
    }) => {
      const slug = args?.params?.slug ?? args?.slug;
      const app = apps.find((a) => a.summary.slug === slug);
      if (!app) {
        return {
          status: 404,
          body: { reason: "Not found" },
          headers: new Headers(),
        };
      }
      return { status: 200, body: app.details, headers: new Headers() };
    },
  } as unknown as ApiClient;
}

export function privateApiClientWithError() {
  return {
    getUserDraftProjects: async () => {
      throw new Error("API error");
    },
    getDraftProject: async () => ({
      status: 403,
      body: { reason: "Forbidden" },
      headers: new Headers(),
    }),
  } as unknown as ApiClient;
}

export function privateApiClientWithDraft(project: ProjectDetails) {
  return {
    getDraftProject: async () => ({
      status: 200,
      body: project,
      headers: new Headers(),
    }),
    changeDraftAppMetadata: async () => ({
      status: 204,
      body: undefined,
      headers: new Headers(),
    }),
    publishVersion: async () => ({
      status: 204,
      body: undefined,
      headers: new Headers(),
    }),
    deleteProject: async () => ({
      status: 204,
      body: undefined,
      headers: new Headers(),
    }),
    deleteDraftFile: async () => ({
      status: 204,
      body: undefined,
      headers: new Headers(),
    }),
    writeDraftFile: async () => ({
      status: 204,
      body: undefined,
      headers: new Headers(),
    }),
    setDraftIconFromFile: async () => ({
      status: 200,
      body: { iconPaths: {} },
      headers: new Headers(),
    }),
    createProjectAPIToken: async () => ({
      status: 200,
      body: { token: "test-token" },
      headers: new Headers(),
    }),
    getProjectApiTokenMetadata: async () => ({
      status: 404,
      body: { reason: "No Project API" },
      headers: new Headers(),
    }),
    revokeProjectAPIToken: async () => ({
      status: 204,
      body: undefined,
      headers: new Headers(),
    }),
  } as unknown as ApiClient;
}

export function privateApiClientUnauthorized() {
  return {
    getDraftProject: async () => ({
      status: 403,
      body: { reason: "Forbidden" },
      headers: new Headers(),
    }),
  } as unknown as ApiClient;
}
