import { getFileDownloadUrl } from "@db/getFileDownloadUrl";
import type { DBProjectInstallReport } from "@db/models/DBReporting";
import type { DBProject } from "@db/models/project/DBProject";
import type { DBVersion } from "@db/models/project/DBVersion";
import { timestampTZToISODateString } from "@db/sqlHelpers/dbDates";
import { getDevelopmentStatus } from "@shared/domain/readModels/project/AppMetadataJSON";
import {
  type IconMapWithUrls,
  type ProjectSummary,
  projectSummarySchema,
} from "@shared/domain/readModels/project/ProjectSummaries";
import type { LatestOrDraftAlias } from "@shared/domain/readModels/project/Version";
import sql, { raw } from "sql-template-tag";

export function getBaseSelectProjectQuery(
  revision: LatestOrDraftAlias = "latest"
) {
  const revision_column =
    revision === "draft" ? raw(`p.draft_revision`) : raw(`p.latest_revision`);
  return sql`select p.slug,
                    p.idp_user_id,
                    p.created_at,
                    p.updated_at,
                    p.deleted_at,
                    v.published_at,
                    v.revision,
                    v.blur_hash,
                    v.size_of_zip,
                    v.app_metadata,
                    coalesce(pir.distinct_installs, 0) as distinct_installs
             from projects p
                    left join versions v on ${revision_column} = v.revision and p.slug = v.project_slug
                    left join project_install_reports pir on p.slug = pir.project_slug`;
}

export const projectQueryResponseToReadModel = (
  enrichedDBProject: ProjectQueryResponse
): ProjectSummary => {
  const appMetadata = enrichedDBProject.app_metadata;
  const projectSummary: ProjectSummary = {
    idp_user_id: enrichedDBProject.idp_user_id,
    categories: appMetadata.categories,
    description: appMetadata.description,
    installs:
      (enrichedDBProject.distinct_installs &&
        parseInt(enrichedDBProject.distinct_installs, 10)) ||
      0,
    license_type: appMetadata.license_type,
    name: appMetadata.name ?? enrichedDBProject.slug,
    published_at: timestampTZToISODateString(enrichedDBProject.published_at),
    blur_hash: enrichedDBProject.blur_hash ?? undefined,
    revision: enrichedDBProject.revision,
    slug: enrichedDBProject.slug,
    git_url: appMetadata.git_url,
    development_status: getDevelopmentStatus(appMetadata),
    // states: undefined,
    // status: undefined, // TODO
    // dependencies: undefined, // TODO
    // votes: undefined, // TODO
    // warnings: undefined, // TODO
    icon_map:
      appMetadata.icon_map &&
      (Object.fromEntries(
        Object.entries(appMetadata.icon_map).map(([key, full_path]) => [
          key,
          {
            full_path,
            url: getFileDownloadUrl(
              enrichedDBProject.slug,
              enrichedDBProject.published_at
                ? enrichedDBProject.revision
                : "draft",
              full_path
            ),
          },
        ])
      ) as IconMapWithUrls),
    badges: appMetadata.badges,
    version: appMetadata.version,
  };
  if (appMetadata.hidden) {
    projectSummary.hidden = appMetadata.hidden;
  }
  return projectSummarySchema.parse(projectSummary);
};

export type ProjectQueryResponse = DBProject &
  DBVersion &
  DBProjectInstallReport;
