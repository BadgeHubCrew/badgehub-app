import { createExpressServer } from "@createExpressServer";
import { PostgreSQLBadgeHubMetadata } from "@db/PostgreSQLBadgeHubMetadata";
import type { AppMetadataJSON } from "@shared/domain/readModels/project/AppMetadataJSON";
import type { ProjectDetails } from "@shared/domain/readModels/project/ProjectDetails";
import type { ProjectSummary } from "@shared/domain/readModels/project/ProjectSummaries";
import type { Version } from "@shared/domain/readModels/project/Version";
import { isInDebugMode } from "@util/debug";
import type { Express } from "express";
import { decodeJwt } from "jose";
import sharp from "sharp";
import request from "supertest";
import { beforeAll, describe, expect, test } from "vitest";

const USER1_TOKEN =
  "eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJnUGI4VjZ5dHZTMkpFakdjVDFlLWdTWVRPbFBTNm04Xzkta210cHFDMktVIn0.eyJleHAiOjE3NDgyOTA4NzMsImlhdCI6MTc0ODI5MDgxMywiYXV0aF90aW1lIjoxNzQ4MjkwODEzLCJqdGkiOiI1NmIzOTUwNS0yYjJmLTQ1MDgtOTY0NC03NTFmN2FjMzI0ZGQiLCJpc3MiOiJodHRwczovL2tleWNsb2FrLnAxbS5ubC9yZWFsbXMvbWFzdGVyIiwiYXVkIjoiYWNjb3VudCIsInN1YiI6ImQ4MDc1MzM3LTBmMTAtNGNkYi04YjQ4LWJlMWRjMTg3NDdhMyIsInR5cCI6IkJlYXJlciIsImF6cCI6ImJhZGdlaHViIiwic2Vzc2lvbl9zdGF0ZSI6IjIzMWFkYmRkLTE1NDctNDRjYi1hNjI3LTI2MjJmNzI2YzcxMCIsImFjciI6IjEiLCJhbGxvd2VkLW9yaWdpbnMiOlsiaHR0cHM6Ly9iYWRnZWh1Yi5wMW0ubmwvIl0sInJlYWxtX2FjY2VzcyI6eyJyb2xlcyI6WyJkZWZhdWx0LXJvbGVzLW1hc3RlciIsIm9mZmxpbmVfYWNjZXNzIiwidW1hX2F1dGhvcml6YXRpb24iXX0sInJlc291cmNlX2FjY2VzcyI6eyJhY2NvdW50Ijp7InJvbGVzIjpbIm1hbmFnZS1hY2NvdW50IiwibWFuYWdlLWFjY291bnQtbGlua3MiLCJ2aWV3LXByb2ZpbGUiXX19LCJzY29wZSI6Im9wZW5pZCBlbWFpbCBwcm9maWxlIiwic2lkIjoiMjMxYWRiZGQtMTU0Ny00NGNiLWE2MjctMjYyMmY3MjZjNzEwIiwiZW1haWxfdmVyaWZpZWQiOmZhbHNlLCJuYW1lIjoidGVzdCB1c2VyIDEgVGVzdGVyIiwicHJlZmVycmVkX3VzZXJuYW1lIjoidGVzdHVzZXIxIiwiZ2l2ZW5fbmFtZSI6InRlc3QgdXNlciAxIiwiZmFtaWx5X25hbWUiOiJUZXN0ZXIiLCJlbWFpbCI6ImZkdXZpdmllcit0ZXN0dXNlcjFAZ21haWwuY29tIn0.h9R3nkDZ4C1LMAHKY-iBr24vW2tZMDwNgkA-6S1GQ2KNdnCjaOnROGB0bOCD5vaJO09YqItduM2gBD-oWGX0WuX57p5r5h3lCJi12NEV1YUdc0Z_pqB5ZvmXnJcquejqnnIiia8utcsOUQOsvhDZI4E0afyNl4J0JzcTwwIeOsP_oxkaFCb1aIMOVEIVwyOQYUfIcXsyFNJm356zgMQbD3WNI3eNCi2bDs-KfKaasCdgrMYjEM7gfXetgkJVbgT0v0AXyo9pzVGFDjzNPkoNNo0P5in8AA0qh2C3F-EXFsj3Xmagb_K1un94q4wW4IEMUqbhHbuR2bdePzg6219-Kg";
