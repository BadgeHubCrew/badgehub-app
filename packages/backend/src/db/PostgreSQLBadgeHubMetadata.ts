// noinspection SqlResolve

import path from "node:path";
import { getPool } from "@db/connectionPool";
import { getFileDownloadUrl } from "@db/getFileDownloadUrl";
import type { DBProjectRatingReport } from "@db/models/DBReporting";
import type { TimestampTZ } from "@db/models/DBTypes";
import type {
  DBDatedData,
  DBSoftDeletable,
} from "@db/models/project/DBDatedData";
import {
  type DBFileMetadata,
  fileColumnsForCopying,
} from "@db/models/project/DBFileMetadata";
import type { DBInsertProject, DBProject } from "@db/models/project/DBProject";
import type { DBProjectApiKey } from "@db/models/project/DBProjectApiKey";
import type { DBVersion } from "@db/models/project/DBVersion";
import {
  convertDatedData,
  stripDatedData,
  timestampTZToISODateString,
} from "@db/sqlHelpers/dbDates";
import {
  assertValidColumKey,
  getInsertKeysAndValuesSql,
} from "@db/sqlHelpers/objectToSQL";
import {
  getBaseSelectProjectQuery,
  type ProjectQueryResponse,
  projectQueryResponseToReadModel,
} from "@db/sqlHelpers/projectQuery";
import { ProjectAlreadyExistsError, UserError } from "@domain/UserError";
import { VALID_SLUG_REGEX } from "@shared/contracts/slug";
import { type BadgeSlug, getBadgeSlugs } from "@shared/domain/readModels/Badge";
import type { BadgeHubStats } from "@shared/domain/readModels/BadgeHubStats";
import type { DevelopmentStatus } from "@shared/domain/readModels/project/AppMetadataJSON";
import {
  type CategoryName,
  getAllCategoryNames,
} from "@shared/domain/readModels/project/Category";
import type { FileMetadata } from "@shared/domain/readModels/project/FileMetadata";
import type { OrderByOption } from "@shared/domain/readModels/project/ordering";
import type { ProjectApiTokenMetadata } from "@shared/domain/readModels/project/ProjectApiToken";
import {
  detailedProjectSchema,
  type ProjectCore,
  type ProjectDetails,
  type ProjectSlug,
} from "@shared/domain/readModels/project/ProjectDetails";
import type { ProjectSummary } from "@shared/domain/readModels/project/ProjectSummaries";
import type { ProjectUserRating } from "@shared/domain/readModels/project/ProjectUserRating";
import type { User } from "@shared/domain/readModels/project/User";
import type {
  LatestOrDraftAlias,
  RevisionNumberOrAlias,
  Version,
} from "@shared/domain/readModels/project/Version";
import type { UploadedFile } from "@shared/domain/UploadedFile";
import type { WriteAppMetadataJSON } from "@shared/domain/writeModels/AppMetadataJSON";
import { getEntriesWithDefinedValues } from "@shared/util/objectEntries";
import type { Pool } from "pg";
import sql, { join, raw, type Sql } from "sql-template-tag";

const ONE_KILO = 1024;

function dbFileToFileMetadata(
  dbFile: DBFileMetadata,
  project: string,
  versionRevision: RevisionNumberOrAlias
): FileMetadata {
  const { image_width, image_height, version_id, ...dbFileWithoutVersionId } =
    dbFile;
  const size_of_content = Number.parseInt(dbFile.size_of_content, 10);
  const full_path = path.join(dbFile.dir, dbFile.name + dbFile.ext);
  const fileDownloadUrl = getFileDownloadUrl(
    project,
    versionRevision,
    full_path
  );
  const image_data =
    image_width && image_height ? { image_width, image_height } : {};
  return {
    ...convertDatedData(dbFileWithoutVersionId),
    ...image_data,
    size_of_content,
    url: fileDownloadUrl, // TODO profile files/sha endpoint and use that in the urls
    full_path,
    size_formatted: `${(size_of_content / ONE_KILO).toFixed(2)}KB`,
  };
}

