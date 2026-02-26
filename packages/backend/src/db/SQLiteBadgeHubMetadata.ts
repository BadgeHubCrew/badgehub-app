import { BadgeHubMetadataStore } from "@domain/BadgeHubMetadataStore";
import { getSqliteDb } from "@db/sqliteDatabase";
import { getBadgeSlugs } from "@shared/domain/readModels/Badge";
import { getAllCategoryNames } from "@shared/domain/readModels/project/Category";
import { BadgeHubStats } from "@shared/domain/readModels/BadgeHubStats";
import { getFileDownloadUrl } from "@db/getFileDownloadUrl";
import path from "node:path";
import { timestampTZToISODateString } from "@db/sqlHelpers/dbDates";
import { detailedProjectSchema } from "@shared/domain/readModels/project/ProjectDetails";

const ONE_KILO = 1024;
type ReportType = "install_count" | "launch_count" | "crash_count";

function parsePath(pathParts: string[]) {
  const fullPath = path.join(...pathParts);
  const parsedPath = path.parse(fullPath);
  const { dir, name, ext } = parsedPath;
  return { dir, name, ext };
}

export class SQLiteBadgeHubMetadata implements BadgeHubMetadataStore {
  private fail<T>(method: string): T {
    throw new Error(`SQLiteBadgeHubMetadata.${method} is not implemented yet.`);
  }

  async insertProject(...args: Parameters<BadgeHubMetadataStore["insertProject"]>): Promise<void> {
    const [project, mockDates] = args;
    const db = getSqliteDb();
    db.prepare(
      `INSERT INTO projects (slug, git, idp_user_id, created_at, updated_at, deleted_at)
       VALUES (?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP), COALESCE(?, CURRENT_TIMESTAMP), NULL)
       ON CONFLICT(slug)
       DO UPDATE SET
         git = excluded.git,
         idp_user_id = excluded.idp_user_id,
         updated_at = COALESCE(excluded.updated_at, CURRENT_TIMESTAMP),
         deleted_at = NULL`
    ).run(
      project.slug,
      project.git ?? null,
      project.idp_user_id,
      mockDates?.created_at ?? null,
      mockDates?.updated_at ?? null
    );

    db.prepare(
      `INSERT INTO versions (project_slug, revision, app_metadata, published_at)
       VALUES (?, 1, '{}', NULL)
       ON CONFLICT(project_slug, revision) DO NOTHING`
    ).run(project.slug);

    db.prepare(
      `UPDATE projects
       SET draft_revision = COALESCE(draft_revision, 1),
           latest_revision = NULL
       WHERE slug = ?`
    ).run(project.slug);
  }

  async updateProject(...args: Parameters<BadgeHubMetadataStore["updateProject"]>): Promise<void> {
    const [projectSlug, changes] = args;
    const db = getSqliteDb();
    const allowedKeys = new Set(["git", "latest_revision", "draft_revision", "idp_user_id", "deleted_at"]);
    const entries = Object.entries(changes)
      .filter(([, value]) => value !== undefined)
      .filter(([key]) => allowedKeys.has(key));
    if (!entries.length) return;

    const setSql = entries.map(([key]) => `${key} = ?`).join(", ");
    const values = entries.map(([, value]) => value);
    db.prepare(`UPDATE projects SET ${setSql}, updated_at = CURRENT_TIMESTAMP WHERE slug = ?`).run(
      ...values,
      projectSlug
    );
  }

  async deleteProject(...args: Parameters<BadgeHubMetadataStore["deleteProject"]>): Promise<void> {
    const [projectSlug] = args;
    const db = getSqliteDb();
    db.prepare("UPDATE projects SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE slug = ?")
      .run(projectSlug);
  }

