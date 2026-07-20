import { EXPRESS_PORT } from "@config";
import type { OpenAPI } from "@orpc/contract";
import { OpenAPIGenerator } from "@orpc/openapi";
import { ZodToJsonSchemaConverter } from "@orpc/zod/zod4";
import { errorResponseSchema } from "@shared/contracts/errorSchemas";
import {
  createProjectInputSchema,
  privateRestContracts,
  updateProjectInputSchema,
} from "@shared/contracts/privateRestContracts";
import {
  badgeIdentifiersSchema,
  badgeSlugsSchema,
  categoryNamesSchema,
  crashReportBodySchema,
  getProjectsQuerySchema,
  publicRestContracts,
} from "@shared/contracts/publicRestContracts";
import { badgeSlugSchema } from "@shared/domain/readModels/Badge";
import { badgeHubStatsSchema } from "@shared/domain/readModels/BadgeHubStats";
import {
  appMetadataJSONSchema,
  iconMapSchema,
} from "@shared/domain/readModels/project/AppMetadataJSON";
import { categoryNameSchema } from "@shared/domain/readModels/project/Category";
import { datedDataSchema } from "@shared/domain/readModels/project/DatedData";
import { fileMetadataSchema } from "@shared/domain/readModels/project/FileMetadata";
import { projectApiTokenMetadataSchema } from "@shared/domain/readModels/project/ProjectApiToken";
import { detailedProjectSchema } from "@shared/domain/readModels/project/ProjectDetails";
import {
  projectLatestRevisionSchema,
  projectLatestRevisionsSchema,
} from "@shared/domain/readModels/project/ProjectRevision";
import {
  iconMapWithUrlsSchema,
  projectSummariesSchema,
  projectSummarySchema,
} from "@shared/domain/readModels/project/ProjectSummaries";
import { variantJSONSchema } from "@shared/domain/readModels/project/VariantJSON";
import { versionSchema } from "@shared/domain/readModels/project/Version";
import type { PathsObject } from "openapi3-ts/oas32";

const generator = new OpenAPIGenerator({
  schemaConverters: [new ZodToJsonSchemaConverter()],
});

/**
 * Shared Zod schemas registered as OpenAPI `components.schemas`.
 * Matching is by schema object identity, so these must be the same instances
 * used in contracts. oRPC then emits `$ref`s instead of inlining duplicates.
 *
 * @see https://orpc.dev/docs/openapi/openapi-specification
 */
const commonSchemas = {
  ErrorResponse: { schema: errorResponseSchema },
  /** oRPC fallback error object (`defined: false`) shared by all error statuses. */
  UndefinedError: { error: "UndefinedError" as const },
  DetailedProject: {
    schema: detailedProjectSchema,
    strategy: "output" as const,
  },
  ProjectSummary: { schema: projectSummarySchema, strategy: "output" as const },
  ProjectSummaries: {
    schema: projectSummariesSchema,
    strategy: "output" as const,
  },
  ProjectLatestRevision: {
    schema: projectLatestRevisionSchema,
    strategy: "output" as const,
  },
  ProjectLatestRevisions: {
    schema: projectLatestRevisionsSchema,
    strategy: "output" as const,
  },
  Version: { schema: versionSchema, strategy: "output" as const },
  FileMetadata: { schema: fileMetadataSchema, strategy: "output" as const },
  // writeAppMetadataJSONSchema is the same instance as appMetadataJSONSchema
  AppMetadataJSON: { schema: appMetadataJSONSchema },
  IconMap: { schema: iconMapSchema },
  IconMapWithUrls: {
    schema: iconMapWithUrlsSchema,
    strategy: "output" as const,
  },
  VariantJSON: { schema: variantJSONSchema },
  BadgeHubStats: { schema: badgeHubStatsSchema, strategy: "output" as const },
  ProjectApiTokenMetadata: {
    schema: projectApiTokenMetadataSchema,
    strategy: "output" as const,
  },
  BadgeSlug: { schema: badgeSlugSchema },
  CategoryName: { schema: categoryNameSchema },
  CategoryNames: { schema: categoryNamesSchema, strategy: "output" as const },
  BadgeSlugs: { schema: badgeSlugsSchema, strategy: "output" as const },
  BadgeIdentifiers: { schema: badgeIdentifiersSchema },
  GetProjectsQuery: { schema: getProjectsQuerySchema },
  CrashReportBody: { schema: crashReportBodySchema },
  CreateProjectInput: { schema: createProjectInputSchema },
  UpdateProjectInput: { schema: updateProjectInputSchema },
  DatedData: { schema: datedDataSchema },
};

