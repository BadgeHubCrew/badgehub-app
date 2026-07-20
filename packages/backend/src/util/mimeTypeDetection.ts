import mime from "mime-types";

// Custom mappings for extensions not covered by mime-types library
const customMimeTypes: Record<string, string> = {
  js: "application/javascript",
  py: "text/x-python",
  tsx: "text/typescript-jsx",
  ts: "text/typescript",
  jsx: "text/javascript-jsx",
  wav: "audio/wav",
  // MicroPythonOS app package (a ZIP container); binary, so it must never
  // inherit a generic text/plain type from the uploading client.
  mpk: "application/octet-stream",
};

// Generic MIME types that clients fall back to when they don't know (or
// didn't set) the real content type. These are never trusted over an
// extension-based guess.
const genericMimeTypes = new Set([
  "application/octet-stream",
  "application/octet",
  "text/plain",
]);

/**
 * Improved MIME type detection that uses file extension as fallback
 * when browser-provided MIME type is generic or unreliable.
 *
 * @param browserMimeType - MIME type provided by the browser/multer
 * @param filename - The filename to extract extension from
 * @returns The best-guess MIME type
 */
export function detectMimeType(
  browserMimeType: string | undefined | null,
  filename: string
): string {
  const normalizedBrowserMimeType = (
    (browserMimeType || "").split(";")[0] ?? ""
  )
    .trim()
    .toLowerCase();

  // If browser provided a specific, reliable MIME type, use it
  if (
    browserMimeType &&
    normalizedBrowserMimeType &&
    !genericMimeTypes.has(normalizedBrowserMimeType) &&
    !normalizedBrowserMimeType.startsWith("application/x-")
  ) {
    return browserMimeType;
  }

  // Extract extension from filename
  const extension = filename.toLowerCase().split(".").pop();

  // Check our custom mappings first
  if (extension && customMimeTypes[extension]) {
    return customMimeTypes[extension];
  }

  // Fallback to mime-types library
  const extensionBasedMimeType = mime.lookup(filename);

  if (extensionBasedMimeType) {
    return extensionBasedMimeType;
  }

  // Final fallback to browser MIME type (even if generic)
  return browserMimeType || "application/octet-stream";
}

// MIME types that are excluded from inline rendering even though their
// top-level type would otherwise qualify, because browsers can execute
// script from them (e.g. inline SVG scripts).
const inlineUnsafeMimeTypes = new Set(["image/svg+xml"]);

/**
 * Whether a file's MIME type is safe to serve with `Content-Disposition: inline`
 * so browsers render it directly (e.g. in an `<img>` or `<audio>` tag) instead
 * of forcing a download. Restricted to image/audio types that browsers cannot
 * execute as script, to avoid serving user-uploaded content (e.g. HTML/SVG)
 * inline where it could run as active content.
 *
 * @param mimetype - The file's stored MIME type
 */
export function isSafeToRenderInline(mimetype: string | undefined): boolean {
  if (!mimetype) {
    return false;
  }
  const normalizedMimeType = (mimetype.split(";")[0] ?? "")
    .trim()
    .toLowerCase();
  if (inlineUnsafeMimeTypes.has(normalizedMimeType)) {
    return false;
  }
  return (
    normalizedMimeType.startsWith("image/") ||
    normalizedMimeType.startsWith("audio/")
  );
}
