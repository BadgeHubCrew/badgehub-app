import { RevisionNumberOrAlias } from "@shared/domain/readModels/project/Version";
import { sharedConfig } from "@config";

type RevisionPathPart = "draft" | `rev${number}` | "latest";

export function getFileDownloadUrl(
  project: string,
  versionRevision: RevisionNumberOrAlias,
  full_path: string
) {
  const revisionPathPart: RevisionPathPart =
    typeof versionRevision === "number"
      ? `rev${versionRevision}`
      : versionRevision;
  return `${sharedConfig.badgeHubBaseUrl}/api/v3/projects/${project}/${revisionPathPart}/files/${encodeURIComponent(full_path)}`;
}
