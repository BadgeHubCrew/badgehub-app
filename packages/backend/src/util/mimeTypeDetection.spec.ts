import { describe, expect, it } from "vitest";
import { detectMimeType, isSafeToRenderInline } from "./mimeTypeDetection";

describe("MIME Type Detection", () => {
  it("should use browser MIME type when it is specific and reliable", () => {
    expect(detectMimeType("text/x-python", "test.py")).toBe("text/x-python");
    expect(detectMimeType("application/json", "config.json")).toBe(
      "application/json"
    );
    expect(detectMimeType("image/png", "icon.png")).toBe("image/png");
  });

  it("should fallback to extension-based detection for generic browser MIME types", () => {
    expect(detectMimeType("application/octet-stream", "script.py")).toBe(
      "text/x-python"
    );
    expect(detectMimeType("application/octet", "data.json")).toBe(
      "application/json"
    );
    expect(detectMimeType("application/x-unknown", "style.css")).toBe(
      "text/css"
    );
  });

  it("should handle various file extensions correctly", () => {
    expect(detectMimeType("application/octet-stream", "app.js")).toBe(
      "application/javascript"
    );
    expect(detectMimeType("application/octet-stream", "component.tsx")).toBe(
      "text/typescript-jsx"
    );
    expect(detectMimeType("application/octet-stream", "readme.md")).toBe(
      "text/markdown"
    );
    expect(detectMimeType("application/octet-stream", "config.yml")).toBe(
      "text/yaml"
    );
  });

  it("should return browser MIME type as final fallback for unknown extensions", () => {
    expect(detectMimeType("application/octet-stream", "file.unknown")).toBe(
      "application/octet-stream"
    );
    expect(detectMimeType("application/custom", "file.unknown")).toBe(
      "application/custom"
    );
  });

  it("should handle empty or missing browser MIME type", () => {
    expect(detectMimeType("", "test.py")).toBe("text/x-python");
    expect(detectMimeType(undefined, "test.py")).toBe("text/x-python");
    expect(detectMimeType(null, "file.unknown")).toBe(
      "application/octet-stream"
    );
    expect(detectMimeType("", "file.unknown")).toBe("application/octet-stream");
  });

  it("should handle files without extensions", () => {
    expect(detectMimeType("text/plain", "README")).toBe("text/plain");
    expect(detectMimeType("application/octet-stream", "Dockerfile")).toBe(
      "application/octet-stream"
    );
  });

  it("should fallback to extension-based detection when browser reports text/plain for a binary file", () => {
    expect(detectMimeType("text/plain", "icon_64x64.png")).toBe("image/png");
    expect(detectMimeType("text/plain", "sounds/Warning.wav")).toBe(
      "audio/wav"
    );
  });

  it("should treat .mpk uploads (MicroPythonOS app packages) as binary regardless of client MIME type", () => {
    // Explicit binary type from a well-behaved client stays binary.
    expect(detectMimeType("application/octet-stream", "app.mpk")).toBe(
      "application/octet-stream"
    );
    // publish_badgehub.py-style upload without a real content type must not
    // leave a binary package stored as text/plain.
    expect(detectMimeType("text/plain", "com.example.app.mpk")).toBe(
      "application/octet-stream"
    );
    expect(detectMimeType(undefined, "app.mpk")).toBe(
      "application/octet-stream"
    );
    // A specific, trusted client-provided type is still honored.
    expect(detectMimeType("application/zip", "app.mpk")).toBe(
      "application/zip"
    );
  });

  it("should treat generic browser MIME types case-insensitively and ignore parameters", () => {
    expect(detectMimeType("Text/Plain; charset=utf-8", "icon.png")).toBe(
      "image/png"
    );
    expect(detectMimeType("Application/X-Unknown", "style.css")).toBe(
      "text/css"
    );
  });
});

describe("isSafeToRenderInline", () => {
  it("allows image and audio types", () => {
    expect(isSafeToRenderInline("image/png")).toBe(true);
    expect(isSafeToRenderInline("image/jpeg")).toBe(true);
    expect(isSafeToRenderInline("audio/wav")).toBe(true);
    expect(isSafeToRenderInline("audio/wave")).toBe(true);
    expect(isSafeToRenderInline("audio/x-wav")).toBe(true);
    expect(isSafeToRenderInline("Image/PNG; charset=binary")).toBe(true);
  });

  it("rejects SVG despite being an image type, since it can contain script", () => {
    expect(isSafeToRenderInline("image/svg+xml")).toBe(false);
  });

  it("rejects non-image/audio types", () => {
    expect(isSafeToRenderInline("text/html")).toBe(false);
    expect(isSafeToRenderInline("text/x-python")).toBe(false);
    expect(isSafeToRenderInline("application/json")).toBe(false);
    // .mpk packages are stored as application/octet-stream and must be
    // served as a download, never rendered inline.
    expect(isSafeToRenderInline("application/octet-stream")).toBe(false);
  });

  it("rejects missing MIME type", () => {
    expect(isSafeToRenderInline(undefined)).toBe(false);
  });
});