  async publishVersion(...args: Parameters<BadgeHubMetadataStore["publishVersion"]>): Promise<void> {
    const [projectSlug, mockDate] = args;
    const db = getSqliteDb();
    const publishAt = mockDate ?? null;

    const project = db
      .prepare("SELECT draft_revision FROM projects WHERE slug = ? AND deleted_at IS NULL")
      .get(projectSlug) as { draft_revision: number | null } | undefined;
    if (!project || project.draft_revision === null) {
      throw new Error(`Project draft not found: ${projectSlug}`);
    }

    db.prepare("UPDATE versions SET published_at = COALESCE(?, CURRENT_TIMESTAMP), updated_at = COALESCE(?, CURRENT_TIMESTAMP) WHERE project_slug = ? AND revision = ?")
      .run(publishAt, publishAt, projectSlug, project.draft_revision);

    const nextDraftRevision = project.draft_revision + 1;
    db.prepare(
      `INSERT INTO versions (project_slug, revision, app_metadata, published_at)
       SELECT project_slug, ?, app_metadata, NULL
       FROM versions
       WHERE project_slug = ? AND revision = ?
       ON CONFLICT(project_slug, revision) DO NOTHING`
    ).run(nextDraftRevision, projectSlug, project.draft_revision);

    db.prepare(
      `INSERT INTO files (version_id, dir, name, ext, mimetype, size_of_content, sha256, image_width, image_height, created_at, updated_at, deleted_at)
       SELECT vTo.id, f.dir, f.name, f.ext, f.mimetype, f.size_of_content, f.sha256, f.image_width, f.image_height,
              COALESCE(?, CURRENT_TIMESTAMP), COALESCE(?, CURRENT_TIMESTAMP), f.deleted_at
       FROM files f
       JOIN versions vFrom ON vFrom.id = f.version_id
       JOIN versions vTo ON vTo.project_slug = vFrom.project_slug AND vTo.revision = ?
       WHERE vFrom.project_slug = ? AND vFrom.revision = ?`
    ).run(publishAt, publishAt, nextDraftRevision, projectSlug, project.draft_revision);

    db.prepare("UPDATE projects SET latest_revision = ?, draft_revision = ? WHERE slug = ?")
      .run(project.draft_revision, nextDraftRevision, projectSlug);
  }

  async getProject(...args: Parameters<BadgeHubMetadataStore["getProject"]>): Promise<Awaited<ReturnType<BadgeHubMetadataStore["getProject"]>>> {
    const [projectSlug, versionRevision] = args;
    const db = getSqliteDb();
    const project = db
      .prepare("SELECT slug, idp_user_id, latest_revision, created_at, updated_at FROM projects WHERE slug = ? AND deleted_at IS NULL")
      .get(projectSlug) as {
      slug: string;
      idp_user_id: string;
      latest_revision: number | null;
      created_at: string;
      updated_at: string;
    } | undefined;

    if (!project) return undefined;

    const versionRow =
      typeof versionRevision === "number"
        ? (db
            .prepare("SELECT revision, app_metadata, published_at FROM versions WHERE project_slug = ? AND revision = ?")
            .get(projectSlug, versionRevision) as { revision: number; app_metadata: string; published_at: string | null } | undefined)
        : (db
            .prepare(
              `SELECT revision, app_metadata, published_at
               FROM versions
               WHERE project_slug = ? AND revision = (
                 SELECT CASE WHEN ? = 'draft' THEN draft_revision ELSE latest_revision END
                 FROM projects WHERE slug = ?
               )`
            )
            .get(projectSlug, versionRevision, projectSlug) as { revision: number; app_metadata: string; published_at: string | null } | undefined);

    if (!versionRow) return undefined;
    if (typeof versionRevision === "number" && (versionRevision <= 0 || !versionRow.published_at)) return undefined;

    const files = db
      .prepare(
        `SELECT dir, name, ext, mimetype, size_of_content, sha256, image_width, image_height, created_at, updated_at
         FROM files
         WHERE version_id = (SELECT id FROM versions WHERE project_slug = ? AND revision = ?)
           AND deleted_at IS NULL`
      )
      .all(projectSlug, versionRow.revision) as Array<{
      dir: string;
      name: string;
      ext: string;
      mimetype: string;
      size_of_content: string;
      sha256: string;
      image_width: number | null;
      image_height: number | null;
      created_at: string;
      updated_at: string;
    }>;

    const mapped = detailedProjectSchema.parse({
      slug: project.slug,
      idp_user_id: project.idp_user_id,
      latest_revision: project.latest_revision,
      created_at: timestampTZToISODateString(project.created_at),
      updated_at: timestampTZToISODateString(project.updated_at),
      version: {
        revision: versionRow.revision,
        project_slug: project.slug,
        app_metadata: JSON.parse(versionRow.app_metadata || "{}"),
        published_at: timestampTZToISODateString(versionRow.published_at),
        files: files.map((f) => {
          const full_path = path.join(f.dir, f.name + f.ext);
          return {
            dir: f.dir,
            name: f.name,
            ext: f.ext,
            mimetype: f.mimetype,
            size_of_content: Number(f.size_of_content),
            sha256: f.sha256,
            image_width: f.image_width ?? undefined,
            image_height: f.image_height ?? undefined,
            created_at: timestampTZToISODateString(f.created_at),
            updated_at: timestampTZToISODateString(f.updated_at),
            size_formatted: (Number(f.size_of_content) / ONE_KILO).toFixed(2) + "KB",
            full_path,
            url: getFileDownloadUrl(project.slug, versionRow.published_at ? versionRow.revision : "draft", full_path),
          };
        }),
      },
    });
    return mapped;
  }

