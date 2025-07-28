import { initServer } from "@ts-rest/express";
import {
  publicFilesContracts,
  publicOtherContracts,
  publicProjectContracts,
  publicRestContracts,
} from "@shared/contracts/publicRestContracts";
import { BadgeHubData } from "@domain/BadgeHubData";
import { PostgreSQLBadgeHubMetadata } from "@db/PostgreSQLBadgeHubMetadata";
import { PostgreSQLBadgeHubFiles } from "@db/PostgreSQLBadgeHubFiles";
import { nok, ok } from "@controllers/ts-rest/httpResponses";
import { Readable } from "node:stream";
import { RouterImplementation } from "@ts-rest/express/src/lib/types";
import { z } from "zod";

const createFilesRouter = (badgeHubData: BadgeHubData) => {
  const filesRouter: RouterImplementation<typeof publicFilesContracts> = {
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
  const projectRouter: RouterImplementation<typeof publicProjectContracts> = {
    getProject: async ({ params: { slug } }) => {
      const details = await badgeHubData.getProject(slug, "latest");
      if (!details) {
        return nok(404, `No public app with slug '${slug}' found`);
      }
      return ok(details);
    },
    getProjects: async ({
      query: {
        pageStart,
        pageLength,
        badge,
        category,
        search,
        projectSlug,
        userId,
      },
    }) => {
      const data = await badgeHubData.getProjectSummaries(
        {
          projectSlug,
          pageStart,
          pageLength,
          badge,
          category,
          search,
          userId,
        },
        "latest"
      );
      return ok(data);
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
  const otherRouter: RouterImplementation<typeof publicOtherContracts> = {
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
  };
  return otherRouter;
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
  } as any);
};