function getUpdateAssignmentsSql<T extends object>(changes: T) {
  const changeEntries = getEntriesWithDefinedValues(changes);
  if (!changeEntries.length) {
    return;
  }
  return join(
    changeEntries.map(
      ([key, value]) => sql`${raw(assertValidColumKey(String(key)))}
      =
      ${value}`
    )
  );
}

const parsePath = (pathParts: string[]) => {
  const fullPath = path.join(...pathParts);
  const parsedPath = path.parse(fullPath);
  const { dir, name, ext } = parsedPath;
  return { dir, name, ext };
};

const getVersionQuery = (
  projectSlug: ProjectSlug,
  versionRevision: RevisionNumberOrAlias
): Sql => {
  if (typeof versionRevision === "number") {
    return sql`(select id
                from versions
                where revision = ${versionRevision}
                  and project_slug = ${projectSlug}
                  and published_at is not null)`; // Draft versions should not be accessed via a revision number because we assume immutability when using a revision number
  }
  switch (versionRevision) {
    case "draft":
      return sql`(select id
                  from versions
                  where revision =
                        (select draft_revision from projects where slug = ${projectSlug} and deleted_at is null)
                    and project_slug = ${projectSlug})`;
    case "latest":
      return sql`(select id
                  from versions
                  where revision =
                        (select latest_revision from projects where slug = ${projectSlug} and deleted_at is null)
                    and project_slug = ${projectSlug})`;
  }
};

type ReportType = "install_count" | "launch_count" | "crash_count";

export class PostgreSQLBadgeHubMetadata {
  private readonly pool: Pool = getPool();

  async deleteDraftFile(slug: string, filePath: string): Promise<void> {
    const { dir, name, ext } = parsePath(filePath.split("/"));

    await this.pool.query(sql`update files
                              set deleted_at = now()
                              where version_id = (${getVersionQuery(slug, "draft")})
                                and dir = ${dir}
                                and name = ${name}
                                and ext = ${ext}
                                and deleted_at is null`);
  }

  async getFileMetadata(
    projectSlug: string,
    versionRevision: RevisionNumberOrAlias,
    filePath: string
  ): Promise<FileMetadata | undefined> {
    const { dir, name, ext } = parsePath(filePath.split("/"));
    const {
      rows: [metadata],
    } = await this.pool.query<DBFileMetadata>(sql`select *
                                                  from files
                                                  where version_id = ${getVersionQuery(projectSlug, versionRevision)}
                                                    and dir = ${dir}
                                                    and name = ${name}
                                                    and ext = ${ext}
                                                    and deleted_at is null`);
    if (!metadata) {
      return undefined;
    }
    return dbFileToFileMetadata(metadata, projectSlug, versionRevision);
  }

  async writeDraftFileMetadata(
    projectSlug: ProjectSlug,
    pathParts: string[],
    uploadedFile: UploadedFile,
    sha256: string,
    mockDates?: DBDatedData & DBSoftDeletable
  ): Promise<void> {
    const { dir, name, ext } = parsePath(pathParts);
    const { mimetype, size, image_width, image_height } = uploadedFile;

    await this.pool.query(
      sql`insert into files (version_id, dir, name, ext, mimetype, size_of_content, sha256, image_width, image_height)
          values (${getVersionQuery(projectSlug, "draft")}, ${dir}, ${name}, ${ext}, ${mimetype},
                  ${size}, ${sha256}, ${image_width}, ${image_height})
          on conflict (version_id, dir, name, ext) do update set mimetype        = ${mimetype},
                                                                 size_of_content = ${size},
                                                                 sha256          = ${sha256},
                                                                 image_width     = ${image_width},
                                                                 image_height    = ${image_height},
                                                                 updated_at      = now(),
                                                                 deleted_at      = null`
    );
    if (mockDates) {
      await this.pool.query(sql`update files
                                set created_at = ${mockDates.created_at},
                                    updated_at = ${mockDates.updated_at},
                                    deleted_at = ${mockDates.deleted_at}
                                where version_id = ${getVersionQuery(projectSlug, "draft")}
                                  and dir = ${dir}
                                  and name = ${name}
                                  and ext = ${ext}`);
    }
  }