type DefinedErrorDefinition = [
  code: string,
  defaultMessage: string,
  dataRequired: boolean,
  dataSchema: OpenAPI.SchemaObject | OpenAPI.ReferenceObject,
];

/** One shared schema name per HTTP status (e.g. Http404Error). */
function httpErrorSchemaName(status: number): string {
  return `Http${status}Error`;
}

/**
 * Build the oRPC error envelope once per status.
 * Used with customErrorResponseBodySchema so operations $ref the schema
 * instead of inlining a full oneOf for every 4xx response.
 */
function buildHttpErrorBodySchema(
  definedErrors: readonly DefinedErrorDefinition[],
  status: number
): OpenAPI.SchemaObject {
  return {
    oneOf: [
      ...definedErrors.map(
        ([code, defaultMessage, dataRequired, dataSchema]) => ({
          type: "object" as const,
          properties: {
            defined: { const: true },
            code: { const: code },
            status: { const: status },
            message: { type: "string" as const, default: defaultMessage },
            data: dataSchema,
          },
          required: dataRequired
            ? ["defined", "code", "status", "message", "data"]
            : ["defined", "code", "status", "message"],
        })
      ),
      { $ref: "#/components/schemas/UndefinedError" },
    ],
  };
}

function withApiPrefix(paths: PathsObject | undefined): PathsObject {
  if (!paths) return {};
  return Object.fromEntries(
    Object.entries(paths).map(([path, methods]) => {
      // Document public URLs as /revN (legacy), even though the handler rewrites to /revisions/N
      const legacyPath = path.replace(
        /\/revisions\/\{revision\}/g,
        "/rev{revision}"
      );
      return [
        legacyPath.startsWith("/api/") ? legacyPath : `/api/v3${legacyPath}`,
        methods,
      ];
    })
  );
}

export async function createSwaggerDoc(): Promise<OpenAPI.Document> {
  const contract = {
    ...publicRestContracts,
    ...privateRestContracts,
  };

  // Populated via customErrorResponseBodySchema during generate().
  const httpErrorSchemas: Record<string, OpenAPI.SchemaObject> = {};

  const spec = await generator.generate(contract, {
    info: {
      title: "BadgeHub API",
      version: "1.0.0",
    },
    servers: [
      { url: "/" },
      { url: "https://badgehub-api.p1m.nl/" },
      { url: `http://localhost:${EXPRESS_PORT}/` },
    ],
    tags: [
      {
        name: "Open API",
        description: "Operations allowing to download the open api spec.",
      },
      {
        name: "Public",
        description: "Operations available without any authentication.",
      },
      {
        name: "Private Scriptable",
        description:
          "Operations available to authenticated users via JWT Bearer token OR API token.",
      },
      {
        name: "Private Non Scriptable",
        description:
          "Operations available to authenticated users via JWT Bearer token only.",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "JWT Bearer token (for user sessions)",
        },
        apiTokenAuth: {
          type: "apiKey",
          in: "header",
          name: "badgehub-api-token",
          description: "Project-specific API token (for automation)",
        },
      },
    },
    commonSchemas,
    customErrorResponseBodySchema: (definedErrors, status) => {
      const name = httpErrorSchemaName(status);
      httpErrorSchemas[name] ??= buildHttpErrorBodySchema(
        definedErrors as DefinedErrorDefinition[],
        status
      );
      return { $ref: `#/components/schemas/${name}` };
    },
  });

  const paths = withApiPrefix(spec.paths as PathsObject | undefined);

  return {
    ...spec,
    components: {
      ...spec.components,
      schemas: {
        ...spec.components?.schemas,
        ...httpErrorSchemas,
      },
    },
    paths: {
      ...paths,
      "/api-docs/swagger.json": {
        get: {
          tags: ["Open API"],
          summary: "Get OpenAPI document",
          operationId: "getSwaggerDoc",
          responses: {
            "200": {
              description: "OpenAPI specification",
              content: {
                "application/json": {
                  schema: { type: "object", additionalProperties: true },
                },
              },
            },
          },
        },
      },
    },
  };
}
