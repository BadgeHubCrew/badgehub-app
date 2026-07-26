import { type DummyApp, dummyApps } from "@__test__/fixtures";
import type { publicApiClient as defaultApiClient } from "@api/apiClient.ts";
import { getProjectsQuerySchema } from "@shared/contracts/publicRestContracts.ts";
import type { ProjectSummary } from "@shared/domain/readModels/project/ProjectSummaries.ts";

function parseProjectsQuery(rawQuery: unknown) {
  if (!rawQuery) return undefined;
  return getProjectsQuerySchema.parse(rawQuery);
}

/**
 * Lightweight mock API client for frontend unit tests (no network).
 */
export function apiClientWithApps(apps: DummyApp[] = dummyApps) {
  return {
    getProject: async (args?: {
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
    getProjectForRevision: async (args?: {
      params?: { slug?: string; revision?: number };
      slug?: string;
      revision?: number;
    }) => {
      const slug = args?.params?.slug ?? args?.slug;
      const revision = args?.params?.revision ?? args?.revision;
      const app = apps.find((a) => a.summary.slug === slug) as
        | (DummyApp & {
            historicalByRevision?: Record<number, DummyApp["details"]>;
          })
        | undefined;
      if (!app) {
        return {
          status: 404,
          body: { reason: "Not found" },
          headers: new Headers(),
        };
      }
      if (revision != null && app.historicalByRevision?.[revision]) {
        return {
          status: 200,
          body: app.historicalByRevision[revision],
          headers: new Headers(),
        };
      }
      if (revision != null && app.details.version.revision !== revision) {
        return {
          status: 404,
          body: { reason: "Not found" },
          headers: new Headers(),
        };
      }
      return {
        status: 200,
        body: app.details,
        headers: new Headers(),
      };
    },
    getProjectVersions: async (args?: {
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
      const withVersions = app as DummyApp & {
        versions?: Array<{
          version?: string;
          latestRevision: number;
          latestPublishDate: string;
        }>;
      };
      if (withVersions.versions) {
        return {
          status: 200,
          body: withVersions.versions,
          headers: new Headers(),
        };
      }
      const version = app.details.version;
      return {
        status: 200,
        body: [
          {
            version: version.app_metadata.version,
            latestRevision: version.revision,
            latestPublishDate: version.published_at ?? new Date().toISOString(),
          },
        ],
        headers: new Headers(),
      };
    },
    reportRatingFromUser: async () => ({
      status: 204,
      body: undefined,
      headers: new Headers(),
    }),
    getRatingFromUser: async () => ({
      status: 200,
      body: null,
      headers: new Headers(),
    }),
    getProjectSummaries: async (args?: {
      query?: unknown;
      badge?: string;
      category?: string;
    }) => {
      const parsedQuery = parseProjectsQuery(args?.query ?? args);
      let filteredSummaries: ProjectSummary[] = apps.map((a) => a.summary);
      const badgeSlug = parsedQuery?.badge ?? args?.badge;
      const category = parsedQuery?.category ?? args?.category;
      const developmentStatus = parsedQuery?.developmentStatus;
      if (badgeSlug) {
        filteredSummaries = filteredSummaries.filter((app) =>
          app.badges?.map((b) => b.toLowerCase()).includes(badgeSlug)
        );
      }
      if (category) {
        filteredSummaries = filteredSummaries.filter((app) =>
          app.categories?.includes(category)
        );
      }
      if (developmentStatus) {
        filteredSummaries = filteredSummaries.filter(
          (app) => app.development_status === developmentStatus
        );
      }
      return {
        status: 200,
        body: filteredSummaries,
        headers: new Headers(),
      };
    },
  } as unknown as typeof defaultApiClient;
}

export function apiClientWithError() {
  const fail = async () => ({
    status: 500,
    body: { reason: "API error" },
    headers: new Headers(),
  });
  return {
    getProject: fail,
    getProjectForRevision: fail,
    getProjectVersions: fail,
    getProjectSummaries: fail,
  } as unknown as typeof defaultApiClient;
}
