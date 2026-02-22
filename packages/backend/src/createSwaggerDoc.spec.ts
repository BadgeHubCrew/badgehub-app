import { describe, expect, it } from "vitest";

import { createSwaggerDoc } from "#createSwaggerDoc";

const swaggerDoc = createSwaggerDoc();

describe("createSwaggerDoc", () => {
  it("swagger doc should match snapshot", async () => {
    expect(swaggerDoc).toMatchSnapshot();
  });
});
