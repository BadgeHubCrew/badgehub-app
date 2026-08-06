import { type OpenAPI, oc } from "@orpc/contract";
import { getSharedConfig } from "@shared/config/sharedConfig";
import { errorResponseSchema } from "@shared/contracts/errorSchemas";
import { projectApiTokenMetadataSchema } from "@shared/domain/readModels/project/ProjectApiToken";
import { detailedProjectSchema } from "@shared/domain/readModels/project/ProjectDetails";
import { projectSummariesSchema } from "@shared/domain/readModels/project/ProjectSummaries";
import { projectUserRatingSchema } from "@shared/domain/readModels/project/ProjectUserRating";
import { writeAppMetadataJSONSchema } from "@shared/domain/writeModels/AppMetadataJSON";
import { createProjectPropsSchema } from "@shared/domain/writeModels/project/WriteProject";
import { z } from "zod";

const MAX_UPLOAD_FILE_SIZE_BYTES = getSharedConfig().MAX_UPLOAD_FILE_SIZE_BYTES;
/** Stable identity so OpenAPI can $ref create/update project bodies. */
export const createProjectBodySchema = createProjectPropsSchema
  .omit({ slug: true, idp_user_id: true })
  .describe("Schema request body for creating or updating a project");

export const createProjectBodyPartialSchema = createProjectBodySchema.partial();

export const updateProjectInputSchema = createProjectBodySchema.extend({
  slug: z.string(),
});

export const createProjectInputSchema = createProjectBodyPartialSchema.extend({
  slug: z.string(),
});

const iconSizeSchema = z.enum(["8x8", "16x16", "32x32", "64x64"]);

const ratingReportBodySchema = z.object({
  rating: z.coerce
    .number()
    .int()
    .min(1)
    .max(5)
    .describe("A rating from 1 to 5."),
});

const privateErrors = {
  NOT_FOUND: { status: 404 as const, data: errorResponseSchema },
  FORBIDDEN: { status: 403 as const, data: errorResponseSchema },
  CONFLICT: { status: 409 as const, data: errorResponseSchema },
  BAD_REQUEST: { status: 400 as const, data: errorResponseSchema },
  UNAUTHORIZED: { status: 401 as const, data: errorResponseSchema },
};

type OperationSpec = (
  operation: OpenAPI.OperationObject
) => OpenAPI.OperationObject;

const pipeSpec =
  (...specs: OperationSpec[]): OperationSpec =>
  (operation) =>
    specs.reduce((current, spec) => spec(current), operation);

const withSecurity =
  (security: OpenAPI.SecurityRequirementObject[]): OperationSpec =>
  (operation) => ({ ...operation, security });

/**
 * Nested `z.file()` is advertised as JSON + multipart; runtime only accepts
 * multipart, so drop the JSON content type from the generated operation.
 *
 * @see https://orpc.dev/docs/openapi/openapi-specification#operation-metadata
 */
const multipartOnly: OperationSpec = (operation) => {
  const body = operation.requestBody;
  if (!body || "$ref" in body) return operation;

  const { content } = body;
  if (!content["multipart/form-data"] || !content["application/json"]) {
    return operation;
  }

  const { "application/json": _omit, ...multipartContent } = content;
  return { ...operation, requestBody: { ...body, content: multipartContent } };
};

/**
 * oRPC's Zod→OpenAPI converter maps `z.file()` mime types but omits
 * `.min()`/`.max()` size constraints. Inject them so Swagger documents the
 * enforced upload limit (`maxLength` = max bytes for binary string content).
 *
 * @see https://orpc.dev/docs/openapi/openapi-specification#operation-metadata
 */
