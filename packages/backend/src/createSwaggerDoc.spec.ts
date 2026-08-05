import { createSwaggerDoc } from "@createSwaggerDoc";
import { MAX_UPLOAD_FILE_SIZE_BYTES } from "@shared/config/sharedConfig";
import type {
  MediaTypeObject,
  OperationObject,
  RequestBodyObject,
} from "openapi3-ts/oas32";
import { describe, expect, it } from "vitest";

describe("createSwaggerDoc", () => {
  it("swagger doc should match snapshot", async () => {
    const swaggerDoc = await createSwaggerDoc();
    expect(swaggerDoc).toMatchSnapshot();
  });

  it("documents file upload as multipart/form-data only (not application/json)", async () => {
    const swaggerDoc = await createSwaggerDoc();
    const operation =
      swaggerDoc.paths?.["/api/v3/projects/{slug}/draft/files/{filePath}"]
        ?.post;
    expect(operation).toBeDefined();

    const content = (operation?.requestBody as RequestBodyObject | undefined)
      ?.content;
    expect(content).toBeDefined();
    expect(content?.["multipart/form-data"]).toBeDefined();
    expect(content?.["application/json"]).toBeUndefined();

    // security still comes from the composed route.spec on the contract
    expect(operation?.security).toEqual([
      { bearerAuth: [] },
      { apiTokenAuth: [] },
    ]);
  });

  it("documents max upload size on writeDraftFile multipart file schema", async () => {
    const swaggerDoc = await createSwaggerDoc();
    const operation =
      swaggerDoc.paths?.["/api/v3/projects/{slug}/draft/files/{filePath}"]
        ?.post;
    const multipart = (operation?.requestBody as RequestBodyObject | undefined)
      ?.content?.["multipart/form-data"] as MediaTypeObject | undefined;
    const bodySchema = multipart?.schema;
    expect(bodySchema && typeof bodySchema === "object").toBe(true);
    const properties =
      bodySchema && typeof bodySchema === "object" && "properties" in bodySchema
        ? bodySchema.properties
        : undefined;
    const fileSchema = properties?.file;
    expect(fileSchema && typeof fileSchema === "object").toBe(true);

    expect(fileSchema).toMatchObject({
      type: "string",
      format: "binary",
      maxLength: MAX_UPLOAD_FILE_SIZE_BYTES,
    });
    expect(
      fileSchema &&
        typeof fileSchema === "object" &&
        "description" in fileSchema
        ? fileSchema.description
        : undefined
    ).toMatch(/432 MB/);
  });

  it("reuses shared domain schemas via components.schemas $ref", async () => {
    const swaggerDoc = await createSwaggerDoc();
    const schemas = swaggerDoc.components?.schemas;
    expect(schemas).toBeDefined();
    expect(schemas?.DetailedProject).toBeDefined();
    expect(schemas?.ProjectSummary).toBeDefined();
    expect(schemas?.ErrorResponse).toBeDefined();
    expect(schemas?.Version).toBeDefined();
    expect(schemas?.AppMetadataJSON).toBeDefined();

    const getProject = swaggerDoc.paths?.["/api/v3/projects/{slug}"]?.get as
      | OperationObject
      | undefined;
    const successSchema = (
      getProject?.responses?.["200"] as {
        content?: { "application/json"?: { schema?: { $ref?: string } } };
      }
    )?.content?.["application/json"]?.schema;
    expect(successSchema).toEqual({
      $ref: "#/components/schemas/DetailedProject",
    });

    const getSummaries = swaggerDoc.paths?.["/api/v3/project-summaries"]?.get as
      | OperationObject
      | undefined;
    const listSchema = (
      getSummaries?.responses?.["200"] as {
        content?: { "application/json"?: { schema?: { $ref?: string } } };
      }
    )?.content?.["application/json"]?.schema;
    expect(listSchema).toEqual({
      $ref: "#/components/schemas/ProjectSummaries",
    });
  });

  it("deduplicates 4xx oRPC error bodies via Http*Error schema $refs", async () => {
    const swaggerDoc = await createSwaggerDoc();
    const schemas = swaggerDoc.components?.schemas;
    expect(schemas?.UndefinedError).toBeDefined();
    expect(schemas?.Http404Error).toBeDefined();
    expect(schemas?.Http401Error).toBeDefined();
    expect(schemas?.Http403Error).toBeDefined();
    expect(schemas?.Http400Error).toBeDefined();
    expect(schemas?.Http409Error).toBeDefined();

    const getProject = swaggerDoc.paths?.["/api/v3/projects/{slug}"]?.get as
      | OperationObject
      | undefined;
    const notFoundSchema = (
      getProject?.responses?.["404"] as {
        content?: { "application/json"?: { schema?: { $ref?: string } } };
      }
    )?.content?.["application/json"]?.schema;
    expect(notFoundSchema).toEqual({
      $ref: "#/components/schemas/Http404Error",
    });

    const getDraft = swaggerDoc.paths?.["/api/v3/projects/{slug}/draft"]?.get as
      | OperationObject
      | undefined;
    const draftNotFound = (
      getDraft?.responses?.["404"] as {
        content?: { "application/json"?: { schema?: { $ref?: string } } };
      }
    )?.content?.["application/json"]?.schema;
    expect(draftNotFound).toEqual({
      $ref: "#/components/schemas/Http404Error",
    });
  });
});
