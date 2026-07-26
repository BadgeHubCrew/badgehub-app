import { randomUUID } from "node:crypto";
import { createExpressServer } from "@createExpressServer";
import { PostgreSQLBadgeHubFiles } from "@db/PostgreSQLBadgeHubFiles";
import { PostgreSQLBadgeHubMetadata } from "@db/PostgreSQLBadgeHubMetadata";
import { BadgeHubData } from "@domain/BadgeHubData";
import type { BadgeHubStats } from "@shared/domain/readModels/BadgeHubStats";
import type { AppMetadataJSON } from "@shared/domain/readModels/project/AppMetadataJSON";
import type { ProjectDetails } from "@shared/domain/readModels/project/ProjectDetails";
import type { ProjectLatestRevisions } from "@shared/domain/readModels/project/ProjectRevision";
import type { ProjectSummary } from "@shared/domain/readModels/project/ProjectSummaries";
import { isInDebugMode } from "@util/debug";
import type express from "express";
import request from "supertest";
import { beforeEach, describe, expect, test } from "vitest";

function expectRatingsAggregate(
  ratings: ProjectDetails["ratings"] | ProjectSummary["ratings"]
) {
  if (ratings === undefined) {
    return;
  }

  expect(ratings).toStrictEqual({
    average: expect.any(Number),
    count: expect.any(Number),
  });
}