  async getCategories(): Promise<CategoryName[]> {
    return getAllCategoryNames();
  }

  async refreshReports(): Promise<void> {
    await Promise.all([
      this.pool.query(sql`refresh materialized view project_install_reports`),
      this.pool.query(sql`refresh materialized view project_rating_reports`),
    ]);
  }

  async getStats(): Promise<BadgeHubStats> {
    const projectInstallsP = this.pool.query(
      sql`select COUNT(*)
          from project_install_reports`
    );
    const projectsP = this.pool.query(
      sql`SELECT COUNT(*)
          FROM projects
          WHERE deleted_at IS NULL`
    );
    const projectAuthorsP = this.pool.query(
      sql`SELECT COUNT(DISTINCT idp_user_id)
          FROM projects
          WHERE deleted_at IS NULL`
    );
    const badgesP = this.pool.query(
      sql`SELECT COUNT(*)
          FROM registered_badges`
    );

    const [projectInstalls, projects, projectAuthors, badges] =
      await Promise.all([
        projectInstallsP,
        projectsP,
        projectAuthorsP,
        badgesP,
      ]);

    return {
      crashed_projects: 0,
      crashes: 0,
      installed_projects: 0,
      launched_projects: 0,
      launches: 0,
      projects: Number(projects.rows[0].count),
      installs: Number(projectInstalls.rows[0].count),
      authors: Number(projectAuthors.rows[0].count),
      badges: Number(badges.rows[0].count),
    };
  }

  async insertProject(
    project: Omit<DBInsertProject, keyof DBDatedData>,
    mockDates?: DBDatedData
  ): Promise<void> {
    if (!project.slug.match(VALID_SLUG_REGEX)) {
      throw new UserError(
        `Project slug '${project.slug}' is not valid. It must match the pattern: ${VALID_SLUG_REGEX.source}`
      );
    }
    const alreadyExistingProject = await this.pool.query(
      sql`select 1
          from projects
          where slug = ${project.slug}`
    );
    if (alreadyExistingProject.rows.length) {
      throw new ProjectAlreadyExistsError(project.slug);
    }
    const createdAt = mockDates?.created_at ?? raw("now()");
    const updatedAt = mockDates?.updated_at ?? raw("now()");
    const { keys, values } = getInsertKeysAndValuesSql({
      ...project,
      created_at: createdAt,
      updated_at: updatedAt,
    });

    const appMetadata = {
      name: project.slug,
      badges: getBadgeSlugs().slice(0, 1),
    };
    await this.pool.query(sql`
        with inserted_version as (
            insert
                into versions (project_slug, revision, app_metadata, blur_hash, created_at, updated_at)
                    values (${project.slug}, 1, ${appMetadata}, null, ${createdAt}, ${updatedAt}) returning revision)
        insert
        into projects (${keys}, draft_revision)
        values (${values}, (select revision from inserted_version))`);
  }

  async updateProject(
    projectSlug: ProjectSlug,
    changes: Partial<Omit<ProjectCore, "slug">>
  ): Promise<void> {
    const setters = getUpdateAssignmentsSql(changes);
    if (!setters) {
      return;
    }
    await this.pool.query(sql`update projects
                              set ${setters}
                              where slug = ${projectSlug}
                                and deleted_at is null`);
  }

  async deleteProject(projectSlug: ProjectSlug): Promise<void> {
    await this.pool.query(sql`update projects
                              set deleted_at = now()
                              where slug = ${projectSlug}
                                and deleted_at is null`);
  }

