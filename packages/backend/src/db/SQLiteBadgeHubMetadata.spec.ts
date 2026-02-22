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

  it("stores report events and registered badges in sqlite stats", async () => {
    const { SQLiteBadgeHubMetadata } = await import("@db/SQLiteBadgeHubMetadata");
    const metadata = new SQLiteBadgeHubMetadata();

    await metadata.registerBadge("badge-1-v1", "30:ed:aa:bb");
    await metadata.registerBadge("badge-1-v1", "30:ed:aa:bb"); // ignore duplicate id

    await metadata.reportEvent("project-a", 1, "badge-1-v1", "install_count");
    await metadata.reportEvent("project-a", 1, "badge-1-v1", "launch_count");
    await metadata.reportEvent("project-b", 2, "badge-1-v1", "install_count");

    const stats = await metadata.getStats();

    expect(stats.badges).toBe(1);
    expect(stats.installs).toBe(2);
    expect(stats.launches).toBe(1);
    expect(stats.crashes).toBe(0);
    expect(stats.installed_projects).toBe(2);
    expect(stats.launched_projects).toBe(1);
    expect(stats.crashed_projects).toBe(0);
  });

  it("refreshReports is a no-op", async () => {
    const { SQLiteBadgeHubMetadata } = await import("@db/SQLiteBadgeHubMetadata");
    const metadata = new SQLiteBadgeHubMetadata();
    await expect(metadata.refreshReports()).resolves.toBeUndefined();
  });
});