describe("Public API Routes", {
  timeout: isInDebugMode() ? 3600_000 : undefined,
}, () => {
  let app: ReturnType<typeof express>;
  beforeEach(() => {
    app = createExpressServer();
  });

  test("GET /api/v3/badges", async () => {
    const res = await request(app).get("/api/v3/badges");
    expect(res.statusCode).toBe(200);
    expect(res.body).toContain("why2025");
  });

  test("GET /api/v3/project-summaries", async () => {
    const res = await request(app).get("/api/v3/project-summaries");
    expect(res.statusCode).toBe(200);
    expect(
      res.body.find((app: ProjectSummary) => app.name === "PixelPulse")
    ).toBeDefined();
    const codecraftSummary = res.body.find(
      (app: ProjectSummary) => app.slug === "codecraft"
    ) as ProjectSummary;
    const { ratings, ...codecraftSummaryWithoutRatings } = codecraftSummary;
    expectRatingsAggregate(ratings);
    expect(codecraftSummaryWithoutRatings).toMatchInlineSnapshot(
      {
        installs: expect.any(Number),
      },
      `
      {
        "badges": [
          "mch2022",
          "why2025",
        ],
        "categories": [
          "Event related",
          "Games",
        ],
        "description": "With CodeCraft, you can do interesting things with the sensors.",
        "development_status": "stable",
        "icon_map": {
          "64x64": {
            "full_path": "icon5.png",
            "url": "http://localhost:8081/api/v3/projects/codecraft/rev1/files/icon5.png",
          },
        },
        "idp_user_id": "CyberSherpa",
        "installs": Any<Number>,
        "license_type": "MIT",
        "name": "CodeCraft",
        "published_at": "2024-05-23T14:01:16.975Z",
        "revision": 1,
        "slug": "codecraft",
      }
    `
    );
  });

  test("GET /api/v3/project-summaries should not contain unpublished apps", async () => {
    const res = await request(app).get("/api/v3/project-summaries");
    expect(res.statusCode).toBe(200);
    expect(
      res.body.find((app: ProjectSummary) => !app.published_at)
    ).toBeUndefined();
  });

  test("GET /api/v3/project-summaries should filter by development status", async () => {
    const res = await request(app).get(
      "/api/v3/project-summaries?developmentStatus=stable"
    );
    expect(res.statusCode).toBe(200);
    expect(
      res.body.find((app: ProjectSummary) => app.slug === "codecraft")
    ).toMatchObject({
      development_status: "stable",
      slug: "codecraft",
    });
  });

  test("GET /api/v3/project-summaries rejects invalid development status", async () => {
    const res = await request(app).get(
      "/api/v3/project-summaries?developmentStatus=beta"
    );
    expect(res.statusCode).toBe(400);
  });

  test("GET /api/v3/project-summaries should contain apps with non-0 number of installs", async () => {
    const res = await request(app).get("/api/v3/project-summaries");
    expect(res.statusCode).toBe(200);
    expect(
      res.body.filter((app: ProjectSummary) => app.installs).length
    ).toBeGreaterThan(0);
  });

  test("GET /api/v3/project-summaries should allow sorting by installs", async () => {
    const res = await request(app).get(
      "/api/v3/project-summaries?orderBy=installs"
    );
    expect(res.statusCode).toBe(200);
    const summaries = res.body as ProjectSummary[];
    const sortedExpected = summaries
      .map((p) => p.installs)
      .sort((a, b) => b - a);
    expect(summaries.map((app: ProjectSummary) => app.installs)).toStrictEqual(
      sortedExpected
    );
  });

  test.each(["average_rating", "rating_count"] as const)(
    "GET /api/v3/project-summaries should allow sorting by %s",
    async (orderBy) => {
      const res = await request(app).get(
        `/api/v3/project-summaries?orderBy=${orderBy}`
      );
      expect(res.statusCode).toBe(200);
      expect(res.body.length).toBeGreaterThan(0);
    }
  );

  test("GET /api/v3/project-summaries should allow sorting by name", async () => {
    const res = await request(app).get(
      "/api/v3/project-summaries?orderBy=name"
    );
    expect(res.statusCode).toBe(200);
    const summaries = res.body as ProjectSummary[];
    const collator = new Intl.Collator(undefined, {
      ignorePunctuation: true,
      sensitivity: "base",
    });
    const sortedExpected = summaries
      .map((p) => p.name)
      .sort((a, b) => collator.compare(a, b));
    expect(summaries.map((app: ProjectSummary) => app.name)).toStrictEqual(
      sortedExpected
    );
  });

  test("GET /api/v3/project-summaries should allow sorting by updated_at", async () => {
    const res = await request(app).get(
      "/api/v3/project-summaries?slugs=codecraft,pixelpulse,bitblast,nanogames,electraplay&orderBy=updated_at"
    );
    expect(res.statusCode).toBe(200);
    expect(res.body.map((app: ProjectSummary) => app.slug)).toStrictEqual([
      "codecraft",
      "bitblast",
      "pixelpulse",
      "nanogames",
      "electraplay",
    ]);
  });

  test("reporting an install should update installs in project summaries", async () => {
    const projectSlug = "codecraft";
    const baselineRes = await request(app).get("/api/v3/project-summaries");
    expect(baselineRes.statusCode).toBe(200);
    const baselineSummaries = baselineRes.body as ProjectSummary[];
    const baselineInstalls = baselineSummaries.find(
      (summary) => summary.slug === projectSlug
    )?.installs;
    expect(typeof baselineInstalls).toBe("number");

    const reportRes = await request(app)
      .post(`/api/v3/projects/${projectSlug}/rev1/report/install`)
      .query({ id: `badge-${randomUUID()}` });
    expect(reportRes.statusCode).toBe(204);

    await new PostgreSQLBadgeHubMetadata().refreshReports();

    const updatedRes = await request(app).get("/api/v3/project-summaries");
    expect(updatedRes.statusCode).toBe(200);
    const updatedSummaries = updatedRes.body as ProjectSummary[];
    const updatedInstalls = updatedSummaries.find(
      (summary) => summary.slug === projectSlug
    )?.installs;

    expect(updatedInstalls).toBeGreaterThanOrEqual(
      (baselineInstalls as number) + 1
    );
  });

  test("reporting a rating should update ratings in project summaries", async () => {
    const projectSlug = "codecraft";
    const baselineRes = await request(app).get("/api/v3/project-summaries");
    expect(baselineRes.statusCode).toBe(200);
    const baselineSummaries = baselineRes.body as ProjectSummary[];
    const baselineRatings = baselineSummaries.find(
      (summary) => summary.slug === projectSlug
    )?.ratings;
    const baselineRatingCount = baselineRatings?.count ?? 0;

    const reportRes = await request(app)
      .post(`/api/v3/projects/${projectSlug}/rev1/report/rating`)
      .query({ id: `badge-${randomUUID()}` })
      .send({ rating: 5 });
    expect(reportRes.statusCode).toBe(204);

    await new PostgreSQLBadgeHubMetadata().refreshReports();

    const updatedRes = await request(app).get("/api/v3/project-summaries");
    expect(updatedRes.statusCode).toBe(200);
    const updatedSummaries = updatedRes.body as ProjectSummary[];
    const updatedRatings = updatedSummaries.find(
      (summary) => summary.slug === projectSlug
    )?.ratings;

    expect(updatedRatings).not.toBeNull();
    expect(updatedRatings?.count).toBeGreaterThanOrEqual(
      baselineRatingCount + 1
    );
  });

  test("reporting an install should accept a JSON string body", async () => {
    const projectSlug = "codecraft";

    const reportRes = await request(app)
      .post(
        `/api/v3/projects/${projectSlug}/rev1/report/install?id=${randomUUID()}`
      )
      .set("Content-Type", "application/json")
      .send('"some string"');

    expect(reportRes.statusCode).toBe(204);
  });

  test("GET /api/v3/project-summaries should sort by default using published_at", async () => {
    const res = await request(app).get("/api/v3/project-summaries");
    expect(res.statusCode).toBe(200);
    const summaries = res.body as ProjectSummary[];

    const sortedExpected = summaries
      .map((p) => p.published_at)
      .sort((a, b) => Date.parse(b ?? "") - Date.parse(a ?? ""));
    expect(
      summaries.map((app: ProjectSummary) => app.published_at)
    ).toStrictEqual(sortedExpected);
  });

  test("GET /api/v3/project-summaries should not contain hidden apps unless the slug is given", async () => {
    const res = await request(app).get("/api/v3/project-summaries");
    expect(res.statusCode).toBe(200);
    expect(
      res.body.find((app: ProjectSummary) => app.slug === "nanogames")
    ).toBeUndefined();
    expect(res.body.find((app: ProjectSummary) => app.hidden)).toBeUndefined();

    const withSlugRes = await request(app).get(
      "/api/v3/project-summaries?slugs=nanogames"
    );
    expect(withSlugRes.statusCode).toBe(200);
    expect(
      withSlugRes.body.find((app: ProjectSummary) => app.slug === "nanogames")
        ?.hidden
    ).toBe(true);
  });

  test("GET /api/v3/project-summaries with device filter", async () => {
    const res = await request(app).get(
      "/api/v3/project-summaries?badge=why2025"
    );
    expect(res.statusCode).toBe(200);
    expect(
      res.body.every((app: ProjectSummary) => app.badges?.includes("why2025"))
    ).toBe(true);
    expect(
      res.body.find((app: ProjectSummary) => app.slug === "codecraft")
    ).toBeDefined();
  });

  test("GET /api/v3/project-summaries with category filter", async () => {
    const res = await request(app).get(
      "/api/v3/project-summaries?category=Silly"
    );
    expect(res.statusCode).toBe(200);
    expect(res.body.length).toMatchInlineSnapshot(`4`);
    expect(
      res.body.every((app: ProjectSummary) => app.categories?.includes("Silly"))
    ).toBe(true);
    expect(
      res.body.find((app: ProjectSummary) => app.categories?.includes("Silly"))
    ).toBeDefined();
  });

  test("GET /api/v3/project-summaries with category exclusion", async () => {
    const res = await request(app).get(
      "/api/v3/project-summaries?excludeCategories=Silly"
    );
    expect(res.statusCode).toBe(200);
    expect(
      res.body.some((app: ProjectSummary) => app.categories?.includes("Silly"))
    ).toBe(false);
    expect(
      res.body.find((app: ProjectSummary) => app.slug === "codecraft")
    ).toBeDefined();
  });

  test("GET /api/v3/project-summaries ignores unknown excluded categories", async () => {
    const baselineRes = await request(app).get("/api/v3/project-summaries");
    const res = await request(app).get(
      "/api/v3/project-summaries?excludeCategories=RemovedCategory"
    );
    expect(res.statusCode).toBe(200);
    expect(res.body.map((app: ProjectSummary) => app.slug)).toStrictEqual(
      baselineRes.body.map((app: ProjectSummary) => app.slug)
    );
  });

  test("GET /api/v3/project-summaries with category name in search", async () => {
    const res = await request(app).get(
      "/api/v3/project-summaries?search=Uncategorised"
    );
    expect(res.statusCode).toBe(200);
    expect(res.body.length).toMatchInlineSnapshot(`2`);
    expect(
      res.body.every((app: ProjectSummary) =>
        app.categories?.includes("Uncategorised")
      )
    ).toBe(true);
    expect(
      res.body.find((app: ProjectSummary) =>
        app.categories?.includes("Uncategorised")
      )
    ).toBeDefined();
  });

  test("GET /api/v3/project-summaries with search query filter searching for name", async () => {
    const res = await request(app).get(
      "/api/v3/project-summaries?search=oDecrafTE"
    );
    expect(res.statusCode).toBe(200);
    const result: ProjectSummary[] = res.body;
    expect(result.length).toBe(1);
    expect(result[0]?.slug).toEqual("codecrafter");
  });

  test("GET /api/v3/project-summaries with search query filter searching for description", async () => {
    const res = await request(app).get(
      "/api/v3/project-summaries?search=" +
        encodeURIComponent("interesting things")
    );
    expect(res.statusCode).toBe(200);
    const result: ProjectSummary[] = res.body;
    expect(result.length).toBeGreaterThanOrEqual(1);
    expect(
      result.every((app: ProjectSummary) =>
        app.description?.includes("interesting things")
      )
    ).toBe(true);
  });

  test("GET /api/v3/project-summaries with device and category filters", async () => {
    const res = await request(app).get(
      "/api/v3/project-summaries?badge=troopers23&category=Silly"
    );
    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
    expect(
      res.body.every(
        (app: ProjectSummary) =>
          app.badges?.includes("troopers23") &&
          app.categories?.includes("Silly")
      )
    ).toBe(true);
    expect(
      res.body.find((app: ProjectSummary) => app.categories?.includes("Silly"))
    ).toBeDefined();
  });

  test("GET /api/v3/project-summaries?slugs=codecraft,codecrafter", async () => {
    const res = await request(app).get(
      "/api/v3/project-summaries?slugs=codecraft,codecrafter"
    );
    expect(res.statusCode).toBe(200);
    expect(res.body.map((p: ProjectSummary) => p.slug)).toEqual([
      "codecraft",
      "codecrafter",
    ]);
  });

  test("GET /api/v3/project-summaries?slugs=codecraft", async () => {
    const res = await request(app).get(
      "/api/v3/project-summaries?slugs=codecraft"
    );
    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body.map((p: ProjectSummary) => p.slug)).toEqual(["codecraft"]);
  });

  test("GET /api/v3/projects/non-existent should return 404", async () => {
    const res = await request(app).get("/api/v3/projects/non-existent");
    expect(res.statusCode).toBe(404);
  });

  test("GET /api/v3/projects/codecraft", async () => {
    const res = await request(app).get("/api/v3/projects/codecraft");
    expect(res.statusCode).toBe(200);

    const project = res.body as ProjectDetails;

    const { version, ratings, ...restProject } = project;
    expectRatingsAggregate(ratings);
    expect(restProject).toMatchInlineSnapshot(`
      {
        "created_at": "2024-05-22T14:01:16.975Z",
        "idp_user_id": "CyberSherpa",
        "latest_revision": 1,
        "slug": "codecraft",
        "updated_at": "2024-05-22T14:01:16.975Z",
      }
    `);

    expect(version).toBeDefined();
    const { app_metadata, files, ...restVersion } = version ?? {};
    expect(app_metadata).toMatchInlineSnapshot(`
        {
          "author": "CyberSherpa",
          "badges": [
            "mch2022",
            "why2025",
          ],
          "categories": [
            "Event related",
            "Games",
          ],
          "description": "With CodeCraft, you can do interesting things with the sensors.",
          "icon_map": {
            "64x64": "icon5.png",
          },
          "license_type": "MIT",
          "name": "CodeCraft",
        }
      `);
    const sortedFiles = files
      .map((f) => f.sha256)
      .toSorted()
      .map((sha) => files.find((f) => f.sha256 === sha));
    expect(sortedFiles).toMatchInlineSnapshot(`
      [
        {
          "created_at": "2024-05-22T14:01:16.975Z",
          "dir": "",
          "ext": ".png",
          "full_path": "icon5.png",
          "image_height": 64,
          "image_width": 64,
          "mimetype": "image/png",
          "name": "icon5",
          "sha256": "1582347ecd66c261f936295532079c3ba80d328265108f396cff663d82fd562d",
          "size_formatted": "7.36KB",
          "size_of_content": 7532,
          "updated_at": "2024-05-22T14:01:16.975Z",
          "url": "http://localhost:8081/api/v3/projects/codecraft/rev1/files/icon5.png",
        },
        {
          "created_at": "2024-05-22T14:01:16.975Z",
          "dir": "",
          "ext": ".py",
          "full_path": "__init__.py",
          "mimetype": "text/x-python-script",
          "name": "__init__",
          "sha256": "4028201b6ebf876b3ee30462c4d170146a2d3d92c5aca9fefc5e3d1a0508f5df",
          "size_formatted": "0.04KB",
          "size_of_content": 43,
          "updated_at": "2024-05-22T14:01:16.975Z",
          "url": "http://localhost:8081/api/v3/projects/codecraft/rev1/files/__init__.py",
        },
        {
          "created_at": "2024-05-22T14:01:16.975Z",
          "dir": "",
          "ext": ".json",
          "full_path": "metadata.json",
          "mimetype": "application/json",
          "name": "metadata",
          "sha256": "a41227adaa729b4519feffd5d05ddfbdeee99a7b2784378d1369d8d731fa0e3d",
          "size_formatted": "0.24KB",
          "size_of_content": 247,
          "updated_at": "2024-05-22T14:01:16.975Z",
          "url": "http://localhost:8081/api/v3/projects/codecraft/rev1/files/metadata.json",
        },
      ]
    `);

    expect(restVersion).toMatchInlineSnapshot(`
        {
          "blur_hash": null,
          "project_slug": "codecraft",
          "published_at": "2024-05-23T14:01:16.975Z",
          "revision": 1,
        }
      `);
  });

  test("GET /api/v3/projects/codecraft/rev1", async () => {
    const res = await request(app).get("/api/v3/projects/codecraft/rev1");
    expect(res.statusCode).toBe(200);
    const project = res.body as ProjectDetails;

    const { version, ratings, ...restProject } = project;
    expectRatingsAggregate(ratings);
    expect(restProject).toMatchInlineSnapshot(`
      {
        "created_at": "2024-05-22T14:01:16.975Z",
        "idp_user_id": "CyberSherpa",
        "latest_revision": 1,
        "slug": "codecraft",
        "updated_at": "2024-05-22T14:01:16.975Z",
      }
    `);

    expect(version).toBeDefined();
    const { app_metadata, files, ...restVersion } = version ?? {};
    expect(restVersion).toMatchInlineSnapshot(`
        {
          "blur_hash": null,
          "project_slug": "codecraft",
          "published_at": "2024-05-23T14:01:16.975Z",
          "revision": 1,
        }
      `);
    expect(app_metadata).toMatchInlineSnapshot(`
        {
          "author": "CyberSherpa",
          "badges": [
            "mch2022",
            "why2025",
          ],
          "categories": [
            "Event related",
            "Games",
          ],
          "description": "With CodeCraft, you can do interesting things with the sensors.",
          "icon_map": {
            "64x64": "icon5.png",
          },
          "license_type": "MIT",
          "name": "CodeCraft",
        }
      `);
    const sortedFiles = files
      .map((f) => f.sha256)
      .sort()
      .map((sha) => files.find((f) => f.sha256 === sha));
    expect(sortedFiles).toMatchInlineSnapshot(
      `
      [
        {
          "created_at": "2024-05-22T14:01:16.975Z",
          "dir": "",
          "ext": ".png",
          "full_path": "icon5.png",
          "image_height": 64,
          "image_width": 64,
          "mimetype": "image/png",
          "name": "icon5",
          "sha256": "1582347ecd66c261f936295532079c3ba80d328265108f396cff663d82fd562d",
          "size_formatted": "7.36KB",
          "size_of_content": 7532,
          "updated_at": "2024-05-22T14:01:16.975Z",
          "url": "http://localhost:8081/api/v3/projects/codecraft/rev1/files/icon5.png",
        },
        {
          "created_at": "2024-05-22T14:01:16.975Z",
          "dir": "",
          "ext": ".py",
          "full_path": "__init__.py",
          "mimetype": "text/x-python-script",
          "name": "__init__",
          "sha256": "4028201b6ebf876b3ee30462c4d170146a2d3d92c5aca9fefc5e3d1a0508f5df",
          "size_formatted": "0.04KB",
          "size_of_content": 43,
          "updated_at": "2024-05-22T14:01:16.975Z",
          "url": "http://localhost:8081/api/v3/projects/codecraft/rev1/files/__init__.py",
        },
        {
          "created_at": "2024-05-22T14:01:16.975Z",
          "dir": "",
          "ext": ".json",
          "full_path": "metadata.json",
          "mimetype": "application/json",
          "name": "metadata",
          "sha256": "a41227adaa729b4519feffd5d05ddfbdeee99a7b2784378d1369d8d731fa0e3d",
          "size_formatted": "0.24KB",
          "size_of_content": 247,
          "updated_at": "2024-05-22T14:01:16.975Z",
          "url": "http://localhost:8081/api/v3/projects/codecraft/rev1/files/metadata.json",
        },
      ]
    `
    );
  });

  test("GET /api/v3/projects/codecraft/rev2 (unpublished version)", async () => {
    const res = await request(app).get("/api/v3/projects/codecraft/rev2");
    expect(res.statusCode).toBe(404);
  });

  test("GET /api/v3/projects/codecraft/versions", async () => {
    const res = await request(app).get("/api/v3/projects/codecraft/versions");
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
    for (const entry of res.body) {
      expect(entry).toEqual(
        expect.objectContaining({
          latestRevision: expect.any(Number),
          latestPublishDate: expect.any(String),
        })
      );
      expect(entry.version === null || typeof entry.version === "string").toBe(
        true
      );
      expect(Number.isNaN(Date.parse(entry.latestPublishDate))).toBe(false);
    }
    // Highest revision first
    const revisions = res.body.map(
      (entry: { latestRevision: number }) => entry.latestRevision
    );
    expect(revisions).toEqual(
      [...revisions].sort((a: number, b: number) => b - a)
    );
  });

  test("GET /api/v3/projects/non-existent/versions should return 404", async () => {
    const res = await request(app).get(
      "/api/v3/projects/non-existent/versions"
    );
    expect(res.statusCode).toBe(404);
  });

  test("GET /api/v3/projects/{slug}/versions returns unique versions with highest revision", async () => {
    // Seed via domain layer (no auth) so the public endpoint can be tested with
    // multiple labeled published revisions.
    const badgeHubData = new BadgeHubData(
      new PostgreSQLBadgeHubMetadata(),
      new PostgreSQLBadgeHubFiles()
    );
    const projectSlug = `test_versions_${Date.now()}`;
    await badgeHubData.insertProject({
      slug: projectSlug,
      idp_user_id: "public-test-user",
    });

    // Publish 1.0.0 twice (revisions 1 and 2) — unique version should keep max revision 2
    for (const _ of [1, 2]) {
      await badgeHubData.updateDraftMetadata(projectSlug, {
        name: "Versioned App",
        version: "1.0.0",
        description: "v1",
      });
      await badgeHubData.publishVersion(projectSlug);
    }

    // Publish 2.0.0 once (revision 3)
    await badgeHubData.updateDraftMetadata(projectSlug, {
      name: "Versioned App",
      version: "2.0.0",
      description: "v2",
    });
    await badgeHubData.publishVersion(projectSlug);

    const res = await request(app).get(
      `/api/v3/projects/${projectSlug}/versions`
    );
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual([
      {
        version: "2.0.0",
        latestRevision: 3,
        latestPublishDate: expect.any(String),
      },
      {
        version: "1.0.0",
        latestRevision: 2,
        latestPublishDate: expect.any(String),
      },
    ]);
    for (const entry of res.body) {
      expect(Number.isNaN(Date.parse(entry.latestPublishDate))).toBe(false);
    }
    // Publish date of the higher revision should be at least as recent
    expect(Date.parse(res.body[0].latestPublishDate)).toBeGreaterThanOrEqual(
      Date.parse(res.body[1].latestPublishDate)
    );
  });

  test.each(["latest", "rev1"])(
    "GET /projects/{slug}/%s/files/metadata.json",
    async (revision) => {
      const getRes = await request(app).get(
        `/api/v3/projects/codecraft/${revision}/files/metadata.json`
      );
      expect(getRes.statusCode).toBe(200);
      const metadata = JSON.parse(getRes.text) as AppMetadataJSON; // TODO, seems like we are returning the wrong content-type since we need to use .text here.
      expect(metadata.name).toEqual("CodeCraft");
    }
  );

  test("GET files using url prop should work same as from path", async () => {
    const res = await request(app).get("/api/v3/projects/codecraft/rev1");
    expect(res.statusCode).toBe(200);
    const project = res.body as ProjectDetails;

    const files = project.version.files;
    expect(files.length).toBeGreaterThan(0); // Sanity check
    expect(project.version.published_at).toBeDefined(); // Sanity check
    for (const file of files) {
      const requestFromFilePath = await request(app).get(
        `/api/v3/projects/codecraft/rev${project.version.revision}/files/${encodeURIComponent(file.full_path)}`
      );
      expect(requestFromFilePath.statusCode).toBe(200);
      const requestFromUrl = await request(app).get(new URL(file.url).pathname);
      expect(requestFromUrl.statusCode).toBe(200);
      expect(requestFromFilePath.text).toEqual(requestFromUrl.text);
    }
  });

  test.each(["latest", "rev1"])(
    "GET /projects/{slug}/%s/files/__init__.py",
    async (revision) => {
      const getRes = await request(app).get(
        `/api/v3/projects/codecraft/${revision}/files/__init__.py`
      );
      expect(getRes.statusCode).toBe(200);
      expect(getRes.text).toEqual(
        "print('Hello world from the CodeCraft app')"
      );
      expect(getRes.headers["content-disposition"]).toMatch(
        /attachment; filename="__init__\.py"/
      );
    }
  );

  test.each(["latest", "rev1"])(
    "GET /projects/{slug}/%s/files/icon5.png sets Content-Type and renders inline",
    async (revision) => {
      const getRes = await request(app).get(
        `/api/v3/projects/codecraft/${revision}/files/icon5.png`
      );
      expect(getRes.statusCode).toBe(200);
      expect(getRes.headers["content-type"]).toEqual("image/png");
      expect(getRes.headers["content-disposition"]).toMatch(
        /inline; filename="icon5\.png"/
      );
    }
  );

  describe("ping should return pong", () => {
    test.each([
      { id: "testid", mac: "testmac" },
      { id: "testid", mac: "testmac" },
      { id: "testid", mac: "" },
      { id: "testid2", mac: undefined },
    ])("GET /api/v3/ping id=$id, mac=$mac", async ({ id, mac }) => {
      let url = `/api/v3/ping`;
      if (id) {
        url += `?id=${id}`;
      }
      if (mac) {
        url += `&mac=${mac}`;
      }
      const getRes = await request(app).get(url);
      expect(getRes.statusCode).toBe(200);
      expect(getRes.text).toBe('"pong"');
    });
  });

  describe("unpublished versions should not be requestable", () => {
    test.each(["rev3", "rev2"])(
      "GET /projects/{slug}/%s/files/metadata.json",
      async (revision) => {
        const getRes = await request(app).get(
          `/api/v3/projects/codecraft/${revision}/files/metadata.json`
        );
        expect(getRes.statusCode).toBe(404);
      }
    );

    test.each(["rev0", "rev2", "rev3"])(
      "GET /projects/{slug}/%s",
      async (revision) => {
        const getRes = await request(app).get(
          `/api/v3/projects/codecraft/${revision}`
        );
        expect(getRes.statusCode).toBe(404);
      }
    );
  });

  describe("project-summaries fields query parameter", () => {
    test("GET /api/v3/project-latest-revisions", async () => {
      const getRes = await request(app).get(`/api/v3/project-latest-revisions`);
      expect(getRes.statusCode).toBe(200);
      const projectRevisionMap = getRes.body as ProjectLatestRevisions;
      expect(Object.keys(projectRevisionMap).length).toBeGreaterThanOrEqual(20);
      expect(
        projectRevisionMap.find((p) => p.slug === "codecraft")
      ).toMatchInlineSnapshot(`
            {
              "revision": 1,
              "slug": "codecraft",
            }
          `);
    });
    test("GET /api/v3/project-latest-revisions?slugs=codecraft,codecrafter", async () => {
      const getRes = await request(app).get(
        `/api/v3/project-latest-revisions?slugs=codecraft,codecrafter`
      );
      expect(getRes.statusCode).toBe(200);
      const projectRevisionMap = getRes.body as ProjectLatestRevisions;
      expect(Object.keys(projectRevisionMap)).toHaveLength(2);
      expect(projectRevisionMap).toMatchInlineSnapshot(`
          [
            {
              "revision": 1,
              "slug": "codecraft",
            },
            {
              "revision": 1,
              "slug": "codecrafter",
            },
          ]
        `);
    });

    test("GET /api/v3/project-latest-revisions?slugs=codecraft", async () => {
      const getRes = await request(app).get(
        `/api/v3/project-latest-revisions?slugs=codecraft`
      );
      expect(getRes.statusCode).toBe(200);
      const projectRevisionMap = getRes.body as ProjectLatestRevisions;
      expect(Object.keys(projectRevisionMap)).toHaveLength(1);
      expect(projectRevisionMap).toMatchInlineSnapshot(`
          [
            {
              "revision": 1,
              "slug": "codecraft",
            },
          ]
        `);
    });

    test("GET /api/v3/project-latest-revisions/codecraft", async () => {
      const getRes = await request(app).get(
        `/api/v3/project-latest-revisions/codecraft`
      );
      expect(getRes.statusCode).toBe(200);
      const projectRevisionMap = getRes.body as number;
      expect(projectRevisionMap).toBe(1);
    });

    test("GET /api/v3/stats", async () => {
      const getRes = await request(app).get(`/api/v3/stats`);
      expect(getRes.statusCode).toBe(200);
      const stats: BadgeHubStats = getRes.body;
      expect(stats.authors).toBeGreaterThan(0);
      expect(stats.projects).toBeGreaterThan(0);
      // expect(stats.badges).toBeGreaterThan(0);
      expect(stats.authors).toBeGreaterThan(0);
      expect(Object.keys(stats)).toMatchInlineSnapshot(`
        [
          "projects",
          "installs",
          "crashes",
          "launches",
          "installed_projects",
          "launched_projects",
          "crashed_projects",
          "authors",
          "badges",
        ]
      `);
    });
  });
});
