import { describe, expect, it } from "vitest";
import { stringToSha256, uint8ToSha256 } from "#util/sha256";

describe("sha256", () => {
  it("uint8ToSha256 should match result from https://emn178.github.io/online-tools/sha256.html", async () => {
    const result = await uint8ToSha256(
      new TextEncoder().encode("this is a test")
    );
    expect(result).toEqual(
      "2e99758548972a8e8822ad47fa1017ff72f06f3ff6a016851f45c398732bc50c"
    );
  });

  it("stringToSha256 should match result from https://emn178.github.io/online-tools/sha256.html", async () => {
    const result = await stringToSha256("this is a test");
    expect(result).toEqual(
      "2e99758548972a8e8822ad47fa1017ff72f06f3ff6a016851f45c398732bc50c"
    );
  });
});