  async publishVersion(
    projectSlug: string,
    mockDate?: TimestampTZ
  ): Promise<void> {
    const fileColumnsForCopyingSql = raw(fileColumnsForCopying.join(", "));
    await this.pool.query(sql`
        with published_version as (
            update versions v
                set published_at = (${mockDate ?? raw("now()")}) , updated_at = (${mockDate ?? raw("now()")})
                where v.id = (${getVersionQuery(projectSlug, "draft")}) returning revision, id, app_metadata, blur_hash),
             new_draft_version as (
                 insert
                     into versions (project_slug, app_metadata, blur_hash, revision, created_at, updated_at)
                         (select project_slug,
                                 app_metadata,
                                 blur_hash,
                                 revision + 1,
                                 (${mockDate ?? raw("now()")}),
                                 (${mockDate ?? raw("now()")})
                          from versions
                          where id = ${getVersionQuery(projectSlug, "draft")})
                         returning revision, id),
             updated_projects as (
                 update projects
                     set latest_revision = (select revision from published_version), draft_revision = (select revision from new_draft_version)
                     where slug = ${projectSlug}
                         and deleted_at is null
                     returning 1),
             copied_files as (
                 insert
                     into files
                         (version_id, ${fileColumnsForCopyingSql})
                         select (select id from new_draft_version),
                                ${fileColumnsForCopyingSql}
                         from files
                         where version_id = (select id from published_version)
                           and deleted_at is null
                         returning 1)
        select 1
    `);
  }

  async getProject(
    projectSlug: string,
    versionRevision: RevisionNumberOrAlias
  ): Promise<undefined | ProjectDetails> {
    const version = await this.getVersion(projectSlug, versionRevision);
    if (!version) {
      return undefined;
    }
    const checkPublishedIfNotDraft =
      versionRevision === "draft"
        ? raw("")
        : raw("and p.latest_revision is not null");
    const dbProject = await this.pool
      .query<DBProject & DBProjectRatingReport>(
        sql`select p.*,
                    prr.average_rating,
                    prr.rating_count
            from projects p
                     left join project_rating_reports prr on p.slug = prr.project_slug
            where p.slug = ${projectSlug}
              and p.deleted_at is null
                ${checkPublishedIfNotDraft}`
      )
      .then((res) => res.rows[0]);
    if (!dbProject) {
      return undefined;
    }

    // Using schema parsing here to clean stuff from the dbProject that haven't defined in our api.
    return detailedProjectSchema.parse({
      ...convertDatedData(dbProject),
      ratings:
        dbProject.average_rating != null && dbProject.rating_count != null
          ? {
              average: Number(dbProject.average_rating),
              count: Number(dbProject.rating_count),
            }
          : undefined,
      version,
    } satisfies ProjectDetails);
  }

  async getVersion(
    projectSlug: ProjectSlug,
    versionRevision: RevisionNumberOrAlias
  ): Promise<Version | undefined> {
    const dbVersion = await this.pool
      .query<DBVersion>(
        sql`select *
            from versions v
            where v.id = (${getVersionQuery(projectSlug, versionRevision)})`
      )
      .then((res) => res.rows[0]);
    if (!dbVersion) {
      return undefined;
    }

    const { id, ...dbVersionWithoutId } = dbVersion;
    return {
      ...stripDatedData(dbVersionWithoutId),
      files: await this._getFilesMetadataForVersion(dbVersion),
      published_at: timestampTZToISODateString(dbVersion.published_at),
    };
  }

  async getBadges(): Promise<BadgeSlug[]> {
    return getBadgeSlugs();
  }

