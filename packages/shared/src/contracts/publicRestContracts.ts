import { initContract } from "@ts-rest/core";
import { z } from "zod/v3";
import { detailedProjectSchema } from "@badgehub/shared/domain/readModels/project/ProjectDetails";
import { categoryNameSchema } from "@badgehub/shared/domain/readModels/project/Category";
import { badgeSlugSchema } from "@badgehub/shared/domain/readModels/Badge";
import { projectLatestRevisionsSchema } from "@badgehub/shared/domain/readModels/project/ProjectRevision";
import { badgeHubStatsSchema } from "@badgehub/shared/domain/readModels/BadgeHubStats";
import { projectSummarySchema } from "@badgehub/shared/domain/readModels/project/ProjectSummaries";
import { NO_BODY_SCHEMA } from "@badgehub/shared/contracts/tsRestNoBodyPatch";

const c = initContract();

const errorResponseSchema = z.object({ reason: z.string() });
export const getProjectsQuerySchema = z.object({
  pageStart: z.coerce.number().optional(),
  pageLength: z.coerce.number().optional(),
  badge: badgeSlugSchema.optional(),
  category: categoryNameSchema.optional(),
  slugs: z
    .string()
    .describe("optional comma separated list of project slugs to filter on")
    .optional(),
  userId: z.string().optional(),
  search: z
    .string()
    .max(50, "the search string should not be longer than 50 characters long")
    .optional()
    .describe("allow a text search over the apps' slug, name and descriptions"),
  orderBy: z.enum(["published_at", "installs"]).optional(),
});

const projectRevisionParams = z.object({
  slug: z.string(),
  revision: z.coerce.number(),
});
export const publicProjectContracts = c.router({
  getProject: {
    method: "GET",
    path: `/projects/:slug`,
    pathParams: z.object({ slug: z.string() }),
    responses: {
      200: detailedProjectSchema,
      404: errorResponseSchema,
    },
    summary: "Get (Latest) Project Details by Slug",
  },
  getProjectSummaries: {
    method: "GET",
    path: `/project-summaries`,
    query: getProjectsQuerySchema,
    responses: {
      200: z.array(projectSummarySchema),
    },
    summary: "Get all Projects",
  },
  getProjectLatestRevisions: {
    method: "GET",
    path: `/project-latest-revisions`,
    query: z.object({
      slugs: z.string().optional(),
    }),
    responses: {
      200: projectLatestRevisionsSchema,
    },
    summary:
      "Get the latest revisions for a list of project slugs. Allows for quickly checking for updates.",
  },
  getProjectLatestRevision: {
    method: "GET",
    path: `/project-latest-revisions/:slug`,
    pathParams: z.object({ slug: z.string() }),
    responses: { 200: z.number() },
    summary:
      "Get the latest revision number for a project. Allows for quickly checking for updates.",
  },
  getProjectForRevision: {
    method: "GET",
    path: `/projects/:slug/rev:revision`,
    pathParams: projectRevisionParams,
    responses: {
      200: detailedProjectSchema,
      404: errorResponseSchema,
    },
    summary:
      "Get project details for a specific published revision of the project",
  },
});

export const publicFilesContracts = c.router({
  getLatestPublishedFile: {
    method: "GET",
    path: `/projects/:slug/latest/files/:filePath`,
    pathParams: z.object({
      slug: z.string(),
      filePath: z.string(),
    }),
    responses: {
      200: z.unknown().describe("ReadableStream"), // ReadableStream
      404: errorResponseSchema,
    },
    summary: "Get the latest published revision of a file in the project",
  },
  getFileForRevision: {
    method: "GET",
    path: `/projects/:slug/rev:revision/files/:filePath`,
    pathParams: projectRevisionParams.extend({
      filePath: z.string(),
    }),
    responses: {
      200: z.unknown().describe("ReadableStream"), // ReadableStream,
      404: errorResponseSchema,
    },
    summary: "Get a file for a specific revision of the project",
  },
});

export const badgeIdentifiersSchema = z.object({
  mac: z.string().describe("the mac address of the badge").optional(),
  id: z.string().describe("the id of the badge").optional(),
});

export const publicOtherContracts = c.router({
  getCategories: {
    method: "GET",
    path: `/categories`,
    responses: {
      200: z.array(categoryNameSchema),
    },
  },
  getBadges: {
    method: "GET",
    path: `/badges`,
    responses: {
      200: z.array(badgeSlugSchema),
    },
  },
  ping: {
    method: "GET",
    path: `/ping`,
    query: badgeIdentifiersSchema,
    responses: {
      200: z.string().describe("Ping the server to check if it's alive"),
    },
  },
  getStats: {
    method: "GET",
    path: `/stats`,
    responses: {
      200: badgeHubStatsSchema,
    },
  },
});

const crashReportBodySchema = z.object({
  reason: z
    .string()
    .describe("An optional reason for the app crash.")
    .optional(),
});

export const publicReportContracts = c.router({
  reportInstall: {
    method: "POST",
    path: "/projects/:slug/rev:revision/report/install",
    pathParams: projectRevisionParams,
    query: badgeIdentifiersSchema,
    body: NO_BODY_SCHEMA, // Needed for ts-rest
    responses: {
      204: z.void(),
      404: errorResponseSchema,
    },
    summary: "Report an installation of an app.",
  },
  reportLaunch: {
    method: "POST",
    path: "/projects/:slug/rev:revision/report/launch",
    pathParams: projectRevisionParams,
    query: badgeIdentifiersSchema,
    body: NO_BODY_SCHEMA, // Needed for ts-rest
    responses: {
      204: z.void(),
      404: errorResponseSchema,
    },
    summary: "Report a launch of an app.",
  },
  reportCrash: {
    method: "POST",
    path: "/projects/:slug/rev:revision/report/crash",
    pathParams: projectRevisionParams,
    query: badgeIdentifiersSchema,
    body: crashReportBodySchema,
    responses: {
      204: z.void(),
      404: errorResponseSchema,
    },
    summary: "Report a crash of an app.",
  },
});

export const publicRestContracts = c.router({
  ...publicProjectContracts,
  ...publicFilesContracts,
  ...publicOtherContracts,
  ...publicReportContracts,
});
