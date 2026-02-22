import type { RevisionNumberOrAlias } from "@badgehub/shared/domain/readModels/project/Version";
import { BADGEHUB_API_BASE_URL } from "#config";

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
  return `${BADGEHUB_API_BASE_URL}/api/v3/projects/${project}/${revisionPathPart}/files/${encodeURIComponent(full_path)}`;
}
