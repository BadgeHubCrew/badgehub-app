import type { ApiResult } from "@api/apiClient.ts";
import { BADGEHUB_API_V3_URL } from "@config.ts";

export type UploadProgress = {
  /** Bytes sent so far for this request body. */
  loaded: number;
  /** Total bytes of the request body when known. */
  total: number;
};

export type UploadDraftFileOptions = {
  slug: string;
  filePath: string;
  file: File;
  /** Full Authorization header value, e.g. `Bearer …`. */
  authorization: string;
  onProgress?: (progress: UploadProgress) => void;
};

function encodeFilePath(filePath: string): string {
  return filePath
    .split("/")
    .filter((segment) => segment.length > 0)
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

function parseResponseBody(responseText: string): unknown {
  if (!responseText) return undefined;
  try {
    return JSON.parse(responseText) as unknown;
  } catch {
    return { reason: responseText };
  }
}

/**
 * Upload a draft project file via XHR so we can report real upload progress.
 *
 * The oRPC OpenAPI client uses `fetch`, which has no upload progress events.
 * XHR's `upload.onprogress` is the portable way to drive a progress bar for
 * multipart FormData posts.
 */
export function uploadDraftFile(
  options: UploadDraftFileOptions
): Promise<ApiResult> {
  const { slug, filePath, file, authorization, onProgress } = options;
  const url = `${BADGEHUB_API_V3_URL}/projects/${encodeURIComponent(slug)}/draft/files/${encodeFilePath(filePath)}`;

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.setRequestHeader("Authorization", authorization);

    xhr.upload.onprogress = (event) => {
      if (!onProgress) return;
      if (event.lengthComputable) {
        onProgress({ loaded: event.loaded, total: event.total });
        return;
      }
      // Some environments omit total; still report bytes sent for the bar.
      if (event.loaded > 0) {
        onProgress({
          loaded: event.loaded,
          total: Math.max(event.loaded, file.size),
        });
      }
    };

    xhr.onload = () => {
      resolve({
        status: xhr.status,
        body: parseResponseBody(xhr.responseText),
        headers: new Headers(),
      });
    };

    xhr.onerror = () => {
      reject(new Error(`Network error while uploading ${file.name}`));
    };

    xhr.onabort = () => {
      reject(new Error(`Upload aborted: ${file.name}`));
    };

    const formData = new FormData();
    formData.append("file", file);
    xhr.send(formData);
  });
}