  async getProjectSummaries(
    filter: {
      slugs?: ProjectSlug[];
      pageStart?: number;
      pageLength?: number;
      badge?: BadgeSlug;
      category?: CategoryName;
      excludeCategories?: string[];
      search?: string;
      userId?: User["idp_user_id"];
      orderBy: OrderByOption;
      developmentStatus?: DevelopmentStatus;
    },
    revision?: LatestOrDraftAlias
  ): Promise<ProjectSummary[]> {
    let query = getBaseSelectProjectQuery(revision);
    query = sql`${query}
    where p.deleted_at is null`;

    if (filter.category) {
      const categoryJsonBMatcher = `["${filter.category}"]`;
      query = sql`${query}
and v.app_metadata->'categories' @>
      ${categoryJsonBMatcher}`;
    }

    if (filter.excludeCategories?.length) {
      query = sql`${query}
and not exists (
  select 1
  from jsonb_array_elements_text(coalesce(v.app_metadata->'categories', '[]'::jsonb)) as excluded_category(category_name)
  where excluded_category.category_name = any(${filter.excludeCategories})
)`;
    }

    if (filter.badge) {
      const badgesJsonBMatcher = `["${filter.badge}"]`;
      query = sql`${query}
and v.app_metadata->'badges' @>
      ${badgesJsonBMatcher}`;
    }

    if (filter.developmentStatus) {
      query = sql`${query}
and coalesce(v.app_metadata->>'development_status', 'stable') =
      ${filter.developmentStatus}`;
    }

    if (revision !== "draft") {
      query = sql`${query}
      and v.published_at is not null`;
    }

    if (filter.slugs?.length) {
      if (filter.slugs.length === 1) {
        query = sql`${query}
      and p.slug =
        ${filter.slugs[0]}`;
      } else {
        query = sql`${query}
      and p.slug = any(
        ${filter.slugs}
        )`;
      }
    } else if (revision === "latest") {
      query = sql`${query}
                  and (v.app_metadata->>'hidden')::boolean is not true`;
    }

    if (filter.search) {
      const matcher = `%${filter.search.toLowerCase()}%`;
      //@formatter:off
      query = sql`${query}
                    and (v.app_metadata->>'name' ilike ${matcher} or v.app_metadata->>'description' ilike ${matcher} or p.slug like ${matcher})
      or exists (select 1 from project_latest_categories plc where plc.project_slug = p.slug and plc.category_name ilike ${matcher})`;
      //@formatter:on
    }

    if (filter.userId !== undefined) {
      query = sql`${query}
      and p.idp_user_id =
      ${filter.userId}`;
    }
    switch (filter.orderBy) {
      case "published_at":
        query = sql`${query} order by v.published_at desc`;
        break;
      case "updated_at":
        query = sql`${query} order by v.updated_at desc`;
        break;
      case "installs":
        query = sql`${query} order by distinct_installs desc`;
        break;
      case "average_rating":
        query = sql`${query} order by average_rating desc nulls last, rating_count desc nulls last`;
        break;
      case "rating_count":
        query = sql`${query} order by rating_count desc nulls last, average_rating desc nulls last`;
        break;
      case "name":
        query = sql`${query} order by lower(v.app_metadata->>'name') asc, v.app_metadata->>'name' asc, p.slug asc`;
        break;
    }

    if (filter.pageLength) {
      query = sql`${query}
      limit
      ${filter.pageLength}
      offset
      ${filter.pageStart ?? 0}`;
    }

    const projects: ProjectQueryResponse[] = await this.pool
      .query(query)
      .then((res) => res.rows);

    return projects.map(projectQueryResponseToReadModel);
  }

  async updateDraftMetadata(
    projectSlug: string,
    newAppMetadata: WriteAppMetadataJSON,
    blurHash: string | null,
    mockDates?: DBDatedData
  ): Promise<void> {
    const setters = getUpdateAssignmentsSql({
      app_metadata: newAppMetadata,
      ...mockDates,
      blur_hash: blurHash,
    });
    if (!setters) {
      return;
    }

    const appMetadataUpdateQuery = sql`update versions
                                       set ${setters}
                                       where id = ${getVersionQuery(projectSlug, "draft")}`;
    await this.pool.query(appMetadataUpdateQuery);
  }

  async _getFilesMetadataForVersion(dbVersion: DBVersion) {
    const dbFiles = await this.pool.query<DBFileMetadata>(
      sql`select *
          from files
          where version_id = ${dbVersion.id}
            and deleted_at is null`
    );
    const versionRevision = dbVersion.published_at
      ? dbVersion.revision
      : "draft";
    return dbFiles.rows.map((dbFile) =>
      dbFileToFileMetadata(dbFile, dbVersion.project_slug, versionRevision)
    );
  }

