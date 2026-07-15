import { EXPRESS_PORT } from "@config";
import { OpenAPIGenerator } from "@orpc/openapi";
import { ZodToJsonSchemaConverter } from "@orpc/zod/zod4";
import { privateRestContracts } from "@shared/contracts/privateRestContracts";
import { publicRestContracts } from "@shared/contracts/publicRestContracts";
import type { OpenAPIObject, PathsObject } from "openapi3-ts";

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

  return {
    ...spec,
    paths: {
      ...withApiPrefix(spec.paths as PathsObject | undefined),
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
