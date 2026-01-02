import { describe, expect, it } from "vitest";
import { getLanguageFromFile, getPreviewType } from "@utils/filePreview.ts";

describe("getPreviewType", () => {
  it("detects image types by mimetype", () => {
    expect(getPreviewType("image/png", "icon.png")).toBe("image");
  });

  it("detects json types by mimetype", () => {
    expect(getPreviewType("application/json", "data.json")).toBe("json");
  });

  it("detects python types by mimetype", () => {
    expect(getPreviewType("text/x-python", "main.py")).toBe("python");
  });

  it("detects text types by mimetype", () => {
    expect(getPreviewType("text/plain", "readme.txt")).toBe("text");
  });

  it("falls back to extension for octet-stream", () => {
    expect(getPreviewType("application/octet-stream", "script.py")).toBe("python");
    expect(getPreviewType("application/octet-stream", "notes.md")).toBe("text");
    expect(getPreviewType("application/octet-stream", "photo.jpg")).toBe("image");
  });

  it("returns unsupported when no match is found", () => {
    expect(getPreviewType("application/zip", "archive.zip")).toBe("unsupported");
  });
});

describe("getLanguageFromFile", () => {
  it("maps known extensions to syntax highlighter language", () => {
    expect(getLanguageFromFile("component.tsx")).toBe("tsx");
    expect(getLanguageFromFile("script.py")).toBe("python");
  });

  it("falls back to text for unknown extensions", () => {
    expect(getLanguageFromFile("file.unknownext")).toBe("text");
  });
});