  async registerBadge(id: string, mac: string | undefined) {
    return this.pool.query(
      sql`insert into registered_badges (id, mac)
          values (${id}, ${mac || null})
          on conflict (id)
              do update set mac          = coalesce(registered_badges.mac, excluded.mac),
                            last_seen_at = now();`
    );
  }

  async reportEvent(
    slug: ProjectSlug,
    revision: number,
    badgeId: string,
    reportType: ReportType
  ): Promise<void> {
    const versionIdQuery = sql`(select id
                                from versions
                                where project_slug = ${slug}
                                  and revision = ${revision}
                                  and published_at is not null)`;
    const reportColumn = raw(reportType);

    await this.pool.query(sql`
        insert into registered_badges_version_reports (version_id, registered_badge_id, ${reportColumn})
        values ((${versionIdQuery}), ${badgeId}, 1)
        on conflict (registered_badge_id, version_id) do update set ${reportColumn} = registered_badges_version_reports.${reportColumn} + 1,
                                                                    updated_at        = now()
    `);
  }

  async reportRatingFromBadge(
    slug: ProjectSlug,
    _revision: number,
    badgeId: string,
    rating: number
  ): Promise<void> {
    await this.pool.query(sql`
        insert into project_ratings (project_slug, registered_badge_id, rating)
        values (${slug}, ${badgeId}, ${rating})
        on conflict (project_slug, registered_badge_id)
            where registered_badge_id is not null
            do update set rating     = excluded.rating,
                          updated_at = now()
    `);
  }

  async reportRatingFromUser(
    slug: ProjectSlug,
    userId: User["idp_user_id"],
    rating: number
  ): Promise<void> {
    await this.pool.query(sql`
        insert into project_ratings (project_slug, idp_user_id, rating)
        values (${slug}, ${userId}, ${rating})
        on conflict (project_slug, idp_user_id)
            where idp_user_id is not null
            do update set rating     = excluded.rating,
                          updated_at = now()
    `);
  }

  async getRatingFromUser(
    slug: ProjectSlug,
    userId: User["idp_user_id"]
  ): Promise<ProjectUserRating | null> {
    const { rows } = await this.pool.query<{ rating: number }>(sql`
        select rating
        from project_ratings
        where project_slug = ${slug}
          and idp_user_id = ${userId}
    `);
    const row = rows[0];
    return row ? { rating: Number(row.rating) } : null;
  }

  async getProjectApiTokenMetadata(
    slug: ProjectSlug
  ): Promise<
    Pick<ProjectApiTokenMetadata, "last_used_at" | "created_at"> | undefined
  > {
    const { rows } = await this.pool.query<DBProjectApiKey>(
      sql`select created_at, last_used_at
          from project_api_token
          where project_slug = ${slug}`
    );
    return (
      rows[0] && {
        created_at: timestampTZToISODateString(rows[0].created_at),
        last_used_at: timestampTZToISODateString(rows[0].last_used_at),
      }
    );
  }

  async getProjectApiTokenHash(slug: ProjectSlug): Promise<string | undefined> {
    const { rows } = await this.pool.query<{ key_hash: string }>(
      sql`select key_hash
          from project_api_token
          where project_slug = ${slug}`
    );
    return rows[0]?.key_hash;
  }

  async createProjectApiToken(
    slug: ProjectSlug,
    keyHash: string
  ): Promise<void> {
    await this.pool.query<DBProjectApiKey>(
      sql`insert into project_api_token (project_slug, key_hash)
          values (${slug}, ${keyHash})
          on conflict (project_slug) do update set key_hash     = ${keyHash},
                                                   last_used_at = now(),
                                                   created_at   = now()`
    );
  }

  async revokeProjectApiToken(slug: string) {
    await this.pool.query(
      sql`delete
          from project_api_token
          where project_slug = ${slug}`
    );
  }
}
