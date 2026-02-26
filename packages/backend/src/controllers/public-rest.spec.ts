import { beforeEach, describe, expect, test } from "vitest";
import request from "supertest";
import express from "express";
import { createExpressServer } from "@createExpressServer";
import { randomUUID } from "node:crypto";
import { ProjectDetails } from "@shared/domain/readModels/project/ProjectDetails";
import { isInDebugMode } from "@util/debug";
import { AppMetadataJSON } from "@shared/domain/readModels/project/AppMetadataJSON";
import { ProjectLatestRevisions } from "@shared/domain/readModels/project/ProjectRevision";
import { BadgeHubStats } from "@shared/domain/readModels/BadgeHubStats";
import { ProjectSummary } from "@shared/domain/readModels/project/ProjectSummaries";
import { createBadgeHubData } from "@domain/createBadgeHubData";

describe(
  "Public API Routes",
  () => {
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
      const codecraft = res.body.find(
        (app: ProjectSummary) => app.slug === "codecraft"
      ) as ProjectSummary | undefined;
      expect(codecraft).toBeDefined();
      expect(codecraft).toMatchObject({
        badges: ["mch2022", "why2025"],
        categories: ["Event related", "Games"],
        description: "With CodeCraft, you can do interesting things with the sensors.",
        idp_user_id: "CyberSherpa",
        license_type: "MIT",
        name: "CodeCraft",
        published_at: "2024-05-23T14:01:16.975Z",
        revision: 1,
        slug: "codecraft",
      });
      expect(codecraft?.icon_map?.["64x64"]?.full_path).toBe("icon5.png");
      expect(codecraft?.installs).toEqual(expect.any(Number));
    });

    test("GET /api/v3/project-summaries should not contain unpublished apps", async () => {
      const res = await request(app).get("/api/v3/project-summaries");
      expect(res.statusCode).toBe(200);
      expect(
        res.body.find((app: ProjectSummary) => !app.published_at)
      ).toBeUndefined();
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
      expect(
        summaries.map((app: ProjectSummary) => app.installs)
      ).toStrictEqual(sortedExpected);
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

      const reportRes = await request(app).post(
        `/api/v3/projects/${projectSlug}/rev1/report/install?id=${randomUUID()}`
      );
      expect(reportRes.statusCode).toBe(204);

      await createBadgeHubData().refreshReports();

      const updatedRes = await request(app).get("/api/v3/project-summaries");
      expect(updatedRes.statusCode).toBe(200);
      const updatedSummaries = updatedRes.body as ProjectSummary[];
      const updatedInstalls = updatedSummaries.find(
        (summary) => summary.slug === projectSlug
      )?.installs;

      expect(updatedInstalls).toBe((baselineInstalls as number) + 1);
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
        .sort((a, b) => Date.parse(b!) - Date.parse(a!));
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
      expect(
        res.body.find((app: ProjectSummary) => app.hidden)
      ).toBeUndefined();

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
        res.body.every((app: ProjectSummary) =>
          app.categories?.includes("Silly")
        )
      ).toBe(true);
      expect(
        res.body.find((app: ProjectSummary) =>
          app.categories?.includes("Silly")
        )
      ).toBeDefined();
    });

    test("GET /api/v3/project-summaries with category name in search", async () => {
      const res = await request(app).get(
        "/api/v3/project-summaries?search=Uncategorised"
      );
      expect(res.statusCode).toBe(200);
      expect(res.body.length).toBeGreaterThan(0);
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
      expect(result[0]!.slug).toEqual("codecrafter");
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
        res.body.find((app: ProjectSummary) =>
          app.categories?.includes("Silly")
        )
      ).toBeDefined();
    });

    test("GET /api/v3/project-summariesslugs=codecraft,codecrafter", async () => {
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
      expect(res.body.map((p: ProjectSummary) => p.slug)).toEqual([
        "codecraft",
      ]);
    });

    test("GET /api/v3/projects/non-existent should return 404", async () => {
      const res = await request(app).get("/api/v3/projects/non-existent");
      expect(res.statusCode).toBe(404);
    });

    test("GET /api/v3/projects/codecraft", async () => {
      const res = await request(app).get("/api/v3/projects/codecraft");
      expect(res.statusCode).toBe(200);

      const project = res.body as ProjectDetails;

      const { version, ...restProject } = project;
      expect(restProject).toMatchInlineSnapshot(`
        {
          "created_at": "2024-05-22T14:01:16.975Z",
          "idp_user_id": "CyberSherpa",
          "latest_revision": 1,
          "slug": "codecraft",
          "updated_at": "2024-05-22T14:01:16.975Z",
        }
      `);

      const { app_metadata, files, ...restVersion } = version!;
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
      expect(sortedFiles).toHaveLength(3);
      expect(sortedFiles.map((f) => f?.full_path)).toEqual([
        "__init__.py",
        "icon5.png",
        "metadata.json",
      ]);
      for (const f of sortedFiles) {
        expect(f?.created_at).toEqual(expect.any(String));
        expect(f?.updated_at).toEqual(expect.any(String));
      }

      expect(restVersion).toMatchInlineSnapshot(`
        {
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

      const { version, ...restProject } = project;
      expect(restProject).toMatchInlineSnapshot(`
        {
          "created_at": "2024-05-22T14:01:16.975Z",
          "idp_user_id": "CyberSherpa",
          "latest_revision": 1,
          "slug": "codecraft",
          "updated_at": "2024-05-22T14:01:16.975Z",
        }
      `);

      const { app_metadata, files, ...restVersion } = version!;
      expect(restVersion).toMatchInlineSnapshot(`
        {
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
      expect(sortedFiles).toHaveLength(3);
      expect(sortedFiles.map((f) => f?.full_path)).toEqual([
        "__init__.py",
        "icon5.png",
        "metadata.json",
      ]);
      for (const f of sortedFiles) {
        expect(f?.created_at).toEqual(expect.any(String));
        expect(f?.updated_at).toEqual(expect.any(String));
      }
    });

    test("GET /api/v3/projects/codecraft/rev2 (unpublished version)", async () => {
      const res = await request(app).get("/api/v3/projects/codecraft/rev2");
      expect(res.statusCode).toBe(404);
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
        const requestFromUrl = await request(app).get(
          new URL(file.url).pathname
        );
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
        expect(getRes.headers["content-disposition"]).toEqual(
          'attachment; filename="__init__.py"'
        );
      }
    );

    describe("ping should return pong", () => {
      test.each([
        { id: "testid", mac: "testmac" },
        { id: "testid", mac: "testmac" },
        { id: "testid", mac: "" },
        { id: "testid2", mac: undefined },
        { id: undefined, mac: undefined },
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
        const getRes = await request(app).get(
          `/api/v3/project-latest-revisions`
        );
        expect(getRes.statusCode).toBe(200);
        const projectRevisionMap = getRes.body as ProjectLatestRevisions;
        expect(Object.keys(projectRevisionMap).length).toBeGreaterThanOrEqual(
          20
        );
        expect(projectRevisionMap.find((p) => p.slug === "codecraft"))
          .toMatchInlineSnapshot(`
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
            "crashed_projects",
            "crashes",
            "installed_projects",
            "launched_projects",
            "launches",
            "projects",
            "installs",
            "authors",
            "badges",
          ]
        `);
      });
    });
  },
  { timeout: isInDebugMode() ? 3600_000 : undefined }
);