  async getFileMetadata(...args: Parameters<BadgeHubMetadataStore["getFileMetadata"]>): Promise<Awaited<ReturnType<BadgeHubMetadataStore["getFileMetadata"]>>> {
    const [projectSlug, versionRevision, filePath] = args;
    const db = getSqliteDb();
    const { dir, name, ext } = parsePath(filePath.split("/"));

    const row = db
      .prepare(
        `SELECT f.*, v.revision, v.published_at
         FROM files f
                JOIN versions v ON v.id = f.version_id
         WHERE v.project_slug = ?
           AND v.revision = (
             SELECT CASE
                      WHEN ? = 'draft' THEN draft_revision
                      WHEN ? = 'latest' THEN latest_revision
                      ELSE ?
                    END
             FROM projects WHERE slug = ?
           )
           AND f.dir = ?
           AND f.name = ?
           AND f.ext = ?
           AND f.deleted_at IS NULL`
      )
      .get(projectSlug, versionRevision, versionRevision, versionRevision, projectSlug, dir, name, ext) as
      | {
          dir: string;
          name: string;
          ext: string;
          mimetype: string;
          size_of_content: string;
          sha256: string;
          image_width: number | null;
          image_height: number | null;
          created_at: string;
          updated_at: string;
          revision: number;
          published_at: string | null;
        }
      | undefined;

    if (!row) return undefined;
    if (typeof versionRevision === "number" && (versionRevision <= 0 || !row.published_at)) return undefined;
    const full_path = path.join(row.dir, row.name + row.ext);
    return {
      dir: row.dir,
      name: row.name,
      ext: row.ext,
      mimetype: row.mimetype,
      size_of_content: Number(row.size_of_content),
      sha256: row.sha256,
      image_width: row.image_width ?? undefined,
      image_height: row.image_height ?? undefined,
      created_at: timestampTZToISODateString(row.created_at),
      updated_at: timestampTZToISODateString(row.updated_at),
      size_formatted: (Number(row.size_of_content) / ONE_KILO).toFixed(2) + "KB",
      full_path,
      url: getFileDownloadUrl(projectSlug, row.published_at ? row.revision : "draft", full_path),
    };
  }

  async getBadges() {
    return getBadgeSlugs();
  }

  async getCategories() {
    return getAllCategoryNames();
  }

  async refreshReports(): Promise<void> {
    // No-op for sqlite for now. Stats are read directly from sqlite tables.
  }

  async getStats(): Promise<BadgeHubStats> {
    const db = getSqliteDb();

    const countValue = (sqlText: string, params: unknown[] = []): number => {
      const row = db.prepare(sqlText).get(...params) as
        | { count?: number | bigint | string }
        | undefined;
      return Number(row?.count ?? 0);
    };

    const eventCount = (eventType: ReportType): number =>
      countValue("SELECT COUNT(*) AS count FROM event_reports WHERE event_type = ?", [eventType]);

    const distinctProjectsFor = (eventType: ReportType): number =>
      countValue(
        "SELECT COUNT(DISTINCT project_slug) AS count FROM event_reports WHERE event_type = ?",
        [eventType]
      );

    return {
      crashed_projects: distinctProjectsFor("crash_count"),
      crashes: eventCount("crash_count"),
      installed_projects: distinctProjectsFor("install_count"),
      launched_projects: distinctProjectsFor("launch_count"),
      launches: eventCount("launch_count"),
      projects: countValue("SELECT COUNT(*) AS count FROM projects WHERE deleted_at IS NULL"),
      installs: eventCount("install_count"),
      authors: countValue(
        "SELECT COUNT(DISTINCT idp_user_id) AS count FROM projects WHERE deleted_at IS NULL AND idp_user_id IS NOT NULL"
      ),
      badges: countValue("SELECT COUNT(*) AS count FROM registered_badges"),
    };
  }

