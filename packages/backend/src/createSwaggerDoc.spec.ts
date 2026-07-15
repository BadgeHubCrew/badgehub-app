import { createSwaggerDoc } from "@createSwaggerDoc";
import { describe, expect, it } from "vitest";

describe("createSwaggerDoc", () => {
  it("swagger doc should match snapshot", async () => {
    const swaggerDoc = await createSwaggerDoc();
    expect(swaggerDoc).toMatchSnapshot();
  });
});
