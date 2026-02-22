import { describe, it, expect } from "vitest";
import { SQLiteBadgeHubFiles } from "@db/SQLiteBadgeHubFiles";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

describe("SQLiteBadgeHubFiles", () => {
  it("writes and reads file content by sha256", async () => {
    const tempDir = await mkdtemp(path.join(tmpdir(), "badgehub-sqlite-files-"));
    try {
      const files = new SQLiteBadgeHubFiles(tempDir);
      const content = new TextEncoder().encode("hello sqlite files");

      await files.writeFile(
        {
          mimetype: "text/plain",
          size: content.length,
          fileContent: content,
        },
        "abc123"
      );

      const loaded = await files.getFileContents("abc123");
      expect(loaded).toBeDefined();
      expect(Array.from(loaded ?? [])).toEqual(Array.from(content));
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it("does not overwrite existing content", async () => {
    const tempDir = await mkdtemp(path.join(tmpdir(), "badgehub-sqlite-files-"));
    try {
      const files = new SQLiteBadgeHubFiles(tempDir);
      const first = new TextEncoder().encode("first");
      const second = new TextEncoder().encode("second");

      await files.writeFile(
        {
          mimetype: "text/plain",
          size: first.length,
          fileContent: first,
        },
        "same-hash"
      );

      await files.writeFile(
        {
          mimetype: "text/plain",
          size: second.length,
          fileContent: second,
        },
        "same-hash"
      );

      const loaded = await files.getFileContents("same-hash");
      expect(Array.from(loaded ?? [])).toEqual(Array.from(first));
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });
});
