import { describe, expect, it } from "vitest";
import { assertValidColumKey, getInsertKeysAndValuesSql } from "@db/sqlHelpers/objectToSQL";

describe("objectToSQL", () => {
  it("accepts valid SQL column keys", () => {
    expect(assertValidColumKey("slug")).toBe("slug");
    expect(assertValidColumKey("created_at")).toBe("created_at");
    expect(assertValidColumKey("A1")).toBe("A1");
  });

  it("rejects invalid SQL column keys", () => {
    expect(() => assertValidColumKey("1slug")).toThrow(/Invalid column key/);
    expect(() => assertValidColumKey("slug-name")).toThrow(/Invalid column key/);
    expect(() => assertValidColumKey("slug name")).toThrow(/Invalid column key/);
    expect(() => assertValidColumKey("slug;drop")).toThrow(/Invalid column key/);
  });

  it("returns only defined entries for insert keys and values", () => {
    const { keys, values } = getInsertKeysAndValuesSql({
      slug: "demo-app",
      revision: 2,
      deleted_at: undefined,
      is_hidden: false,
    });

    expect(keys.strings.join("|")).toContain("slug");
    expect(keys.strings.join("|")).toContain("revision");
    expect(keys.strings.join("|")).toContain("is_hidden");
    expect(keys.strings.join("|")).not.toContain("deleted_at");

    expect(values.values).toEqual(["demo-app", 2, false]);
  });
});
