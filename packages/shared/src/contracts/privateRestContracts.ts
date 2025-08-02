import { initContract } from "@ts-rest/core";
import { z } from "zod/v3";
import {
  detailedProjectSchema,
  projectSummarySchema,
} from "@shared/domain/readModels/project/ProjectDetails";
import { __tsCheckSame } from "@shared/zodUtils/zodTypeComparison";
import {
  CreateProjectProps,
  createProjectPropsSchema,
} from "@shared/domain/writeModels/project/WriteProject";
import { writeAppMetadataJSONSchema } from "@shared/domain/writeModels/AppMetadataJSON";

const c = initContract();

// Schemas for private endpoints.
// Replace these with more specific schemas from your domain if available.
const createProjectBodySchema = createProjectPropsSchema
  .omit({ slug: true, idp_user_id: true })
  .describe("Schema request body for creating or updating a project");
type CreateProjectBody = Omit<CreateProjectProps, "slug" | "idp_user_id">;

__tsCheckSame<
  CreateProjectBody,
  CreateProjectBody,
  z.infer<typeof createProjectBodySchema>
>(true);

const errorResponseSchema = z.object({ reason: z.string() });

const privateProjectContracts = c.router(
  {
    createProject: {
      method: "POST",
      path: "/projects/:slug",
      pathParams: z.object({ slug: z.string() }),
      body: createProjectBodySchema,
      responses: {
        204: z.void(),
        409: errorResponseSchema,
        403: errorResponseSchema,
      },
      summary: "Create a new project",
    },

    updateProject: {
      method: "PATCH",
      path: "/projects/:slug",
      pathParams: z.object({ slug: z.string() }),
      body: createProjectBodySchema,
      responses: {
        204: z.void(),
        403: errorResponseSchema,
        404: errorResponseSchema,
      },
      summary: "Update an existing project",
    },

    deleteProject: {
      method: "DELETE",
      path: "/projects/:slug",
      pathParams: z.object({ slug: z.string() }),
      responses: {
        204: z.void(),
        403: errorResponseSchema,
        404: errorResponseSchema,
      },
      summary: "Delete an existing project",
    },

    writeDraftFile: {
      method: "POST",
      path: "/projects/:slug/draft/files/:filePath",
      contentType: "multipart/form-data",
      body: z.any(),
      pathParams: z.object({
        slug: z.string(),
        filePath: z.string(),
      }),
      responses: {
        204: z.void(),
        403: errorResponseSchema,
        404: errorResponseSchema,
      },
      summary: "Upload a file to the latest draft version of a project",
    },

    deleteDraftFile: {
      method: "DELETE",
      path: "/projects/:slug/draft/files/:filePath",
      pathParams: z.object({
        slug: z.string(),
        filePath: z.string(),
      }),
      responses: {
        204: z.void(),
        403: errorResponseSchema,
        404: errorResponseSchema,
      },
      summary: "Delete a file from the latest draft version of a project",
    },

    changeDraftAppMetadata: {
      method: "PATCH",
      path: "/projects/:slug/draft/metadata",
      pathParams: z.object({ slug: z.string() }),
      body: writeAppMetadataJSONSchema,
      responses: {
        204: z.void(),
        403: errorResponseSchema,
        404: errorResponseSchema,
      },
      summary: `Overwrite the metadata of the latest draft version of a project. 
This is actually just an alias for a post to /projects/:slug/draft/files/metadata.json`,
    },

    getDraftFile: {
      method: "GET",
      path: "/projects/:slug/draft/files/:filePath",
      pathParams: z.object({
        slug: z.string(),
        filePath: z.string(),
      }),
      responses: {
        200: z.unknown().describe("File content as a stream"),
        403: errorResponseSchema,
        404: errorResponseSchema,
      },
      summary: "Get a file from the draft version of a project",
    },

    getDraftProject: {
      method: "GET",
      path: "/projects/:slug/draft",
      pathParams: z.object({ slug: z.string() }),
      responses: {
        200: detailedProjectSchema,
        403: errorResponseSchema,
        404: errorResponseSchema,
      },
      summary: "Get project details for the draft version of a project",
    },

    publishVersion: {
      method: "PATCH",
      path: "/projects/:slug/publish",
      pathParams: z.object({ slug: z.string() }),
      responses: {
        204: z.void(),
        403: errorResponseSchema,
        404: errorResponseSchema,
      },
      body: z.unknown().optional().nullable(),
      summary: "Publish the current draft as a new version",
    },

    createProjectAPIToken: {
      method: "POST",
      path: "/projects/:slug/token",
      body: z.unknown().optional().nullable(),
      responses: {
        200: z
          .object({ token: z.string() })
          .describe(`An object containing the API token for the project.`),
        403: errorResponseSchema,
      },
      summary: "Create an API token for the project.",
    },
    getProjectApiTokenMetadata: {
      method: "GET",
      path: "/projects/:slug/token",
      responses: {
        200: z
          .object({
            createdDate: z
              .string()
              .date()
              .describe("ISO date of the creation date of the token"),
            lastUseDate: z
              .string()
              .date()
              .describe("ISO date of last use of the token"),
          })
          .describe(`Returns metadata about the token.`),
        403: errorResponseSchema,
      },
      summary: "Create an API token for the project.",
    },
    revokeProjectAPIToken: {
      method: "DELETE",
      path: "/projects/:slug/token",
      responses: {
        204: z.void(),
        403: errorResponseSchema,
      },
      summary: "Delete the API token for the project",
    },
  },
  {
    baseHeaders: {
      authorization: z.string(),
    },
  }
);

const privateRestContracts = c.router(
  {
    ...privateProjectContracts,
    getUserDraftProjects: {
      method: "GET",
      path: "/users/:userId/drafts",
      pathParams: z.object({ userId: z.string() }),
      query: z.object({
        pageStart: z.coerce.number().optional(),
        pageLength: z.coerce.number().optional(),
      }),
      responses: {
        200: z.array(projectSummarySchema),
        403: errorResponseSchema,
      },
      summary: "Get all draft projects for a user",
    },
  },
  {
    baseHeaders: {
      authorization: z.string(),
    },
  }
);

export { privateProjectContracts, privateRestContracts };
