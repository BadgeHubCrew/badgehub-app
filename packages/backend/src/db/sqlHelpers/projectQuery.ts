import moment from "moment";
import type { DBProject } from "#db/models/project/DBProject";
import type { DBVersion } from "#db/models/project/DBVersion";
import sql, { raw } from "sql-template-tag";
import type { LatestOrDraftAlias } from "@badgehub/shared/domain/readModels/project/Version";
import { getFileDownloadUrl } from "#db/getFileDownloadUrl";
import { projectSummarySchema } from "@badgehub/shared/domain/readModels/project/ProjectSummaries";
import type { ProjectSummary } from "@badgehub/shared/domain/readModels/project/ProjectSummaries";
import type { IconMapWithUrls } from "@badgehub/shared/domain/readModels/project/ProjectSummaries";
import type { DBProjectInstallReport } from "#db/models/DBReporting";
import { timestampTZToISODateString } from "#db/sqlHelpers/dbDates";

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
        parseInt(enrichedDBProject.distinct_installs)) ||
      0,
    license_type: appMetadata.license_type,
    name: appMetadata.name ?? enrichedDBProject.slug,
    published_at: timestampTZToISODateString(enrichedDBProject.published_at),
    revision: enrichedDBProject.revision,
    slug: enrichedDBProject.slug,
    git_url: appMetadata.git_url,
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
  };
  if (appMetadata.hidden) {
    projectSummary.hidden = appMetadata.hidden;
  }
  if (enrichedDBProject.git) {
    projectSummary.git_url = enrichedDBProject.git;
  }
  return projectSummarySchema.parse(projectSummary);
};

export type ProjectQueryResponse = DBProject &
  DBVersion &
  DBProjectInstallReport;