  async getProjectSummaries(...args: Parameters<BadgeHubMetadataStore["getProjectSummaries"]>): Promise<Awaited<ReturnType<BadgeHubMetadataStore["getProjectSummaries"]>>> {
    const [query, revision] = args;
    const db = getSqliteDb();
    const revisionColumn = revision === "draft" ? "p.draft_revision" : "p.latest_revision";

    const rows = db.prepare(
      `SELECT p.slug,
              p.idp_user_id,
              p.created_at,
              p.updated_at,
              p.git,
              v.revision,
              v.published_at,
              v.app_metadata,
              (
                SELECT COUNT(DISTINCT er.badge_id)
                FROM event_reports er
                WHERE er.project_slug = p.slug
                  AND er.event_type = 'install_count'
              ) AS distinct_installs
       FROM projects p
              LEFT JOIN versions v ON v.project_slug = p.slug AND v.revision = ${revisionColumn}
       WHERE p.deleted_at IS NULL`
    ).all() as Array<{
      slug: string;
      idp_user_id: string;
      created_at: string;
      updated_at: string;
      git?: string;
      revision: number | null;
      published_at: string | null;
      app_metadata: string | null;
      distinct_installs: number | string;
    }>;

    let summaries = rows
      .filter((r) => r.revision !== null)
      .map((r) => {
        const metadata = JSON.parse(r.app_metadata || "{}") as Record<string, any>;
        const effectiveRevision = r.revision as number;
        const categories = Array.isArray(metadata.categories)
          ? (metadata.categories.length > 0 ? metadata.categories : ["Uncategorised"])
          : metadata.categories;
        return {
          slug: r.slug,
          idp_user_id: r.idp_user_id,
          name: metadata.name ?? r.slug,
          published_at: timestampTZToISODateString(r.published_at ?? undefined),
          installs: Number(r.distinct_installs ?? 0),
          icon_map: metadata.icon_map
            ? Object.fromEntries(
                Object.entries(metadata.icon_map).map(([key, fullPath]) => [
                  key,
                  {
                    full_path: fullPath,
                    url: getFileDownloadUrl(r.slug, r.published_at ? effectiveRevision : "draft", String(fullPath)),
                  },
                ])
              )
            : undefined,
          license_type: metadata.license_type,
          categories,
          badges: metadata.badges,
          description: metadata.description,
          revision: effectiveRevision,
          hidden: metadata.hidden,
        };
      });

    if (revision === "latest") {
      summaries = summaries.filter((s) => Boolean(s.published_at));
      if (!query.slugs?.length) {
        summaries = summaries.filter((s) => !s.hidden);
      }
    }

    if (query.badge) summaries = summaries.filter((s) => s.badges?.includes(query.badge!));
    if (query.category) summaries = summaries.filter((s) => s.categories?.includes(query.category!));
    if (query.search) {
      const searchLower = query.search.toLowerCase();
      summaries = summaries.filter((s) => {
        const searchableText = [s.name, s.description ?? "", ...(s.categories ?? [])]
          .join(" ")
          .toLowerCase();
        return searchableText.includes(searchLower);
      });
    }
    if (query.slugs?.length) summaries = summaries.filter((s) => query.slugs!.includes(s.slug));
    if (query.userId) summaries = summaries.filter((s) => s.idp_user_id === query.userId);

    if (query.orderBy === "installs") summaries.sort((a, b) => b.installs - a.installs);
    if (query.orderBy === "published_at") summaries.sort((a, b) => (b.published_at ?? "").localeCompare(a.published_at ?? ""));
    if (query.orderBy === "updated_at") summaries.sort((a, b) => b.revision - a.revision);

    const start = query.pageStart ?? 0;
    const end = query.pageLength ? start + query.pageLength : undefined;
    return summaries.slice(start, end) as Awaited<ReturnType<BadgeHubMetadataStore["getProjectSummaries"]>>;
  }

  async updateDraftMetadata(...args: Parameters<BadgeHubMetadataStore["updateDraftMetadata"]>): Promise<void> {
    const [slug, newAppMetadata] = args;
    const db = getSqliteDb();
    db.prepare(
      `UPDATE versions
       SET app_metadata = ?, updated_at = CURRENT_TIMESTAMP
       WHERE project_slug = ?
         AND revision = (SELECT draft_revision FROM projects WHERE slug = ?)`
    ).run(JSON.stringify(newAppMetadata ?? {}), slug, slug);
  }

