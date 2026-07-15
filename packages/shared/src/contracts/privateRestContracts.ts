import { type OpenAPI, oc } from "@orpc/contract";
import { errorResponseSchema } from "@shared/contracts/errorSchemas";
import { projectApiTokenMetadataSchema } from "@shared/domain/readModels/project/ProjectApiToken";
import { detailedProjectSchema } from "@shared/domain/readModels/project/ProjectDetails";
import { projectSummariesSchema } from "@shared/domain/readModels/project/ProjectSummaries";
import { writeAppMetadataJSONSchema } from "@shared/domain/writeModels/AppMetadataJSON";
import {
  type CreateProjectProps,
  createProjectPropsSchema,
} from "@shared/domain/writeModels/project/WriteProject";
import { __tsCheckSame } from "@shared/zodUtils/zodTypeComparison";
import { z } from "zod";

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

type CreateProjectBody = Omit<CreateProjectProps, "slug" | "idp_user_id">;

__tsCheckSame<
  CreateProjectBody,
  CreateProjectBody,
  z.infer<typeof createProjectBodySchema>
>(true);

const iconSizeSchema = z.enum(["8x8", "16x16", "32x32", "64x64"]);

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

const scriptableSecurity = withSecurity([
  { bearerAuth: [] },
  { apiTokenAuth: [] },
]);

const scriptable = oc.errors(privateErrors).route({
  spec: scriptableSecurity,
});

/** Scriptable auth + multipart-only body for nested `z.file()` uploads. */
const scriptableFileUpload = oc.errors(privateErrors).route({
  spec: pipeSpec(scriptableSecurity, multipartOnly),
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
        file: z.file(),
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
        sizes: z.array(iconSizeSchema).min(1),
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
        "Overwrite the metadata of the latest draft version of a project.",
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
        body: z.unknown().describe("File content"),
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
        "Create a new API token for the project (and invalidate the old one if there was one).",
      tags: ["Private Scriptable"],
    })
    .input(z.object({ slug: z.string() }))
    .output(z.object({ token: z.string() })),

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