const USER1_ID = decodeJwt(USER1_TOKEN).sub;
const toSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]/g, "_");

describe("Authenticated API Routes", () => {
  let app: Express;
  beforeAll(() => {
    console.warn = () => {}; // Suppress console.warn messages during tests
    app = createExpressServer();
  });
  describe("/projects/{slug}", () => {
    test("POST /api/v3/projects/{user1AppId}", async () => {
      const dynamicTestAppId = toSlug(`test_user1_app_${crypto.randomUUID()}`);
      const postRes = await request(app)
        .post(`/api/v3/projects/${dynamicTestAppId}`)
        .auth(USER1_TOKEN, { type: "bearer" })
        .send();
      expect(postRes.statusCode).toBe(204);
    });

    test("CREATE/READ/DELETE project", async () => {
      // Reason that we make the test project id dynamic is to avoid that the test fails if you run it multiple times locally and possibly stop halfware through the test.
      const dynamicTestAppId = `test_app_${Date.now()}`;
      const postRes = await request(app)
        .post(`/api/v3/projects/${dynamicTestAppId}`)
        .auth(USER1_TOKEN, { type: "bearer" })
        .send();
      expect(postRes.statusCode).toBe(204);
      const patchMetadataRes = await request(app)
        .patch(`/api/v3/projects/${dynamicTestAppId}/draft/metadata`)
        .auth(USER1_TOKEN, { type: "bearer" })
        .send({
          name: "Test App Name",
          description: "Test App Description",
          git_url: "https://github.com/badgehubcrew/badgehub-app",
        } as const satisfies AppMetadataJSON);
      expect(patchMetadataRes.statusCode).toBe(204);

      const getRes = await request(app)
        .get(`/api/v3/projects/${dynamicTestAppId}/draft`)
        .auth(USER1_TOKEN, { type: "bearer" });
      expect(getRes.statusCode).toBe(200);

      const versionInResponse = getRes.body.version as Version;
      expect(getRes.body).toMatchInlineSnapshot(
        {
          updated_at: expect.any(String),
          created_at: expect.any(String),
          slug: expect.any(String),
          version: {
            files: expect.any(Array),
            project_slug: expect.any(String),
          },
        },
        `
        {
          "created_at": Any<String>,
          "idp_user_id": "d8075337-0f10-4cdb-8b48-be1dc18747a3",
          "latest_revision": null,
          "slug": Any<String>,
          "updated_at": Any<String>,
          "version": {
            "app_metadata": {
              "description": "Test App Description",
              "git_url": "https://github.com/badgehubcrew/badgehub-app",
              "name": "Test App Name",
            },
            "blur_hash": null,
            "files": Any<Array>,
            "project_slug": Any<String>,
            "revision": 1,
          },
        }
      `
      );

      expect(versionInResponse.files.length).toEqual(1);
      expect(versionInResponse.files[0]).toMatchObject({
        full_path: "metadata.json",
        size_of_content: expect.any(Number),
      });

      const deleteRes = await request(app)
        .delete(`/api/v3/projects/${dynamicTestAppId}`)
        .auth(USER1_TOKEN, { type: "bearer" });
      expect(deleteRes.statusCode).toBe(204);
      const getRes2 = await request(app)
        .get(`/api/v3/projects/${dynamicTestAppId}`)
        .auth(USER1_TOKEN, { type: "bearer" });
      expect(getRes2.statusCode).toBe(404);
    });

    test("create draft project with slug only", async () => {
      // Create a new project with only a slug
      const TEST_APP_ID = `test_app_${Date.now()}`;
      const postRes = await request(app)
        .post(`/api/v3/projects/${TEST_APP_ID}`)
        .auth(USER1_TOKEN, { type: "bearer" })
        .send();
      expect(postRes.statusCode).toBe(204);

      // Verify the project was created with the correct slug
      const getRes = await request(app)
        .get(`/api/v3/projects/${TEST_APP_ID}/draft`)
        .auth(USER1_TOKEN, { type: "bearer" });
      expect(getRes.statusCode).toBe(200);
      expect(getRes.body.slug).toBe(TEST_APP_ID);
      expect(
        getRes.body.version.app_metadata.development_status
      ).toBeUndefined();
    });

    test("PATCH draft metadata with admin category returns 403 for non-admin", async () => {
      const dynamicTestAppId = toSlug(
        `test_admin_category_${crypto.randomUUID()}`
      );
      const postRes = await request(app)
        .post(`/api/v3/projects/${dynamicTestAppId}`)
        .auth(USER1_TOKEN, { type: "bearer" })
        .send();
      expect(postRes.statusCode).toBe(204);

      const patchMetadataRes = await request(app)
        .patch(`/api/v3/projects/${dynamicTestAppId}/draft/metadata`)
        .auth(USER1_TOKEN, { type: "bearer" })
        .send({
          name: "Test App Name",
          categories: ["Default"],
        } as const satisfies AppMetadataJSON);
      expect(patchMetadataRes.statusCode).toBe(403);
    });

    test("PUT /api/v3/users/{userId}/ratings/{projectSlug} records a user rating", async () => {
      const dynamicTestAppId = toSlug(
        `test_user_rating_${crypto.randomUUID()}`
      );
      const postRes = await request(app)
        .post(`/api/v3/projects/${dynamicTestAppId}`)
        .auth(USER1_TOKEN, { type: "bearer" })
        .send();
      expect(postRes.statusCode).toBe(204);

      const publishRes = await request(app)
        .patch(`/api/v3/projects/${dynamicTestAppId}/publish`)
        .auth(USER1_TOKEN, { type: "bearer" });
      expect(publishRes.statusCode).toBe(204);

      const missingRatingRes = await request(app)
        .get(`/api/v3/users/${USER1_ID}/ratings/${dynamicTestAppId}`)
        .auth(USER1_TOKEN, { type: "bearer" });
      expect(missingRatingRes.statusCode).toBe(200);
      expect(missingRatingRes.body).toBeNull();

      const ratingRes = await request(app)
        .put(`/api/v3/users/${USER1_ID}/ratings/${dynamicTestAppId}`)
        .auth(USER1_TOKEN, { type: "bearer" })
        .send({ rating: 4 });
      expect(ratingRes.statusCode).toBe(204);

      const userRatingRes = await request(app)
        .get(`/api/v3/users/${USER1_ID}/ratings/${dynamicTestAppId}`)
        .auth(USER1_TOKEN, { type: "bearer" });
      expect(userRatingRes.statusCode).toBe(200);
      expect(userRatingRes.body).toStrictEqual({ rating: 4 });

      await new PostgreSQLBadgeHubMetadata().refreshReports();

      const getRes = await request(app).get(
        `/api/v3/projects/${dynamicTestAppId}`
      );
      expect(getRes.statusCode).toBe(200);
      expect((getRes.body as ProjectDetails).ratings).toStrictEqual({
        average: 4,
        count: 1,
      });
    });
  });

  describe("with new project created", {
    timeout: isInDebugMode() ? 3600_000 : undefined,
  }, () => {
    let user1AppId: string;
    beforeAll(async () => {
      console.warn = () => {}; // Suppress console.warn messages during tests
      user1AppId = toSlug(`test_user1_app_${crypto.randomUUID()}`);
      const postRes = await request(app)
        .post(`/api/v3/projects/${user1AppId}`)
        .auth(USER1_TOKEN, { type: "bearer" })
        .send();
      expect(postRes.statusCode).toBe(204);
    });

    describe("/projects/{slug}/draft", () => {
      test("non-existing /projects/{slug}/draft", async () => {
        const res = await request(app)
          .get("/api/v3/projects/non-existing/draft")
          .auth(USER1_TOKEN, { type: "bearer" });
        expect(res.statusCode).toBe(404);
      });

      test.each(["non-existing", "codecraft"])(
        "should respond with 401 for [%s] if there is no jwt token in the request",
        async (projectName) => {
          const res = await request(app).get(
            `/api/v3/projects/${projectName}/draft`
          );
          expect(res.statusCode).toBe(401);
        }
      );

      test.each(["non-existing", "codecraft"])(
        "should respond with 401 for [%s] if the valid jwt token in the request cannot be decoded",
        async (projectName) => {
          const res = await request(app)
            .get(`/api/v3/projects/${projectName}/draft`)
            .auth("some random string", { type: "bearer" });
          expect(res.statusCode).toBe(401);
        }
      );
    });

    describe("/projects/{slug}/draft/files/{filePath}", () => {
      test("POST metadata.json updates draft app metadata", async () => {
        const metadata = {
          name: "Uploaded Metadata Name",
          description: "From metadata.json upload",
        } as const satisfies AppMetadataJSON;
        const postRes = await request(app)
          .post(`/api/v3/projects/${user1AppId}/draft/files/metadata.json`)
          .auth(USER1_TOKEN, { type: "bearer" })
          .attach("file", Buffer.from(JSON.stringify(metadata)), {
            filename: "metadata.json",
            contentType: "application/json",
          });
        expect(postRes.statusCode).toBe(204);

        const getRes = await request(app)
          .get(`/api/v3/projects/${user1AppId}/draft`)
          .auth(USER1_TOKEN, { type: "bearer" });
        expect(getRes.statusCode).toBe(200);
        expect(getRes.body.version.app_metadata).toMatchObject(metadata);
      });

      test("POST invalid metadata.json returns 400", async () => {
        const postRes = await request(app)
          .post(`/api/v3/projects/${user1AppId}/draft/files/metadata.json`)
          .auth(USER1_TOKEN, { type: "bearer" })
          .attach("file", Buffer.from("{not json"), {
            filename: "metadata.json",
            contentType: "application/json",
          });
        expect(postRes.statusCode).toBe(400);
        expect(postRes.body).toMatchObject({
          message: expect.stringMatching(/not valid JSON/i),
        });
      });

      test("CREATE/READ/DELETE /projects/{slug}/draft/files/{filePath}", async () => {
        const postRes = await request(app)
          .post(`/api/v3/projects/${user1AppId}/draft/files/test.txt`)
          .auth(USER1_TOKEN, { type: "bearer" })
          .attach("file", Buffer.from("test file content"), "test.txt");
        expect(postRes.statusCode).toBe(204);
        const getRes = await request(app)
          .get(`/api/v3/projects/${user1AppId}/draft/files/test.txt`)
          .auth(USER1_TOKEN, { type: "bearer" });
        expect(getRes.statusCode).toBe(200);
        expect(getRes.text).toBe("test file content");
        const deleteRes = await request(app)
          .delete(`/api/v3/projects/${user1AppId}/draft/files/test.txt`)
          .auth(USER1_TOKEN, { type: "bearer" });
        expect(deleteRes.statusCode).toBe(204);
        const getRes2 = await request(app)
          .get(`/api/v3/projects/${user1AppId}/draft/files/test.txt`)
          .auth(USER1_TOKEN, { type: "bearer" });
        expect(getRes2.statusCode).toBe(404);
      });

      test("POST application/json body is rejected for file upload", async () => {
        const jsonStringFile = await request(app)
          .post(
            `/api/v3/projects/${user1AppId}/draft/files/json-string-body.txt`
          )
          .auth(USER1_TOKEN, { type: "bearer" })
          .set("Content-Type", "application/json")
          .send({ file: "not a real file" });
        expect(jsonStringFile.statusCode).toBeGreaterThanOrEqual(400);
        expect(jsonStringFile.statusCode).toBeLessThan(500);

        const jsonObjectFile = await request(app)
          .post(
            `/api/v3/projects/${user1AppId}/draft/files/json-object-body.txt`
          )
          .auth(USER1_TOKEN, { type: "bearer" })
          .set("Content-Type", "application/json")
          .send({
            file: {
              name: "json-object-body.txt",
              type: "text/plain",
              data: Buffer.from("hello").toString("base64"),
            },
          });
        expect(jsonObjectFile.statusCode).toBeGreaterThanOrEqual(400);
        expect(jsonObjectFile.statusCode).toBeLessThan(500);

        // Ensure neither body form created a file
        for (const name of [
          "json-string-body.txt",
          "json-object-body.txt",
        ] as const) {
          const getRes = await request(app)
            .get(`/api/v3/projects/${user1AppId}/draft/files/${name}`)
            .auth(USER1_TOKEN, { type: "bearer" });
          expect(getRes.statusCode).toBe(404);
        }
      });

      test("POST /projects/{slug}/draft/icon converts and sets icons", async () => {
        const pngBuffer = await sharp({
          create: {
            width: 1,
            height: 1,
            channels: 4,
            background: { r: 255, g: 0, b: 0, alpha: 1 },
          },
        })
          .png()
          .toBuffer();
        const uploadRes = await request(app)
          .post(`/api/v3/projects/${user1AppId}/draft/files/icon-source.png`)
          .auth(USER1_TOKEN, { type: "bearer" })
          .attach("file", pngBuffer, "icon-source.png");
        expect(uploadRes.statusCode).toBe(204);

        const setIconRes = await request(app)
          .post(`/api/v3/projects/${user1AppId}/draft/icon`)
          .auth(USER1_TOKEN, { type: "bearer" })
          .send({
            filePath: "icon-source.png",
            sizes: ["32x32", "64x64"],
          });
        expect(setIconRes.statusCode).toBe(200);
        expect(setIconRes.body).toMatchObject({
          iconPaths: {
            "32x32": "icon-32x32.png",
            "64x64": "icon-64x64.png",
          },
        });

        const getDraftRes = await request(app)
          .get(`/api/v3/projects/${user1AppId}/draft`)
          .auth(USER1_TOKEN, { type: "bearer" });
        expect(getDraftRes.statusCode).toBe(200);
        expect(getDraftRes.body.version.app_metadata.icon_map).toMatchObject({
          "32x32": "icon-32x32.png",
          "64x64": "icon-64x64.png",
        });
        expect(getDraftRes.body.version.blur_hash).toMatchInlineSnapshot(
          `"L9TI:j|cfQ|c|co1fQo1fQfQfQfQ"`
        );
      });

      test("Overwrite deleted file", async () => {
        const postRes1 = await request(app)
          .post(`/api/v3/projects/${user1AppId}/draft/files/test.txt`)
          .auth(USER1_TOKEN, { type: "bearer" })
          .attach("file", Buffer.from("test file content"), "test.txt");
        expect(postRes1.statusCode).toBe(204);

        const deleteRes = await request(app)
          .delete(`/api/v3/projects/${user1AppId}/draft/files/test.txt`)
          .auth(USER1_TOKEN, { type: "bearer" });
        expect(deleteRes.statusCode).toBe(204);
        const postRes2 = await request(app)
          .post(`/api/v3/projects/${user1AppId}/draft/files/test.txt`)
          .auth(USER1_TOKEN, { type: "bearer" })
          .attach("file", Buffer.from("test file content"), "test.txt");
        expect(postRes2.statusCode).toBe(204);
        const getRes = await request(app)
          .get(`/api/v3/projects/${user1AppId}/draft/files/test.txt`)
          .auth(USER1_TOKEN, { type: "bearer" });
        expect(getRes.statusCode).toBe(200);
        expect(getRes.text).toBe("test file content");
      });
    });

    describe("/projects/{slug}/publish", () => {
      test("publish keeps non-deleted files and does not restore deleted files", async () => {
        const publishTestAppId = `test_app_publish_${Date.now()}`;
        const keptFilePath = "keep.txt";
        const deletedFilePath = "deleted.txt";
        const keptFileContent = "keep this file";

        const postProjectRes = await request(app)
          .post(`/api/v3/projects/${publishTestAppId}`)
          .auth(USER1_TOKEN, { type: "bearer" })
          .send();
        expect(postProjectRes.statusCode).toBe(204);

        const uploadKeptFileRes = await request(app)
          .post(
            `/api/v3/projects/${publishTestAppId}/draft/files/${keptFilePath}`
          )
          .auth(USER1_TOKEN, { type: "bearer" })
          .attach("file", Buffer.from(keptFileContent), keptFilePath);
        expect(uploadKeptFileRes.statusCode).toBe(204);

        const uploadDeletedFileRes = await request(app)
          .post(
            `/api/v3/projects/${publishTestAppId}/draft/files/${deletedFilePath}`
          )
          .auth(USER1_TOKEN, { type: "bearer" })
          .attach("file", Buffer.from("delete this file"), deletedFilePath);
        expect(uploadDeletedFileRes.statusCode).toBe(204);

        const deleteFileRes = await request(app)
          .delete(
            `/api/v3/projects/${publishTestAppId}/draft/files/${deletedFilePath}`
          )
          .auth(USER1_TOKEN, { type: "bearer" });
        expect(deleteFileRes.statusCode).toBe(204);

        const publishRes = await request(app)
          .patch(`/api/v3/projects/${publishTestAppId}/publish`)
          .auth(USER1_TOKEN, { type: "bearer" });
        expect(publishRes.statusCode).toBe(204);

        const getLatestRes = await request(app)
          .get(`/api/v3/projects/${publishTestAppId}`)
          .auth(USER1_TOKEN, { type: "bearer" });
        expect(getLatestRes.statusCode).toBe(200);
        expect(
          getLatestRes.body.version.files.map(
            (f: { full_path: string }) => f.full_path
          )
        ).toContain(keptFilePath);
        expect(
          getLatestRes.body.version.files.map(
            (f: { full_path: string }) => f.full_path
          )
        ).not.toContain(deletedFilePath);

        const getDraftKeptFileRes = await request(app)
          .get(
            `/api/v3/projects/${publishTestAppId}/draft/files/${keptFilePath}`
          )
          .auth(USER1_TOKEN, { type: "bearer" });
        expect(getDraftKeptFileRes.statusCode).toBe(200);
        expect(getDraftKeptFileRes.text).toBe(keptFileContent);

        const getDraftDeletedFileRes = await request(app)
          .get(
            `/api/v3/projects/${publishTestAppId}/draft/files/${deletedFilePath}`
          )
          .auth(USER1_TOKEN, { type: "bearer" });
        expect(getDraftDeletedFileRes.statusCode).toBe(404);
      });

      test("publish version and change metadata", async () => {
        // Create a new project
        const publishTestAppId = `test_app_publish_${Date.now()}`;
        const appName = "Test App Name";
        const postRes = await request(app)
          .post(`/api/v3/projects/${publishTestAppId}`)
          .auth(USER1_TOKEN, { type: "bearer" })
          .send();
        expect(postRes.statusCode).toBe(204);

        // Add metadata and name to the project
        const updateAppRes = await request(app)
          .patch(`/api/v3/projects/${publishTestAppId}/draft/metadata`)
          .auth(USER1_TOKEN, { type: "bearer" })
          .send({
            name: appName,
            description: "Test App Description Before Publish",
            badges: ["why2025"],
            categories: ["Games"],
            application: [
              {
                revision: 0,
              },
            ],
          } as const satisfies AppMetadataJSON);
        expect(updateAppRes.status).toBe(204);

        // Verify the metadata was added
        const getRes1 = await request(app)
          .get(`/api/v3/projects/${publishTestAppId}/draft`)
          .auth(USER1_TOKEN, { type: "bearer" });
        expect(getRes1.statusCode).toBe(200);
        const originalAppMetadata = getRes1.body.version.app_metadata;
        expect(originalAppMetadata.description).toBe(
          "Test App Description Before Publish"
        );

        // Publish the project to create a new version
        const publishRes = await request(app)
          .patch(`/api/v3/projects/${publishTestAppId}/publish`)
          .auth(USER1_TOKEN, { type: "bearer" });
        expect(publishRes.statusCode).toBe(204);

        // Update the metadata of the draft version after publishing
        const updateAppRes2 = await request(app)
          .patch(`/api/v3/projects/${publishTestAppId}/draft/metadata`)
          .auth(USER1_TOKEN, { type: "bearer" })
          .send({
            ...originalAppMetadata,
            description: "Test App Description After Publish",
          });
        expect(updateAppRes2.status).toBe(204);

        // Verify the metadata was updated on the draft version
        const getDraftRes = await request(app)
          .get(`/api/v3/projects/${publishTestAppId}/draft`)
          .auth(USER1_TOKEN, { type: "bearer" });
        expect(getDraftRes.statusCode).toBe(200);
        expect(getDraftRes.body.version.app_metadata.name).toBe(appName);
        expect(getDraftRes.body.version.app_metadata.description).toBe(
          "Test App Description After Publish"
        );

        // Verify the metadata of the published version remains unchanged
        const getLatestRes = await request(app)
          .get(`/api/v3/projects/${publishTestAppId}`)
          .auth(USER1_TOKEN, { type: "bearer" });
        expect(getLatestRes.statusCode).toBe(200);
        expect(getLatestRes.body.version.app_metadata.name).toBe(appName);
        expect(getLatestRes.body.version.app_metadata.description).toBe(
          "Test App Description Before Publish"
        );
      });

      test("publish version to check revision change", async () => {
        // Create a new project
        const publishTestAppId = `test_app_publish_${Date.now()}`;
        const _appName = "Test App Name";
        const postRes = await request(app)
          .post(`/api/v3/projects/${publishTestAppId}`)
          .auth(USER1_TOKEN, { type: "bearer" })
          .send();
        expect(postRes.statusCode).toBe(204);

        for (let i = 0; i < 7; i++) {
          const publishRes = await request(app)
            .patch(`/api/v3/projects/${publishTestAppId}/publish`)
            .auth(USER1_TOKEN, { type: "bearer" });
          expect(publishRes.statusCode).toBe(204);
        }

        const getLatestVersionRes = await request(app).get(
          `/api/v3/project-latest-revisions/${publishTestAppId}`
        );
        expect(getLatestVersionRes.statusCode).toBe(200);
        expect(getLatestVersionRes.body).toBe(7);
      });
    });

    describe("/users/{userId}/drafts", () => {
      test("GET /users/{userId}/drafts", async () => {
        const res = await request(app)
          .get(`/api/v3/users/${USER1_ID}/drafts`)
          .auth(USER1_TOKEN, { type: "bearer" });
        expect(res.statusCode).toBe(200);
        expect(
          res.body.find(
            (project: ProjectDetails) => project.slug === user1AppId
          )
        ).toBeDefined();
      });
      test("should also list hidden drafts projects", async () => {
        // Create a new project with only a slug
        const TEST_APP_ID = `test_app_${Date.now()}`;
        const postRes = await request(app)
          .post(`/api/v3/projects/${TEST_APP_ID}`)
          .auth(USER1_TOKEN, { type: "bearer" })
          .send();
        expect(postRes.statusCode).toBe(204);
        const patchMetadataRes = await request(app)
          .patch(`/api/v3/projects/${TEST_APP_ID}/draft/metadata`)
          .auth(USER1_TOKEN, { type: "bearer" })
          .send({
            name: "Test App Name",
            description: "Test App Description",
            version: "1.2.3",
            hidden: true,
          });
        expect(patchMetadataRes.statusCode).toBe(204);

        // Verify the project is returned even though it is hidden
        const res = await request(app)
          .get(`/api/v3/users/${USER1_ID}/drafts`)
          .auth(USER1_TOKEN, { type: "bearer" });
        expect(res.statusCode).toBe(200);
        const project: ProjectSummary | undefined = res.body.find(
          (project: ProjectDetails) => project.slug === TEST_APP_ID
        );
        expect(project).toBeDefined();
        expect(project?.hidden).toBe(true);
        expect(project?.version).toBe("1.2.3");
      });
    });
  });
});