  async writeDraftFileMetadata(...args: Parameters<BadgeHubMetadataStore["writeDraftFileMetadata"]>): Promise<void> {
    const [slug, pathParts, uploadedFile, sha256] = args;
    const db = getSqliteDb();
    const { dir, name, ext } = parsePath(pathParts);
    db.prepare(
      `INSERT INTO files (version_id, dir, name, ext, mimetype, size_of_content, sha256, image_width, image_height, deleted_at)
       VALUES (
         (SELECT id FROM versions WHERE project_slug = ? AND revision = (SELECT draft_revision FROM projects WHERE slug = ?)),
         ?, ?, ?, ?, ?, ?, ?, ?, NULL
       )
       ON CONFLICT(version_id, dir, name, ext)
       DO UPDATE SET
         mimetype = excluded.mimetype,
         size_of_content = excluded.size_of_content,
         sha256 = excluded.sha256,
         image_width = excluded.image_width,
         image_height = excluded.image_height,
         deleted_at = NULL,
         updated_at = CURRENT_TIMESTAMP`
    ).run(
      slug,
      slug,
      dir,
      name,
      ext,
      uploadedFile.mimetype,
      uploadedFile.size,
      sha256,
      uploadedFile.image_width ?? null,
      uploadedFile.image_height ?? null
    );
  }

  async deleteDraftFile(...args: Parameters<BadgeHubMetadataStore["deleteDraftFile"]>): Promise<void> {
    const [slug, filePath] = args;
    const { dir, name, ext } = parsePath(filePath.split("/"));
    const db = getSqliteDb();
    db.prepare(
      `UPDATE files
       SET deleted_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE version_id = (
         SELECT id FROM versions WHERE project_slug = ? AND revision = (SELECT draft_revision FROM projects WHERE slug = ?)
       )
       AND dir = ?
       AND name = ?
       AND ext = ?`
    ).run(slug, slug, dir, name, ext);
  }

  async registerBadge(...args: Parameters<BadgeHubMetadataStore["registerBadge"]>): Promise<void> {
    const [flashId, mac] = args;
    const db = getSqliteDb();
    db.prepare(
      `INSERT INTO registered_badges (id, mac)
       VALUES (?, ?)
       ON CONFLICT(id)
       DO UPDATE SET
         mac = COALESCE(registered_badges.mac, excluded.mac),
         last_seen_at = CURRENT_TIMESTAMP`
    ).run(flashId, mac ?? null);
  }

  async reportEvent(...args: Parameters<BadgeHubMetadataStore["reportEvent"]>): Promise<void> {
    const [slug, revision, badgeId, eventType] = args;
    const db = getSqliteDb();
    db.prepare(
      "INSERT INTO event_reports (project_slug, revision, badge_id, event_type) VALUES (?, ?, ?, ?)"
    ).run(slug, revision, badgeId, eventType);
  }

  async revokeProjectApiToken(...args: Parameters<BadgeHubMetadataStore["revokeProjectApiToken"]>) {
    const [slug] = args;
    const db = getSqliteDb();
    db.prepare("DELETE FROM project_api_token WHERE project_slug = ?").run(slug);
  }

  async getProjectApiTokenMetadata(...args: Parameters<BadgeHubMetadataStore["getProjectApiTokenMetadata"]>) {
    const [slug] = args;
    const db = getSqliteDb();
    const row = db
      .prepare("SELECT created_at, last_used_at FROM project_api_token WHERE project_slug = ?")
      .get(slug) as { created_at: string; last_used_at: string | null } | undefined;
    return row;
  }

  async createProjectApiToken(...args: Parameters<BadgeHubMetadataStore["createProjectApiToken"]>) {
    const [slug, tokenHash] = args;
    const db = getSqliteDb();
    db.prepare(
      `INSERT INTO project_api_token (project_slug, key_hash, created_at, last_used_at)
       VALUES (?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       ON CONFLICT(project_slug)
       DO UPDATE SET
         key_hash = excluded.key_hash,
         created_at = CURRENT_TIMESTAMP,
         last_used_at = CURRENT_TIMESTAMP`
    ).run(slug, tokenHash);
  }

  async getProjectApiTokenHash(...args: Parameters<BadgeHubMetadataStore["getProjectApiTokenHash"]>) {
    const [slug] = args;
    const db = getSqliteDb();
    const row = db
      .prepare("SELECT key_hash FROM project_api_token WHERE project_slug = ?")
      .get(slug) as { key_hash: string } | undefined;
    return row?.key_hash;
  }
}
