import { generateOpenApi } from "@ts-rest/open-api";
import { publicRestContracts } from "@shared/contracts/publicRestContracts";
import { privateRestContracts } from "@shared/contracts/privateRestContracts";
import _ from "lodash";
import {
  OpenAPIObject,
  OperationObject,
  ParameterObject,
  ReferenceObject,
} from "openapi3-ts";
import { initContract } from "@ts-rest/core";
import { EXPRESS_PORT } from "@config";

const c = initContract();
export const swaggerJsonContract = c.router({
  getSwaggerDoc: {
    method: "GET",
    path: "/api-docs/swagger.json",
    responses: {
      200: c.type<OpenAPIObject>(),
    },
  },
});

function withPrefix(prefix: string, paths: Record<string, any>) {
  const prefixedPaths: Record<string, any> = {};
  for (const [path, value] of Object.entries(paths)) {
    prefixedPaths[`${prefix}${path}`] = value;
  }
  return prefixedPaths;
}

const withTag = (operation: OperationObject, tag: string) => ({
  ...operation,
  tags: [...(operation.tags ?? []), tag],
});

// Helper functions to identify authentication headers
const isAuthorizationHeader = (p: ParameterObject | ReferenceObject) =>
  "in" in p && p.in === "header" && p.name?.toLowerCase() === "authorization";

const isApiTokenHeader = (p: ParameterObject | ReferenceObject) =>
  "in" in p &&
  p.in === "header" &&
  p.name?.toLowerCase() === "badgehub-api-token";

const withSecurity = (operation: OperationObject): OperationObject => ({
  ...operation,
  parameters: operation.parameters?.filter(
    (p) => !isAuthorizationHeader(p) && !isApiTokenHeader(p)
  ),
  security: [{ bearerAuth: [] }, { apiTokenAuth: [] }],
});

export const createSwaggerDoc = () => {
  const apiDoc = { info: { title: "BadgeHub API", version: "1.0.0" } };
  const jsonSwagger = generateOpenApi(swaggerJsonContract, apiDoc, {
    setOperationId: true,
    operationMapper: (op) => withTag(op, "Open API"),
  });
  const publicSwagger = generateOpenApi(publicRestContracts, apiDoc, {
    setOperationId: true,
    operationMapper: (op) => withTag(op, "Public"),
  });
  const privateSwagger = generateOpenApi(privateRestContracts, apiDoc, {
    setOperationId: true,
    operationMapper: (op) => withSecurity(withTag(op, "Private")),
  });

  return {
    ...jsonSwagger,
    paths: _.merge(
      jsonSwagger.paths,
      withPrefix("/api/v3", publicSwagger.paths),
      withPrefix("/api/v3", privateSwagger.paths)
    ),
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
        name: "Private",
        description:
          "Operations available to authenticated users via JWT Bearer token OR API token.",
      },
    ],
    servers: [
      { url: "/" },
      { url: "https://badgehub-api.p1m.nl/" },
      { url: `http://localhost:${EXPRESS_PORT}/` },
    ],
    // Define the security schemes
    components: {
      ...jsonSwagger.components,
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
  } as const satisfies OpenAPIObject;
};
