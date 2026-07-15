import { createSwaggerDoc } from "@createSwaggerDoc";
import type { OperationObject, RequestBodyObject } from "openapi3-ts";
import { describe, expect, it } from "vitest";

describe("createSwaggerDoc", () => {
  it("swagger doc should match snapshot", async () => {
    const swaggerDoc = await createSwaggerDoc();
    expect(swaggerDoc).toMatchSnapshot();
  });

  it("documents file upload as multipart/form-data only (not application/json)", async () => {
    const swaggerDoc = await createSwaggerDoc();
    const operation = swaggerDoc.paths?.[
      "/api/v3/projects/{slug}/draft/files/{filePath}"
    ]?.post as OperationObject | undefined;
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
});
