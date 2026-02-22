import { BadgeHubMetadataStore } from "@domain/BadgeHubMetadataStore";
import { getSqliteDb } from "@db/sqliteDatabase";
import { getBadgeSlugs } from "@shared/domain/readModels/Badge";
import { getAllCategoryNames } from "@shared/domain/readModels/project/Category";
import { BadgeHubStats } from "@shared/domain/readModels/BadgeHubStats";

type ReportType = "install_count" | "launch_count" | "crash_count";

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
  async publishVersion(..._args: Parameters<BadgeHubMetadataStore["publishVersion"]>): Promise<void> { this.fail("publishVersion"); }
  async getProject(..._args: Parameters<BadgeHubMetadataStore["getProject"]>): Promise<Awaited<ReturnType<BadgeHubMetadataStore["getProject"]>>> { return this.fail("getProject"); }
  async getFileMetadata(..._args: Parameters<BadgeHubMetadataStore["getFileMetadata"]>): Promise<Awaited<ReturnType<BadgeHubMetadataStore["getFileMetadata"]>>> { return this.fail("getFileMetadata"); }

  async getBadges() {
    return getBadgeSlugs();
  }

  async getCategories() {
    return getAllCategoryNames();
  }

  async refreshReports(): Promise<void> {
    // No-op for sqlite for now. PostgreSQL uses a materialized view.
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
      projects: countValue("SELECT COUNT(*) AS count FROM projects WHERE deleted_at IS NULL"),
      installs: eventCount("install_count"),
      crashes: eventCount("crash_count"),
      launches: eventCount("launch_count"),
      installed_projects: distinctProjectsFor("install_count"),
      launched_projects: distinctProjectsFor("launch_count"),
      crashed_projects: distinctProjectsFor("crash_count"),
      authors: countValue(
        "SELECT COUNT(DISTINCT idp_user_id) AS count FROM projects WHERE deleted_at IS NULL AND idp_user_id IS NOT NULL"
      ),
      badges: countValue("SELECT COUNT(*) AS count FROM registered_badges"),
    };
  }

  async getProjectSummaries(..._args: Parameters<BadgeHubMetadataStore["getProjectSummaries"]>): Promise<Awaited<ReturnType<BadgeHubMetadataStore["getProjectSummaries"]>>> { return this.fail("getProjectSummaries"); }
  async updateDraftMetadata(..._args: Parameters<BadgeHubMetadataStore["updateDraftMetadata"]>): Promise<void> { this.fail("updateDraftMetadata"); }
  async writeDraftFileMetadata(..._args: Parameters<BadgeHubMetadataStore["writeDraftFileMetadata"]>): Promise<void> { this.fail("writeDraftFileMetadata"); }
  async deleteDraftFile(..._args: Parameters<BadgeHubMetadataStore["deleteDraftFile"]>): Promise<void> { this.fail("deleteDraftFile"); }

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
