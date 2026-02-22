import { BadgeHubMetadataStore } from "@domain/BadgeHubMetadataStore";
import { getSqliteDb } from "@db/sqliteDatabase";
import { getBadgeSlugs } from "@shared/domain/readModels/Badge";
import { getAllCategoryNames } from "@shared/domain/readModels/project/Category";
import { BadgeHubStats } from "@shared/domain/readModels/BadgeHubStats";

type ReportType = "install_count" | "launch_count" | "crash_count";

export class SQLiteBadgeHubMetadata implements BadgeHubMetadataStore {
  private fail(method: string): never {
    throw new Error(`SQLiteBadgeHubMetadata.${method} is not implemented yet.`);
  }

  insertProject(..._args: Parameters<BadgeHubMetadataStore["insertProject"]>) { this.fail("insertProject"); }
  updateProject(..._args: Parameters<BadgeHubMetadataStore["updateProject"]>) { this.fail("updateProject"); }
  deleteProject(..._args: Parameters<BadgeHubMetadataStore["deleteProject"]>) { this.fail("deleteProject"); }
  publishVersion(..._args: Parameters<BadgeHubMetadataStore["publishVersion"]>) { this.fail("publishVersion"); }
  getProject(..._args: Parameters<BadgeHubMetadataStore["getProject"]>) { this.fail("getProject"); }
  getFileMetadata(..._args: Parameters<BadgeHubMetadataStore["getFileMetadata"]>) { this.fail("getFileMetadata"); }

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

  getProjectSummaries(..._args: Parameters<BadgeHubMetadataStore["getProjectSummaries"]>) { this.fail("getProjectSummaries"); }
  updateDraftMetadata(..._args: Parameters<BadgeHubMetadataStore["updateDraftMetadata"]>) { this.fail("updateDraftMetadata"); }
  writeDraftFileMetadata(..._args: Parameters<BadgeHubMetadataStore["writeDraftFileMetadata"]>) { this.fail("writeDraftFileMetadata"); }
  deleteDraftFile(..._args: Parameters<BadgeHubMetadataStore["deleteDraftFile"]>) { this.fail("deleteDraftFile"); }

  async registerBadge(...args: Parameters<BadgeHubMetadataStore["registerBadge"]>): Promise<void> {
    const [flashId, mac] = args;
    const db = getSqliteDb();
    db.prepare("INSERT OR IGNORE INTO registered_badges (id, mac) VALUES (?, ?)").run(flashId, mac ?? null);
  }

  async reportEvent(...args: Parameters<BadgeHubMetadataStore["reportEvent"]>): Promise<void> {
    const [slug, revision, badgeId, eventType] = args;
    const db = getSqliteDb();
    db.prepare(
      "INSERT INTO event_reports (project_slug, revision, badge_id, event_type) VALUES (?, ?, ?, ?)"
    ).run(slug, revision, badgeId, eventType);
  }

  revokeProjectApiToken(..._args: Parameters<BadgeHubMetadataStore["revokeProjectApiToken"]>) { this.fail("revokeProjectApiToken"); }
  getProjectApiTokenMetadata(..._args: Parameters<BadgeHubMetadataStore["getProjectApiTokenMetadata"]>) { this.fail("getProjectApiTokenMetadata"); }
  createProjectApiToken(..._args: Parameters<BadgeHubMetadataStore["createProjectApiToken"]>) { this.fail("createProjectApiToken"); }
  getProjectApiTokenHash(..._args: Parameters<BadgeHubMetadataStore["getProjectApiTokenHash"]>) { this.fail("getProjectApiTokenHash"); }
}
