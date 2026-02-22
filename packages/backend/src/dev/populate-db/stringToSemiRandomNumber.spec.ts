import { describe, expect, it } from "vitest";
import { stringToSemiRandomNumber } from "#dev/populate-db/stringToSemiRandomNumber";

describe("stringToSemiRandomNumber in case of getLockId usage", () => {
  it("lock id should be deterministic", async () => {
    const result = await stringToSemiRandomNumber(
      ["test", "a", "b", "c"].join(",")
    );
    expect(result).toEqual(
      await stringToSemiRandomNumber(["test", "a", "b", "c"].join(","))
    );
  });
  it("lock id should be different for different project", async () => {
    const result = await stringToSemiRandomNumber(
      ["test", "a", "b", "c"].join(",")
    );
    expect(result).not.toEqual(
      await stringToSemiRandomNumber(["test2", "a", "b", "c"].join(","))
    );
  });
  it("lock id should be different for different dir", async () => {
    const result = await stringToSemiRandomNumber(
      ["test", "a", "b", "c"].join(",")
    );
    expect(result).not.toEqual(
      await stringToSemiRandomNumber(["test", "a2", "b", "c"].join(","))
    );
  });
  it("lock id should be different for different name", async () => {
    const result = await stringToSemiRandomNumber(
      ["test", "a", "b", "c"].join(",")
    );
    expect(result).not.toEqual(
      await stringToSemiRandomNumber(["test", "a", "b2", "c"].join(","))
    );
  });
  it("lock id should be different for different ext", async () => {
    const result = await stringToSemiRandomNumber(
      ["test", "a", "b", "c"].join(",")
    );
    expect(result).not.toEqual(
      await stringToSemiRandomNumber(["test", "a", "b", "c2"].join(","))
    );
  });
});
