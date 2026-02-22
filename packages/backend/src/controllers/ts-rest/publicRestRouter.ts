import { initServer } from "@ts-rest/express";
import {
  publicFilesContracts,
  publicOtherContracts,
  publicProjectContracts,
  publicReportContracts,
  publicRestContracts,
} from "@badgehub/shared/contracts/publicRestContracts";
import { BadgeHubData } from "#domain/BadgeHubData";
import { PostgreSQLBadgeHubMetadata } from "#db/PostgreSQLBadgeHubMetadata";
import { PostgreSQLBadgeHubFiles } from "#db/PostgreSQLBadgeHubFiles";
import { noContent, nok, ok } from "#controllers/ts-rest/httpResponses";
import { Readable } from "node:stream";
import type { ProjectLatestRevisions } from "@badgehub/shared/domain/readModels/project/ProjectRevision";

const createFilesRouter = (badgeHubData: BadgeHubData) => {
  const filesRouter: any = {
    getLatestPublishedFile: async ({ params: { slug, filePath }, res }) => {
      const file = await badgeHubData.getFileContents(slug, "latest", filePath);
      if (!file) {
        return nok(404, `No app with slug '${slug}' found`);
      }
      const data = Readable.from(file);
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filePath}"`
      );
      return ok(data);
    },
    getFileForRevision: async ({
      params: { slug, revision, filePath },
      res,
    }) => {
      const file = await badgeHubData.getFileContents(slug, revision, filePath);
      if (!file) {
        return nok(
          404,
          `No app with slug '${slug}' and revision '${revision}' found`
        );
      }
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filePath}"`
      );
      // Enable public caching for immutable revisioned files (1 year)
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      const data = Readable.from(file);
      return ok(data);
    },
  };
  return filesRouter;
};

const createProjectRouter = (badgeHubData: BadgeHubData) => {
  const projectRouter: any = {
    getProject: async ({ params: { slug } }) => {
      const details = await badgeHubData.getProject(slug, "latest");
      if (!details) {
        return nok(404, `No public app with slug '${slug}' found`);
      }
      return ok(details);
    },
    getProjectSummaries: async ({
      query: {
        pageStart,
        pageLength,
        badge,
        category,
        search,
        slugs: projectSlugsString,
        userId,
        orderBy,
      },
    }) => {
      const projectSlugs = projectSlugsString?.split(",") || [];
      const data = await badgeHubData.getProjectSummaries(
        {
          slugs: projectSlugs,
          pageStart,
          pageLength,
          badge,
          category,
          search,
          userId,
          orderBy: orderBy ?? "published_at",
        },
        "latest"
      );
      return ok(data);
    },
    getProjectLatestRevisions: async ({ query, res }) => {
      const slugs = (query.slugs && query.slugs?.split(",")) || undefined;
      const data = await badgeHubData.getProjectSummaries(
        { slugs: slugs, orderBy: "published_at" },
        "latest"
      );
      // TODO optimize this
      const projectRevisionMap: ProjectLatestRevisions = data.map((p) => ({
        slug: p.slug,
        revision: p.revision,
      }));
      res.setHeader("Cache-Control", "max-age=10");
      return ok(projectRevisionMap);
    },
    getProjectLatestRevision: async ({ params: { slug }, res }) => {
      // TODO optimize this
      const projectDetails = await badgeHubData.getProject(slug, "latest");
      if (projectDetails?.latest_revision == undefined) {
        return nok(404, `No published app with slug '${slug}' found`);
      }
      res.setHeader("Cache-Control", "max-age=10");
      return ok(projectDetails?.latest_revision);
    },
    getProjectForRevision: async ({ params: { slug, revision }, res }) => {
      const details = await badgeHubData.getProject(slug, revision);
      if (!details) {
        return nok(
          404,
          `No public app with slug [${slug}] and revision [${revision}] found`
        );
      }
      // Enable public caching for immutable revisioned files (1 year)
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      return ok(details);
    },
  };
  return projectRouter;
};

const createPublicOtherRouter = (badgeHubData: BadgeHubData) => {
  const otherRouter: any = {
    getBadges: async () => {
      const data = await badgeHubData.getBadges();
      return ok(data);
    },
    getCategories: async () => {
      const data = await badgeHubData.getCategories();
      return ok(data);
    },
    ping: async ({ query: { id, mac } }) => {
      if (id) {
        await badgeHubData.registerBadge(id, mac);
      }
      return ok("pong");
    },
    getStats: async () => {
      const data = await badgeHubData.getStats();
      return ok(data);
    },
  };
  return otherRouter;
};

const createReportRouter = (badgeHubData: BadgeHubData) => {
  const reportRouter: any = {
    reportInstall: async ({ params, query }) => {
      await badgeHubData.reportInstall(params.slug, params.revision, query);
      return noContent();
    },
    reportLaunch: async ({ params, query }) => {
      await badgeHubData.reportLaunch(params.slug, params.revision, query);
      return noContent();
    },
    reportCrash: async ({ params, query, body }) => {
      await badgeHubData.reportCrash(params.slug, params.revision, query, body);
      return noContent();
    },
  };
  return reportRouter;
};

export const createPublicRestRouter = (
  badgeHubData: BadgeHubData = new BadgeHubData(
    new PostgreSQLBadgeHubMetadata(),
    new PostgreSQLBadgeHubFiles()
  )
) => {
  return initServer().router(publicRestContracts, {
    ...createProjectRouter(badgeHubData),
    ...createFilesRouter(badgeHubData),
    ...createPublicOtherRouter(badgeHubData),
    ...createReportRouter(badgeHubData),
  } as any);
};
