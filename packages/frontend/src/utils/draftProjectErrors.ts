export type DraftProjectErrorCode =
  | "authentication"
  | "authorization"
  | "not_found"
  | "unknown";

export const draftProjectErrorFromStatus = (
  status: number
): DraftProjectErrorCode => {
  if (status === 401) {
    return "authentication";
  }
  if (status === 403) return "authorization";
  if (status === 404) {
    return "not_found";
  }
  return "unknown";
};

export const normalizeDraftProjectError = (
  error: unknown
): DraftProjectErrorCode => {
  if (
    error instanceof Error &&
    (error.message === "authentication" ||
      error.message === "authorization" ||
      error.message === "not_found" ||
      error.message === "unknown")
  ) {
    return error.message;
  }
  return "unknown";
};
