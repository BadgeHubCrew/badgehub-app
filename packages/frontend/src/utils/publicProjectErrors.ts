export type PublicProjectErrorCode = "not_found" | "unknown";

export const publicProjectErrorFromStatus = (
  status: number
): PublicProjectErrorCode => {
  if (status === 404) {
    return "not_found";
  }
  return "unknown";
};

export const normalizePublicProjectError = (
  error: unknown
): PublicProjectErrorCode => {
  if (
    error instanceof Error &&
    (error.message === "not_found" || error.message === "unknown")
  ) {
    return error.message;
  }
  return "unknown";
};

export const publicProjectErrorMessage = (
  code: PublicProjectErrorCode
): string => {
  switch (code) {
    case "not_found":
      return "App not found.";
    default:
      return "Failed to load project.";
  }
};