const withUploadFileMaxSize: OperationSpec = (operation) => {
  const body = operation.requestBody;
  if (!body || "$ref" in body) return operation;

  const multipart = body.content?.["multipart/form-data"];
  if (!multipart?.schema || "$ref" in multipart.schema) return operation;

  const properties = multipart.schema.properties;
  const fileSchema = properties?.file;
  if (!fileSchema || "$ref" in fileSchema) return operation;

  return {
    ...operation,
    requestBody: {
      ...body,
      content: {
        ...body.content,
        "multipart/form-data": {
          ...multipart,
          schema: {
            ...multipart.schema,
            properties: {
              ...properties,
              file: {
                ...fileSchema,
                type: "string",
                format: "binary",
                maxLength: MAX_UPLOAD_FILE_SIZE_BYTES,
              },
            },
          },
        },
      },
    },
  };
};

const scriptableSecurity = withSecurity([
  { bearerAuth: [] },
  { apiTokenAuth: [] },
]);

const scriptable = oc.errors(privateErrors).route({
  spec: scriptableSecurity,
});

/** Scriptable auth + multipart-only body for nested `z.file()` uploads. */
const scriptableFileUpload = oc.errors(privateErrors).route({
  spec: pipeSpec(scriptableSecurity, multipartOnly, withUploadFileMaxSize),
});

const jwtOnly = oc.errors(privateErrors).route({
  spec: withSecurity([{ bearerAuth: [] }]),
});

export const scriptablePrivateProjectContracts = {
  updateProject: scriptable
    .route({
      method: "PATCH",
      path: "/projects/{slug}",
      summary: "Update an existing project",
      tags: ["Private Scriptable"],
      successStatus: 204,
    })
    .input(updateProjectInputSchema)
    .output(z.void()),

  deleteProject: scriptable
    .route({
      method: "DELETE",
      path: "/projects/{slug}",
      summary: "Delete an existing project",
      tags: ["Private Scriptable"],
      successStatus: 204,
    })
    .input(z.object({ slug: z.string() }))
    .output(z.void()),

  writeDraftFile: scriptableFileUpload
    .route({
      method: "POST",
      path: "/projects/{slug}/draft/files/{+filePath}",
      summary: "Upload a file to the latest draft version of a project",
      tags: ["Private Scriptable"],
      successStatus: 204,
    })
    .input(
      z.object({
        slug: z.string(),
        filePath: z.string(),
        file: z
          .file()
          .max(MAX_UPLOAD_FILE_SIZE_BYTES)
          .describe(
            `The file contents to upload (multipart field). Maximum size: ${MAX_UPLOAD_FILE_SIZE_BYTES} bytes (${MAX_UPLOAD_FILE_SIZE_BYTES / (1024 * 1024)} MB).`
          ),
      })
    )
    .output(z.void()),

  setDraftIconFromFile: scriptable
    .route({
      method: "POST",
      path: "/projects/{slug}/draft/icon",
      summary:
        "Set the draft icon by converting the existing project file into standard icon sizes",
      tags: ["Private Scriptable"],
    })
    .input(
      z.object({
        slug: z.string(),
        filePath: z.string(),
        sizes: z
          .array(iconSizeSchema)
          .min(1)
          .describe("The sizes that the icon should be available in."),
      })
    )
    .output(
      z.object({
        iconPaths: z.record(z.string(), z.string()),
      })
    ),

  deleteDraftFile: scriptable
    .route({
      method: "DELETE",
      path: "/projects/{slug}/draft/files/{+filePath}",
      summary: "Delete a file from the latest draft version of a project",
      tags: ["Private Scriptable"],
      successStatus: 204,
    })
    .input(z.object({ slug: z.string(), filePath: z.string() }))
    .output(z.void()),

  changeDraftAppMetadata: scriptable
    .route({
      method: "PATCH",
      path: "/projects/{slug}/draft/metadata",
      summary:
        "Overwrite the metadata of the latest draft version of a project. This is actually just an alias for a post to /projects/{slug}/draft/files/metadata.json",
      tags: ["Private Scriptable"],
      successStatus: 204,
    })
    .input(writeAppMetadataJSONSchema.and(z.object({ slug: z.string() })))
    .output(z.void()),

  getDraftFile: scriptable
    .route({
      method: "GET",
      path: "/projects/{slug}/draft/files/{+filePath}",
      summary: "Get a file from the draft version of a project",
      tags: ["Private Scriptable"],
      outputStructure: "detailed",
    })
    .input(z.object({ slug: z.string(), filePath: z.string() }))
    .output(
      z.object({
        headers: z.record(z.string(), z.string()).optional(),
        body: z.unknown().describe("File content as a stream"),
      })
    ),

  getDraftProject: scriptable
    .route({
      method: "GET",
      path: "/projects/{slug}/draft",
      summary: "Get project details for the draft version of a project",
      tags: ["Private Scriptable"],
    })
    .input(z.object({ slug: z.string() }))
    .output(detailedProjectSchema),

  publishVersion: scriptable
    .route({
      method: "PATCH",
      path: "/projects/{slug}/publish",
      summary: "Publish the current draft as a new version",
      tags: ["Private Scriptable"],
      successStatus: 204,
    })
    .input(z.object({ slug: z.string() }))
    .output(z.void()),

  createProjectAPIToken: scriptable
    .route({
      method: "POST",
      path: "/projects/{slug}/token",
      summary:
        "Create a new API token for the project (and invalidate the old one if there was one). This is an api key that can be used in the 'badgehub-api-token' header. Eg. set this header: 'badgehub-api-token:{token}'.",
      tags: ["Private Scriptable"],
    })
    .input(z.object({ slug: z.string() }))
    .output(
      z
        .object({ token: z.string() })
        .describe("An object containing the API token for the project.")
    ),

  getProjectApiTokenMetadata: scriptable
    .route({
      method: "GET",
      path: "/projects/{slug}/token",
      summary:
        "Allow to check if there is an API token for the project and when it was last used and created.",
      tags: ["Private Scriptable"],
    })
    .input(z.object({ slug: z.string() }))
    .output(projectApiTokenMetadataSchema),

  revokeProjectAPIToken: scriptable
    .route({
      method: "DELETE",
      path: "/projects/{slug}/token",
      summary: "Delete the API token for the project",
      tags: ["Private Scriptable"],
      successStatus: 204,
    })
    .input(z.object({ slug: z.string() }))
    .output(z.void()),
};

