import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

let tempDir: string;

beforeEach(async () => {
  tempDir = await mkdtemp(path.join(tmpdir(), "badgehub-sqlite-meta-"));
  process.env.DATABASE_ENGINE = "sqlite";
  process.env.SQLITE_DB_PATH = path.join(tempDir, "badgehub.sqlite");
  vi.resetModules();
});

afterEach(async () => {
  await rm(tempDir, { recursive: true, force: true });
});

describe("SQLiteBadgeHubMetadata", () => {
  it("returns badges and categories from shared config", async () => {
    const { SQLiteBadgeHubMetadata } = await import("@db/SQLiteBadgeHubMetadata");
    const metadata = new SQLiteBadgeHubMetadata();

    const badges = await metadata.getBadges();
    const categories = await metadata.getCategories();

    expect(badges.length).toBeGreaterThan(0);
    expect(categories.length).toBeGreaterThan(0);
  });

  it("stores report events, badges and projects in sqlite stats", async () => {
    const { SQLiteBadgeHubMetadata } = await import("@db/SQLiteBadgeHubMetadata");
    const metadata = new SQLiteBadgeHubMetadata();

    await metadata.insertProject({ slug: "project-a", idp_user_id: "user-1" });
    await metadata.insertProject({ slug: "project-b", idp_user_id: "user-2" });
    await metadata.deleteProject("project-b");

    await metadata.registerBadge("badge-1-v1", "30:ed:aa:bb");
    await metadata.registerBadge("badge-1-v1", "30:ed:aa:bb"); // duplicate id should upsert

    await metadata.reportEvent("project-a", 1, "badge-1-v1", "install_count");
    await metadata.reportEvent("project-a", 1, "badge-1-v1", "launch_count");
    await metadata.reportEvent("project-b", 2, "badge-1-v1", "install_count");

    const stats = await metadata.getStats();

    expect(stats.projects).toBe(1);
    expect(stats.authors).toBe(1);
    expect(stats.badges).toBe(1);
    expect(stats.installs).toBe(2);
    expect(stats.launches).toBe(1);
    expect(stats.crashes).toBe(0);
    expect(stats.installed_projects).toBe(2);
    expect(stats.launched_projects).toBe(1);
    expect(stats.crashed_projects).toBe(0);
  });

  it("updates project rows with allowed columns only", async () => {
    const { SQLiteBadgeHubMetadata } = await import("@db/SQLiteBadgeHubMetadata");
    const { getSqliteDb } = await import("@db/sqliteDatabase");
    const metadata = new SQLiteBadgeHubMetadata();

    await metadata.insertProject({ slug: "project-upd", idp_user_id: "user-1" });
    await metadata.updateProject("project-upd", {
      git: "https://example.com/repo.git",
      latest_revision: 5,
      // @ts-expect-error testing runtime filtering of unknown column
      made_up_column: "ignore-me",
    });

    const row = getSqliteDb()
      .prepare("SELECT git, latest_revision FROM projects WHERE slug = ?")
      .get("project-upd") as { git: string; latest_revision: number };

    expect(row.git).toBe("https://example.com/repo.git");
    expect(row.latest_revision).toBe(5);
  });

  it("manages project api token lifecycle", async () => {
    const { SQLiteBadgeHubMetadata } = await import("@db/SQLiteBadgeHubMetadata");
    const metadata = new SQLiteBadgeHubMetadata();

    await metadata.createProjectApiToken("project-a", "hash-1");
    expect(await metadata.getProjectApiTokenHash("project-a")).toBe("hash-1");

    const tokenMetadata = await metadata.getProjectApiTokenMetadata("project-a");
    expect(tokenMetadata?.created_at).toBeTruthy();
    expect(tokenMetadata?.last_used_at).toBeTruthy();

    await metadata.revokeProjectApiToken("project-a");
    expect(await metadata.getProjectApiTokenHash("project-a")).toBeUndefined();
  });

  it("writes draft metadata + files and reads them through getProject/getFileMetadata", async () => {
    const { SQLiteBadgeHubMetadata } = await import("@db/SQLiteBadgeHubMetadata");
    const metadata = new SQLiteBadgeHubMetadata();

    await metadata.insertProject({ slug: "project-files", idp_user_id: "user-1" });
    await metadata.updateDraftMetadata("project-files", {
      name: "Project Files",
      categories: ["Games"],
      badges: ["why2025"],
      icon_map: { "64x64": "icons/app.png" },
    });

    await metadata.writeDraftFileMetadata(
      "project-files",
      ["icons", "app.png"],
      { mimetype: "image/png", size: 12, fileContent: new Uint8Array([1, 2, 3]), image_width: 64, image_height: 64 },
      "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
    );

    const file = await metadata.getFileMetadata("project-files", "draft", "icons/app.png");
    expect(file?.full_path).toBe(path.join("icons", "app.png"));

    const project = await metadata.getProject("project-files", "draft");
    expect(project?.version.app_metadata.name).toBe("Project Files");
    expect(project?.version.files.length).toBe(1);

    await metadata.publishVersion("project-files");
    const latest = await metadata.getProject("project-files", "latest");
    expect(latest?.latest_revision).toBe(1);
    expect(latest?.version.published_at).toBeTruthy();
  }, 15000);

  it("returns project summaries with filtering", async () => {
    const { SQLiteBadgeHubMetadata } = await import("@db/SQLiteBadgeHubMetadata");
    const metadata = new SQLiteBadgeHubMetadata();

    await metadata.insertProject({ slug: "summary-a", idp_user_id: "user-1" });
    await metadata.updateDraftMetadata("summary-a", {
      name: "Summary A",
      categories: ["Games"],
      badges: ["why2025"],
      description: "test summary",
    });

    const all = await metadata.getProjectSummaries({ orderBy: "installs" }, "draft");
    expect(all.some((s) => s.slug === "summary-a")).toBe(true);

    const filtered = await metadata.getProjectSummaries(
      { orderBy: "installs", badge: "why2025", category: "Games", search: "summary" },
      "draft"
    );
    expect(filtered.some((s) => s.slug === "summary-a")).toBe(true);
  });

  it("refreshReports is a no-op", async () => {
    const { SQLiteBadgeHubMetadata } = await import("@db/SQLiteBadgeHubMetadata");
    const metadata = new SQLiteBadgeHubMetadata();
    await expect(metadata.refreshReports()).resolves.toBeUndefined();
  });
});
