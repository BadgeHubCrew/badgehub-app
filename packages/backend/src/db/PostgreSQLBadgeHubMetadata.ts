// noinspection SqlResolve

import {
  ProjectCore,
  ProjectDetails,
  ProjectSlug,
  ProjectSummary,
} from "@shared/domain/readModels/project/ProjectDetails";
import { User } from "@shared/domain/readModels/project/User";
import {
  LatestOrDraftAlias,
  RevisionNumberOrAlias,
  Version,
} from "@shared/domain/readModels/project/Version";
import { Pool } from "pg";
import { getPool } from "@db/connectionPool";
import { DBInsertProject, DBProject } from "@db/models/project/DBProject";
import sql, { join, raw, Sql } from "sql-template-tag";
import { getEntriesWithDefinedValues } from "@shared/util/objectEntries";
import {
  getBaseSelectProjectQuery,
  ProjectQueryResponse,
  projectQueryResponseToReadModel,
} from "@db/sqlHelpers/projectQuery";
import {
  convertDatedData,
  stripDatedData,
  timestampTZToDate,
} from "@db/sqlHelpers/dbDates";
import { DBVersion } from "@db/models/project/DBVersion";

import {
  assertValidColumKey,
  getInsertKeysAndValuesSql,
} from "@db/sqlHelpers/objectToSQL";
import { UploadedFile } from "@shared/domain/UploadedFile";
import path from "node:path";
import { DBFileMetadata } from "@db/models/project/DBFileMetadata";
import { FileMetadata } from "@shared/domain/readModels/project/FileMetadata";
import { DBDatedData, DBSoftDeletable } from "@db/models/project/DBDatedData";
import { TimestampTZ } from "@db/models/DBTypes";
import { VALID_SLUG_REGEX } from "@shared/contracts/slug";
import { ProjectAlreadyExistsError, UserError } from "@domain/UserError";
import {
  CategoryName,
  getAllCategoryNames,
} from "@shared/domain/readModels/project/Category";
import { BadgeSlug, getBadgeSlugs } from "@shared/domain/readModels/Badge";
import { WriteAppMetadataJSON } from "@shared/domain/writeModels/AppMetadataJSON";
import { getFileDownloadUrl } from "@db/getFileDownloadUrl";
import { BadgeStats } from "@shared/contracts/publicRestContracts";
import { ProjectApiTokenMetadata } from "@shared/domain/readModels/project/ProjectApiToken";
import { DBProjectApiKey } from "@db/models/project/DBProjectApiKey";
import { subtle } from "node:crypto";

const ONE_KILO = 1024;

function dbFileToFileMetadata(
  dbFile: DBFileMetadata,
  project: string,
  versionRevision: RevisionNumberOrAlias
): FileMetadata {
  const { image_width, image_height, version_id, ...dbFileWithoutVersionId } =
    dbFile;
  const size_of_content = Number.parseInt(dbFile.size_of_content);
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
    size_formatted: (size_of_content / ONE_KILO).toFixed(2) + "KB",
  };
}

