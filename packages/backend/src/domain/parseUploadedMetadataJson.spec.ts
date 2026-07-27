import { parseUploadedMetadataJson } from "@domain/BadgeHubData";
import { UserError } from "@domain/UserError";
import { describe, expect, it } from "vitest";

const encode = (value: string) => new TextEncoder().encode(value);

describe("parseUploadedMetadataJson", () => {
  it("parses valid metadata", () => {
    const result = parseUploadedMetadataJson(
      encode(JSON.stringify({ name: "Hello", description: "World" }))
    );
    expect(result).toEqual({ name: "Hello", description: "World" });
  });

  it("strips UTF-8 BOM", () => {
    const result = parseUploadedMetadataJson(
      encode(`\uFEFF${JSON.stringify({ name: "Bommed" })}`)
    );
    expect(result.name).toBe("Bommed");
  });

  it("rejects empty content", () => {
    expect(() => parseUploadedMetadataJson(encode("   "))).toThrow(UserError);
    expect(() => parseUploadedMetadataJson(encode("   "))).toThrow(
      /metadata\.json is empty/i
    );
  });

  it("rejects invalid JSON", () => {
    expect(() => parseUploadedMetadataJson(encode("{not json"))).toThrow(
      UserError
    );
    expect(() => parseUploadedMetadataJson(encode("{not json"))).toThrow(
      /not valid JSON/i
    );
  });

  it("rejects schema violations with field details", () => {
    expect(() =>
      parseUploadedMetadataJson(
        encode(JSON.stringify({ development_status: "beta" }))
      )
    ).toThrow(/metadata\.json is invalid/i);
  });
});
