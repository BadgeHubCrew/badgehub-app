import { EXPRESS_PORT } from "@config";
import { OpenAPIGenerator } from "@orpc/openapi";
import { ZodToJsonSchemaConverter } from "@orpc/zod/zod4";
import { privateRestContracts } from "@shared/contracts/privateRestContracts";
import { publicRestContracts } from "@shared/contracts/publicRestContracts";
import type {
  OpenAPIObject,
  OperationObject,
  PathItemObject,
  PathsObject,
  RequestBodyObject,
} from "openapi3-ts";

const generator = new OpenAPIGenerator({
  schemaConverters: [new ZodToJsonSchemaConverter()],
});

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

/**
 * oRPC documents nested `z.file()` fields as both application/json and
 * multipart/form-data. Our runtime only accepts multipart uploads (FormData),
 * so drop the misleading JSON request content type when multipart is present.
 */
function multipartOnlyForFileUploads(paths: PathsObject): PathsObject {
  for (const pathItem of Object.values(paths)) {
    if (!pathItem || typeof pathItem !== "object") continue;
    for (const method of [
      "get",
      "put",
      "post",
      "delete",
      "options",
      "head",
      "patch",
      "trace",
    ] as const) {
      const operation = (pathItem as PathItemObject)[method] as
        | OperationObject
        | undefined;
      const requestBody = operation?.requestBody as
        | RequestBodyObject
        | undefined;
      const content = requestBody?.content;
      if (
        content?.["multipart/form-data"] &&
        content["application/json"] !== undefined
      ) {
        const { "application/json": _json, ...rest } = content;
        requestBody.content = rest;
      }
    }
  }
  return paths;
}

export async function createSwaggerDoc(): Promise<OpenAPIObject> {
  const contract = {
    ...publicRestContracts,
    ...privateRestContracts,
  };

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
  });

  const paths = multipartOnlyForFileUploads(
    withApiPrefix(spec.paths as PathsObject | undefined)
  );

  return {
    ...spec,
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
  } as OpenAPIObject;
}