function getUpdateAssignmentsSql(changes: Object) {
  const changeEntries = getEntriesWithDefinedValues(changes);
  if (!changeEntries.length) {
    return;
  }
  return join(
    changeEntries.map(
      ([key, value]) => sql`${raw(assertValidColumKey(key))}
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

export class PostgreSQLBadgeHubMetadata {
  private readonly pool: Pool = getPool();

  constructor() {}

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

  async getStats(): Promise<BadgeStats> {
    const appsP = this.pool.query(
      sql`SELECT COUNT(*)
          FROM badgehub.projects
          WHERE deleted_at IS NULL`
    );
    const appAuthorsP = this.pool.query(
      sql`SELECT COUNT(DISTINCT idp_user_id)
          FROM badgehub.projects`
    );
    const badgesP = this.pool.query(
      sql`SELECT COUNT(*)
          FROM badgehub.registered_badges`
    );

    const [apps, appAuthors, badges] = await Promise.all([
      appsP,
      appAuthorsP,
      badgesP,
    ]);

    return {
      apps: Number(apps.rows[0].count),
      appAuthors: Number(appAuthors.rows[0].count),
      badges: Number(badges.rows[0].count),
    };
  }

  async insertProject(
    project: Omit<DBInsertProject, keyof DBDatedData>,
    mockDates?: DBDatedData
  ): Promise<void> {
    if (!project.slug.match(VALID_SLUG_REGEX)) {
      throw new UserError(
        `Project slug '${project.slug}' is not valid. It must match the pattern: /^[a-z][a-z_0-9]{2,100}$/`
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
          into versions (project_slug, app_metadata, created_at, updated_at)
            values (${project.slug}, ${appMetadata}, ${createdAt}, ${updatedAt}) returning revision)
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
    await this.pool.query(sql`
      with published_version as (
        update versions v
          set published_at = (${mockDate ?? raw("now()")}) , updated_at = (${mockDate ?? raw("now()")})
          where v.id = (${getVersionQuery(projectSlug, "draft")}) returning revision, id, app_metadata),
           new_draft_version as (
             insert
               into versions (project_slug, app_metadata, revision, created_at, updated_at)
                 (select project_slug,
                         app_metadata,
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
                 (version_id, dir, name, ext, mimetype, size_of_content, sha256, created_at, updated_at,
                  deleted_at)
                 select (select id from new_draft_version),
                        dir,
                        name,
                        ext,
                        mimetype,
                        size_of_content,
                        sha256,
                        created_at,
                        updated_at,
                        deleted_at
                 from files
                 where version_id = (select id from published_version)
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
      versionRevision == "draft"
        ? raw("")
        : raw("and p.latest_revision is not null");
    const dbProject = await this.pool
      .query<DBProject>(
        sql`select *
            from projects p
            where p.slug = ${projectSlug}
              and p.deleted_at is null
              ${checkPublishedIfNotDraft}`
      )
      .then((res) => res.rows[0]);
    if (!dbProject) {
      return undefined;
    }

    return {
      ...convertDatedData(dbProject),
      version,
    };
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
      published_at: timestampTZToDate(dbVersion.published_at),
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
      search?: string;
      userId?: User["idp_user_id"];
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

    if (filter.badge) {
      const badgesJsonBMatcher = `["${filter.badge}"]`;
      query = sql`${query}
and v.app_metadata->'badges' @>
      ${badgesJsonBMatcher}`;
    }

    if (revision !== "draft") {
      query = sql`${query}
      and v.published_at is not null`;
    }

    if (filter.slugs?.length) {
      if (filter.slugs.length == 1) {
        query = sql`${query}
      and p.slug =
        ${filter.slugs[0]}`;
      } else {
        query = sql`${query}
      and p.slug = any(
        ${filter.slugs}
        )`;
      }
    }

    if (filter.search) {
      const matcher = `%${filter.search.toLowerCase()}%`;
      query = sql`${query}
                    and (v.app_metadata->>'name' ilike
      ${matcher}
      or
      v
      .
      app_metadata
      ->>
      'description'
      ilike
      ${matcher}
      or
      p
      .
      slug
      like
      ${matcher}
      )
      or
      exists
      (
      select
      1
      from
      project_latest_categories
      plc
      where
      plc
      .
      project_slug
      =
      p
      .
      slug
      and
      plc
      .
      category_name
      ilike
      ${matcher}
      )`;
    }

    if (filter.userId !== undefined) {
      query = sql`${query}
      and p.idp_user_id =
      ${filter.userId}`;
    }
    query = sql`${query} order by v.updated_at desc`;

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
    mockDates?: DBDatedData
  ): Promise<void> {
    const setters = getUpdateAssignmentsSql({
      ...newAppMetadata,
      ...mockDates,
    });
    if (!setters) {
      return;
    }

    const appMetadataUpdateQuery = sql`update versions
                                       set app_metadata = (${newAppMetadata})
                                       where id = ${getVersionQuery(projectSlug, "draft")}`;
    const queryResult = await this.pool.query(appMetadataUpdateQuery);
    return queryResult as any;
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

  async getProjectApiTokenMetadata(
    slug: ProjectSlug
  ): Promise<ProjectApiTokenMetadata | undefined> {
    const { rows } = await this.pool.query<DBProjectApiKey>(
      sql`select created_at, last_used_at from project_api_token where project_slug = ${slug}`
    );
    return (
      rows[0] && {
        created_at: timestampTZToDate(rows[0].created_at),
        last_used_at: timestampTZToDate(rows[0].last_used_at),
      }
    );
  }

  async createProjectApiToken(slug: ProjectSlug): Promise<string> {
    const key = crypto.randomUUID();

    const keyHash = await subtle.digest("SHA-256", Buffer.from(key));
    await this.pool.query<DBProjectApiKey>(
      sql`insert into project_api_token (project_slug, key_hash)
          values (${slug}, ${keyHash})`
    );
    return key;
  }

  async revokeProjectApiToken(slug: string) {
    await this.pool.query(
      sql`delete
          from project_api_token
          where slug = ${slug}`
    );
  }
}
