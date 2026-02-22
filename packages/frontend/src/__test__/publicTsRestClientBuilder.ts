import { getProjectsQuerySchema } from "@shared/contracts/publicRestContracts.ts";
import { publicTsRestClient as defaultTsRestClient } from "@api/tsRestClient.ts";
import { DummyApp, dummyApps } from "@__test__/fixtures";

import { ProjectSummary } from "@shared/domain/readModels/project/ProjectSummaries.ts";

function parseProjectsQuery(rawQuery: unknown) {
  if (!rawQuery) return undefined;
  return getProjectsQuerySchema.parse(rawQuery);
}

const notFound = () => ({
  status: 404,
  body: { reason: "Not found" },
  headers: new Headers(),
});

export function tsRestClientWithApps(apps: DummyApp[] = dummyApps) {
  return {
    ...defaultTsRestClient,
    async getProject(args?: { params?: { slug?: string } }) {
      const slug = args?.params?.slug;
      const app = apps.find((a) => a.summary.slug === slug);
      if (!app) return notFound();
      return { status: 200, body: app.details, headers: new Headers() };
    },
    async getProjectSummaries(args?: { query?: unknown }) {
      const parsedQuery = parseProjectsQuery(args?.query);
      let filteredSummaries: ProjectSummary[] = apps.map(
        (dummyApp) => dummyApp.summary,
      );
      const badgeSlug = parsedQuery?.badge;
      const category = parsedQuery?.category;
      if (badgeSlug) {
        filteredSummaries = filteredSummaries.filter(
          (app) =>
            app.badges && app.badges.map((b) => b.toLowerCase()).includes(badgeSlug),
        );
      }
      if (category) {
        filteredSummaries = filteredSummaries.filter((app) =>
          app.categories?.includes(category),
        );
      }
      return { status: 200, body: filteredSummaries, headers: new Headers() };
    },
  } as typeof defaultTsRestClient;
}

export function tsRestClientWithError() {
  return {
    ...defaultTsRestClient,
    async getProject() {
      throw new Error("API error");
    },
  } as typeof defaultTsRestClient;
}
