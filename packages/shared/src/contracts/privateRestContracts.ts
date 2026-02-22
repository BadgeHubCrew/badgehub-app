import { initContract } from "@ts-rest/core";
import { z } from "zod/v3";
import { detailedProjectSchema } from "@badgehub/shared/domain/readModels/project/ProjectDetails";
import { __tsCheckSame } from "@badgehub/shared/zodUtils/zodTypeComparison";
import { createProjectPropsSchema } from "@badgehub/shared/domain/writeModels/project/WriteProject";
import type { CreateProjectProps } from "@badgehub/shared/domain/writeModels/project/WriteProject";
import { writeAppMetadataJSONSchema } from "@badgehub/shared/domain/writeModels/AppMetadataJSON";
import { projectApiTokenMetadataSchema } from "@badgehub/shared/domain/readModels/project/ProjectApiToken";
import { projectSummarySchema } from "@badgehub/shared/domain/readModels/project/ProjectSummaries";
import { NO_BODY_SCHEMA } from "@badgehub/shared/contracts/tsRestNoBodyPatch";

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

const authorizationHeaderSchema = z.object({
  authorization: z.string().optional(),
});

const authorizationOrTokenHeaderSchema = z.union([
  z.object({
    "badgehub-api-token": z.string().optional(),
  }),
  authorizationHeaderSchema,
]);

const iconSizeSchema = z.enum(["8x8", "16x16", "32x32", "64x64"]);

const setDraftIconBodySchema = z.object({
  filePath: z.string(),
  sizes: z.array(iconSizeSchema).min(1),
});

const setDraftIconResponseSchema = z.object({
  iconPaths: z.record(iconSizeSchema, z.string()),
});

export const privateProjectContracts = c.router(
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
      headers: authorizationHeaderSchema,
    },

    updateProject: {
      method: "PATCH",
      path: "/projects/:slug",
      pathParams: z.object({ slug: z.string() }),
      body: createProjectBodySchema,
      headers: authorizationOrTokenHeaderSchema,
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
      headers: authorizationOrTokenHeaderSchema,
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
      headers: authorizationOrTokenHeaderSchema,
      responses: {
        204: z.void(),
        403: errorResponseSchema,
        404: errorResponseSchema,
      },
      summary: "Upload a file to the latest draft version of a project",
    },

    setDraftIconFromFile: {
      method: "POST",
      path: "/projects/:slug/draft/icon",
      pathParams: z.object({ slug: z.string() }),
      body: setDraftIconBodySchema,
      headers: authorizationOrTokenHeaderSchema,
      responses: {
        200: setDraftIconResponseSchema,
        400: errorResponseSchema,
        403: errorResponseSchema,
        404: errorResponseSchema,
      },
      summary:
        "Set the 64x64 draft icon by converting the existing project file given in the body",
    },

    deleteDraftFile: {
      method: "DELETE",
      path: "/projects/:slug/draft/files/:filePath",
      pathParams: z.object({
        slug: z.string(),
        filePath: z.string(),
      }),
      headers: authorizationOrTokenHeaderSchema,
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
      headers: authorizationOrTokenHeaderSchema,
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
      headers: authorizationOrTokenHeaderSchema,
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
      headers: authorizationOrTokenHeaderSchema,
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
      headers: authorizationOrTokenHeaderSchema,
      responses: {
        204: z.void(),
        403: errorResponseSchema,
        404: errorResponseSchema,
      },
      body: NO_BODY_SCHEMA,
      summary: "Publish the current draft as a new version",
    },
    createProjectAPIToken: {
      method: "POST",
      path: "/projects/:slug/token",
      body: NO_BODY_SCHEMA,
      headers: authorizationOrTokenHeaderSchema,
      responses: {
        200: z
          .object({ token: z.string() })
          .describe(`An object containing the API token for the project.`),
        403: errorResponseSchema,
      },
      summary:
        "Create a new API token for the project (and invalidate the old one if there was one).\n" +
        "This is an api key that can be used in the 'badgehub-api-token' header. Eg. set this header: 'badgehub-api-token:{token}'.",
    },
    getProjectApiTokenMetadata: {
      method: "GET",
      path: "/projects/:slug/token",
      headers: authorizationOrTokenHeaderSchema,
      responses: {
        200: projectApiTokenMetadataSchema,
        404: errorResponseSchema,
        403: errorResponseSchema,
      },
      summary:
        "Allow to check if there is an API token for the project and when it was last used and created.",
    },
    revokeProjectAPIToken: {
      method: "DELETE",
      path: "/projects/:slug/token",
      headers: authorizationOrTokenHeaderSchema,
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

export const privateRestContracts = c.router({
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
    headers: authorizationHeaderSchema,
  },
});
