import { oc } from "@orpc/contract";
import { errorResponseSchema } from "@shared/contracts/errorSchemas";
import { badgeSlugSchema } from "@shared/domain/readModels/Badge";
import { badgeHubStatsSchema } from "@shared/domain/readModels/BadgeHubStats";
import { categoryNameSchema } from "@shared/domain/readModels/project/Category";
import { detailedProjectSchema } from "@shared/domain/readModels/project/ProjectDetails";
import { projectLatestRevisionsSchema } from "@shared/domain/readModels/project/ProjectRevision";
import { projectSummariesSchema } from "@shared/domain/readModels/project/ProjectSummaries";
import { z } from "zod";

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

export const badgeIdentifiersSchema = z.object({
  mac: z.string().describe("the mac address of the badge").optional(),
  id: z.string().describe("the id of the badge").optional(),
});

export const crashReportBodySchema = z.object({
  reason: z
    .string()
    .describe("An optional reason for the app crash.")
    .optional(),
});

export const categoryNamesSchema = z.array(categoryNameSchema);
export const badgeSlugsSchema = z.array(badgeSlugSchema);

const publicBase = oc.errors({
  NOT_FOUND: {
    status: 404,
    data: errorResponseSchema,
  },
});

export const publicRestContracts = {
  getProject: publicBase
    .route({
      method: "GET",
      path: "/projects/{slug}",
      summary: "Get (Latest) Project Details by Slug",
      tags: ["Public"],
      successStatus: 200,
    })
    .input(z.object({ slug: z.string() }))
    .output(detailedProjectSchema),

  getProjectSummaries: publicBase
    .route({
      method: "GET",
      path: "/project-summaries",
      summary: "Get all Projects",
      tags: ["Public"],
    })
    .input(getProjectsQuerySchema)
    .output(projectSummariesSchema),

  getProjectLatestRevisions: publicBase
    .route({
      method: "GET",
      path: "/project-latest-revisions",
      summary:
        "Get the latest revisions for a list of project slugs. Allows for quickly checking for updates.",
      tags: ["Public"],
    })
    .input(z.object({ slugs: z.string().optional() }))
    .output(projectLatestRevisionsSchema),

  getProjectLatestRevision: publicBase
    .route({
      method: "GET",
      path: "/project-latest-revisions/{slug}",
      summary:
        "Get the latest revision number for a project. Allows for quickly checking for updates.",
      tags: ["Public"],
    })
    .input(z.object({ slug: z.string() }))
    .output(z.number()),

  getProjectForRevision: publicBase
    .route({
      method: "GET",
      // Public URL stays /projects/{slug}/rev{N}; Express rewrites revN → revisions/N
      path: "/projects/{slug}/revisions/{revision}",
      summary:
        "Get project details for a specific published revision of the project",
      tags: ["Public"],
    })
    .input(
      z.object({
        slug: z.string(),
        revision: z.coerce.number(),
      })
    )
    .output(detailedProjectSchema),

  getLatestPublishedFile: publicBase
    .route({
      method: "GET",
      path: "/projects/{slug}/latest/files/{+filePath}",
      summary: "Get the latest published revision of a file in the project",
      tags: ["Public"],
      outputStructure: "detailed",
    })
    .input(z.object({ slug: z.string(), filePath: z.string() }))
    .output(
      z.object({
        headers: z.record(z.string(), z.string()).optional(),
        body: z.unknown().describe("File content"),
      })
    ),

  getFileForRevision: publicBase
    .route({
      method: "GET",
      path: "/projects/{slug}/revisions/{revision}/files/{+filePath}",
      summary: "Get a file for a specific revision of the project",
      tags: ["Public"],
      outputStructure: "detailed",
    })
    .input(
      z.object({
        slug: z.string(),
        revision: z.coerce.number(),
        filePath: z.string(),
      })
    )
    .output(
      z.object({
        headers: z.record(z.string(), z.string()).optional(),
        body: z.unknown().describe("ReadableStream"),
      })
    ),

  getCategories: publicBase
    .route({
      method: "GET",
      path: "/categories",
      tags: ["Public"],
    })
    .output(categoryNamesSchema),

  getBadges: publicBase
    .route({
      method: "GET",
      path: "/badges",
      tags: ["Public"],
    })
    .output(badgeSlugsSchema),

  ping: publicBase
    .route({
      method: "GET",
      path: "/ping",
      tags: ["Public"],
    })
    .input(badgeIdentifiersSchema)
    .output(z.string().describe("Ping the server to check if it's alive")),

  getStats: publicBase
    .route({
      method: "GET",
      path: "/stats",
      tags: ["Public"],
    })
    .output(badgeHubStatsSchema),

  reportInstall: publicBase
    .route({
      method: "POST",
      path: "/projects/{slug}/revisions/{revision}/report/install",
      summary: "Report an installation of an app.",
      tags: ["Public"],
      successStatus: 204,
      inputStructure: "detailed",
    })
    .input(
      z.object({
        params: z.object({
          slug: z.string(),
          revision: z.coerce.number(),
        }),
        query: badgeIdentifiersSchema,
        // Allow empty body or any legacy payload (e.g. JSON string)
        body: z.unknown().optional(),
      })
    )
    .output(z.void()),

  reportLaunch: publicBase
    .route({
      method: "POST",
      path: "/projects/{slug}/revisions/{revision}/report/launch",
      summary: "Report a launch of an app.",
      tags: ["Public"],
      successStatus: 204,
      inputStructure: "detailed",
    })
    .input(
      z.object({
        params: z.object({
          slug: z.string(),
          revision: z.coerce.number(),
        }),
        query: badgeIdentifiersSchema,
        body: z.unknown().optional(),
      })
    )
    .output(z.void()),

  reportCrash: publicBase
    .route({
      method: "POST",
      path: "/projects/{slug}/revisions/{revision}/report/crash",
      summary: "Report a crash of an app.",
      tags: ["Public"],
      successStatus: 204,
      inputStructure: "detailed",
    })
    .input(
      z.object({
        params: z.object({
          slug: z.string(),
          revision: z.coerce.number(),
        }),
        query: badgeIdentifiersSchema,
        body: crashReportBodySchema.optional(),
      })
    )
    .output(z.void()),
};