export const nonScriptablePrivateProjectContracts = {
  createProject: jwtOnly
    .route({
      method: "POST",
      path: "/projects/{slug}",
      summary: "Create a new project",
      tags: ["Private Non Scriptable"],
      successStatus: 204,
    })
    .input(createProjectInputSchema)
    .output(z.void()),
};

export const nonScriptablePrivateUserContracts = {
  getRatingFromUser: jwtOnly
    .route({
      method: "GET",
      path: "/users/{userId}/ratings/{projectSlug}",
      summary: "Get the authenticated user's rating of an app",
      tags: ["Private Non Scriptable"],
    })
    .input(z.object({ userId: z.string(), projectSlug: z.string() }))
    .output(projectUserRatingSchema.nullable()),

  reportRatingFromUser: jwtOnly
    .route({
      method: "PUT",
      path: "/users/{userId}/ratings/{projectSlug}",
      summary: "Report a rating of an app from the authenticated user",
      tags: ["Private Non Scriptable"],
      successStatus: 204,
    })
    .input(
      ratingReportBodySchema.extend({
        userId: z.string(),
        projectSlug: z.string(),
      })
    )
    .output(z.void()),

  getUserDraftProjects: jwtOnly
    .route({
      method: "GET",
      path: "/users/{userId}/drafts",
      summary: "Get all draft projects for a user",
      tags: ["Private Non Scriptable"],
    })
    .input(
      z.object({
        userId: z.string(),
        pageStart: z.coerce.number().optional(),
        pageLength: z.coerce.number().optional(),
      })
    )
    .output(projectSummariesSchema),
};

export const nonScriptablePrivateContracts = {
  ...nonScriptablePrivateProjectContracts,
  ...nonScriptablePrivateUserContracts,
};

export const privateRestContracts = {
  ...nonScriptablePrivateProjectContracts,
  ...scriptablePrivateProjectContracts,
  ...nonScriptablePrivateUserContracts,
};
