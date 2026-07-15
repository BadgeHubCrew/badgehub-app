import { isSafeToRenderInline } from "@util/mimeTypeDetection";

/**
 * Headers for file downloads. Keys must be lowercase — oRPC's Node adapter
 * only reads `content-type` / `content-disposition` when deciding Blob defaults.
 */
export function fileResponseHeaders(
  filePath: string,
  mimetype: string | undefined,
  extra?: Record<string, string>
) {
  const disposition = isSafeToRenderInline(mimetype) ? "inline" : "attachment";
  return {
    ...(mimetype ? { "content-type": mimetype } : {}),
    "content-disposition": `${disposition}; filename="${filePath}"`,
    ...extra,
  };
}

/**
 * Binary body for OpenAPIHandler. Use File so the default disposition filename
 * matches `filePath` if our content-disposition header is absent.
 */
export function toFileBody(
  bytes: Buffer | Uint8Array,
  filePath: string,
  mimetype?: string
) {
  const data = bytes instanceof Buffer ? new Uint8Array(bytes) : bytes;
  return new File([data], filePath, {
    type: mimetype || "application/octet-stream",
  });
}
