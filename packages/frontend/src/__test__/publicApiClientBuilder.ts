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
    getProjectSummaries: async (args?: {
      query?: unknown;
      badge?: string;
      category?: string;
    }) => {
      const parsedQuery = parseProjectsQuery(args?.query ?? args);
      let filteredSummaries: ProjectSummary[] = apps.map((a) => a.summary);
      const badgeSlug = parsedQuery?.badge ?? args?.badge;
      const category = parsedQuery?.category ?? args?.category;
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
    getProjectSummaries: fail,
  } as unknown as typeof defaultApiClient;
}
