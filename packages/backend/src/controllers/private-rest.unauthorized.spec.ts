import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  test,
} from "vitest";
import request from "supertest";
import express from "express";
import type { Express } from "express";
import { createExpressServer } from "#createExpressServer";
import { isInDebugMode } from "#util/debug";
import type { CreateProjectProps } from "@badgehub/shared/domain/writeModels/project/WriteProject";
import { decodeJwt } from "jose";

const USER1_TOKEN =
  "eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJnUGI4VjZ5dHZTMkpFakdjVDFlLWdTWVRPbFBTNm04Xzkta210cHFDMktVIn0.eyJleHAiOjE3NDgyOTA4NzMsImlhdCI6MTc0ODI5MDgxMywiYXV0aF90aW1lIjoxNzQ4MjkwODEzLCJqdGkiOiI1NmIzOTUwNS0yYjJmLTQ1MDgtOTY0NC03NTFmN2FjMzI0ZGQiLCJpc3MiOiJodHRwczovL2tleWNsb2FrLnAxbS5ubC9yZWFsbXMvbWFzdGVyIiwiYXVkIjoiYWNjb3VudCIsInN1YiI6ImQ4MDc1MzM3LTBmMTAtNGNkYi04YjQ4LWJlMWRjMTg3NDdhMyIsInR5cCI6IkJlYXJlciIsImF6cCI6ImJhZGdlaHViIiwic2Vzc2lvbl9zdGF0ZSI6IjIzMWFkYmRkLTE1NDctNDRjYi1hNjI3LTI2MjJmNzI2YzcxMCIsImFjciI6IjEiLCJhbGxvd2VkLW9yaWdpbnMiOlsiaHR0cHM6Ly9iYWRnZWh1Yi5wMW0ubmwvIl0sInJlYWxtX2FjY2VzcyI6eyJyb2xlcyI6WyJkZWZhdWx0LXJvbGVzLW1hc3RlciIsIm9mZmxpbmVfYWNjZXNzIiwidW1hX2F1dGhvcml6YXRpb24iXX0sInJlc291cmNlX2FjY2VzcyI6eyJhY2NvdW50Ijp7InJvbGVzIjpbIm1hbmFnZS1hY2NvdW50IiwibWFuYWdlLWFjY291bnQtbGlua3MiLCJ2aWV3LXByb2ZpbGUiXX19LCJzY29wZSI6Im9wZW5pZCBlbWFpbCBwcm9maWxlIiwic2lkIjoiMjMxYWRiZGQtMTU0Ny00NGNiLWE2MjctMjYyMmY3MjZjNzEwIiwiZW1haWxfdmVyaWZpZWQiOmZhbHNlLCJuYW1lIjoidGVzdCB1c2VyIDEgVGVzdGVyIiwicHJlZmVycmVkX3VzZXJuYW1lIjoidGVzdHVzZXIxIiwiZ2l2ZW5fbmFtZSI6InRlc3QgdXNlciAxIiwiZmFtaWx5X25hbWUiOiJUZXN0ZXIiLCJlbWFpbCI6ImZkdXZpdmllcit0ZXN0dXNlcjFAZ21haWwuY29tIn0.h9R3nkDZ4C1LMAHKY-iBr24vW2tZMDwNgkA-6S1GQ2KNdnCjaOnROGB0bOCD5vaJO09YqItduM2gBD-oWGX0WuX57p5r5h3lCJi12NEV1YUdc0Z_pqB5ZvmXnJcquejqnnIiia8utcsOUQOsvhDZI4E0afyNl4J0JzcTwwIeOsP_oxkaFCb1aIMOVEIVwyOQYUfIcXsyFNJm356zgMQbD3WNI3eNCi2bDs-KfKaasCdgrMYjEM7gfXetgkJVbgT0v0AXyo9pzVGFDjzNPkoNNo0P5in8AA0qh2C3F-EXFsj3Xmagb_K1un94q4wW4IEMUqbhHbuR2bdePzg6219-Kg";
const USER1_ID = decodeJwt(USER1_TOKEN).sub;
const USER2_TOKEN =
  "eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJnUGI4VjZ5dHZTMkpFakdjVDFlLWdTWVRPbFBTNm04Xzkta210cHFDMktVIn0.eyJleHAiOjE3NDgyMzk0OTksImlhdCI6MTc0ODIzOTQzOSwiYXV0aF90aW1lIjoxNzQ4MjM5NDM5LCJqdGkiOiJjYzYzYzAzZS1mNDAxLTQ0OGQtOGM3NS0zOWI5ZDEzY2M1ODAiLCJpc3MiOiJodHRwczovL2tleWNsb2FrLnAxbS5ubC9yZWFsbXMvbWFzdGVyIiwiYXVkIjoiYWNjb3VudCIsInN1YiI6IjdjNTJhZDk3LTBhODYtNDQwYy05NDVlLWNmMzhlNDc5MzNjZiIsInR5cCI6IkJlYXJlciIsImF6cCI6ImJhZGdlaHViIiwic2Vzc2lvbl9zdGF0ZSI6IjEzNmUxYmIzLWYzOWUtNGFlZC1hMjI5LTc3OTM1M2NiMjEwNCIsImFjciI6IjEiLCJhbGxvd2VkLW9yaWdpbnMiOlsiaHR0cHM6Ly9iYWRnZWh1Yi5wMW0ubmwvIl0sInJlYWxtX2FjY2VzcyI6eyJyb2xlcyI6WyJkZWZhdWx0LXJvbGVzLW1hc3RlciIsIm9mZmxpbmVfYWNjZXNzIiwidW1hX2F1dGhvcml6YXRpb24iXX0sInJlc291cmNlX2FjY2VzcyI6eyJhY2NvdW50Ijp7InJvbGVzIjpbIm1hbmFnZS1hY2NvdW50IiwibWFuYWdlLWFjY291bnQtbGlua3MiLCJ2aWV3LXByb2ZpbGUiXX19LCJzY29wZSI6Im9wZW5pZCBlbWFpbCBwcm9maWxlIiwic2lkIjoiMTM2ZTFiYjMtZjM5ZS00YWVkLWEyMjktNzc5MzUzY2IyMTA0IiwiZW1haWxfdmVyaWZpZWQiOmZhbHNlLCJuYW1lIjoidG9tIGdhZ2EiLCJwcmVmZXJyZWRfdXNlcm5hbWUiOiJ0b21nYWdhIiwiZ2l2ZW5fbmFtZSI6InRvbSIsImZhbWlseV9uYW1lIjoiZ2FnYSIsImVtYWlsIjoidG9tZ2FnYUBnbWFpbC5jb20ifQ.fLWOhYDJUhfqqffVBM-mH3A96SIch8sKJbFc_W2sot7jq-5cTyyeJr4hLETFgZmfUZaKvVFnMT_hyDuYCvbb3VVdDcF4KTt1p-6ZmdfJs6A5FJVN56iYLj0QQKIV7HJ_RDpzl1eCfteO5IgNAecqKcbGXhDDjPwu2PYpVaAcVNopHXaQh1JQtIEUXAFzmWiFuVIt1UJO44vTM8f3Fvha9GfQG7IuQiCEGp_esEH2dS50gqkiJGl0WfJVGG4NvIh1EdrMlMo6YkfkqYkNLmZTnt_3q6x6ObNGX02JUEeaFYNf5XuW0M-70iIwzPpdlnc6EKOrdWOz9srTBRx2wz9f0A";
const toSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]/g, "_");

const createProject = async (app: Express, projectSlug: string) => {
  const res1 = await request(app)
    .post(`/api/v3/projects/${projectSlug}`)
    .auth(USER1_TOKEN, { type: "bearer" });

  expect(res1.statusCode).toBeGreaterThanOrEqual(200); // Sanity check
  expect(res1.statusCode).toBeLessThan(300); // Sanity check
};

describe(
  "The API should return a 403 if the user is not authorized of the project or operation",
  () => {
    let app: ReturnType<typeof express>;
    let randomUUID: string;
    let user1AppId: string;

    beforeAll(async () => {
      randomUUID = crypto.randomUUID();
      user1AppId = toSlug("auth_test_user_1_" + crypto.randomUUID());
      app = createExpressServer();
      await createProject(app, user1AppId);
    });

    describe("/projects/{slug}/draft", () => {
      test("GET /projects/{slug}/draft", async () => {
        const res = await request(app)
          .get(`/api/v3/projects/${user1AppId}/draft`)
          .auth(USER2_TOKEN, { type: "bearer" });
        expect(res.statusCode).toBe(403);
      });
    });

    describe("/users/{userId}/drafts", () => {
      test("GET /users/{userId}/drafts", async () => {
        const res = await request(app)
          .get(`/api/v3/users/${USER1_ID}/drafts`)
          .auth(USER2_TOKEN, { type: "bearer" });
        expect(res.statusCode).toBe(403);
      });
    });

    describe("/projects/{slug}/draft/files/{filePath}", () => {
      test("POST /projects/{slug}/draft/files/{filePath}", async () => {
        const res = await request(app)
          .post(
            `/api/v3/projects/${user1AppId}/draft/files/test_${randomUUID}.txt`
          )
          .auth(USER2_TOKEN, { type: "bearer" })
          .attach("file", Buffer.from("test file content"), "test.txt");
        expect(res.statusCode).toBe(403);
      });

      describe("GET/DELETE /api/v3/projects/codecraft/draft/files/test_[random].txt", () => {
        const ORIGINAL_FILE_CONTENT = "original file content";
        beforeEach(async () => {
          const res = await request(app)
            .post(
              `/api/v3/projects/${user1AppId}/draft/files/test_${randomUUID}.txt`
            )
            .auth(USER1_TOKEN, { type: "bearer" })
            .attach("file", Buffer.from(ORIGINAL_FILE_CONTENT), "test.txt");
          expect(res.statusCode).toBe(204);
        });

        afterEach(async () => {
          const getRes2 = await request(app)
            .get(
              `/api/v3/projects/${user1AppId}/draft/files/test_${randomUUID}.txt`
            )
            .auth(USER1_TOKEN, { type: "bearer" });
          expect(getRes2.statusCode).toBe(200);
          expect(getRes2.text).toBe(ORIGINAL_FILE_CONTENT);
        });

        test("GET /projects/codecraft/draft/files/test.txt", async () => {
          const getRes = await request(app)
            .get(
              `/api/v3/projects/${user1AppId}/draft/files/test_${randomUUID}.txt`
            )
            .auth(USER2_TOKEN, { type: "bearer" });
          expect(getRes.statusCode).toBe(403);
        });

        test("DELETE /projects/codecraft/draft/files/test.txt", async () => {
          const deleteRes = await request(app)
            .delete(
              `/api/v3/projects/${user1AppId}/draft/files/test_${randomUUID}.txt`
            )
            .auth(USER2_TOKEN, { type: "bearer" });
          expect(deleteRes.statusCode).toBe(403);
        });

        test("POST /projects/codecraft/draft/files/test.txt", async () => {
          const postRes = await request(app)
            .post(
              `/api/v3/projects/${user1AppId}/draft/files/test_${randomUUID}.txt`
            )
            .auth(USER2_TOKEN, { type: "bearer" })
            .attach("file", Buffer.from(ORIGINAL_FILE_CONTENT), "test.txt");
          expect(postRes.statusCode).toBe(403);
        });
      });
    });

    describe("/projects/{slug}", () => {
      let dynamicTestAppId: string;
      let originalProject: string;
      beforeEach(async () => {
        const createProjectProps: Omit<
          CreateProjectProps,
          "slug" | "idp_user_id"
        > = {};
        // Reason that we make the test project id dynamic is to avoid that the test fails if you run it multiple times locally and possibly stop halfware through the test.
        dynamicTestAppId = toSlug(`test_app_${crypto.randomUUID()}`);
        const postRes = await request(app)
          .post(`/api/v3/projects/${dynamicTestAppId}`)
          .auth(USER1_TOKEN, { type: "bearer" })
          .send(createProjectProps);
        expect(postRes.statusCode.toString()).toMatch(/2\d\d/);
        const getRes = await request(app)
          .get(`/api/v3/projects/${dynamicTestAppId}/draft`)
          .auth(USER1_TOKEN, { type: "bearer" });
        expect(getRes.statusCode).toBe(200); // Sanity check
        originalProject = getRes.body;
      });

      afterEach(async () => {
        const getRes = await request(app)
          .get(`/api/v3/projects/${dynamicTestAppId}/draft`)
          .auth(USER1_TOKEN, { type: "bearer" });
        expect(getRes.statusCode).toBe(200); // Sanity check
        expect(getRes.body).toEqual(originalProject);
      });

      test("GET project", async () => {
        const getRes = await request(app)
          .get(`/api/v3/projects/${dynamicTestAppId}/draft`)
          .auth(USER2_TOKEN, { type: "bearer" });
        expect(getRes.status).toBe(403);
        expect(getRes.body).not.toEqual(originalProject);
      });

      test("DELETE project", async () => {
        const delRes = await request(app)
          .delete(`/api/v3/projects/${dynamicTestAppId}`)
          .auth(USER2_TOKEN, { type: "bearer" });
        expect(delRes.status).toBe(403);
      });

      test("PATCH project", async () => {
        const updateAppRes = await request(app)
          .patch(`/api/v3/projects/${dynamicTestAppId}/draft/metadata`)
          .auth(USER2_TOKEN, { type: "bearer" })
          .send({
            description: "Test App Description Before Publish",
          });
        expect(updateAppRes.status).toBe(403);
      });
    });

    describe("/api/v3/projects/{slug}/publish", () => {
      test("publish version", async () => {
        // Verify the metadata was added
        const getRes1 = await request(app)
          .get(`/api/v3/projects/${user1AppId}/draft`)
          .auth(USER1_TOKEN, { type: "bearer" });
        expect(getRes1.statusCode).toBe(200);

        // Try Publish the project to create a new version
        const publishRes = await request(app)
          .patch(`/api/v3/projects/${user1AppId}/publish`)
          .auth(USER2_TOKEN, { type: "bearer" });
        expect(publishRes.statusCode).toEqual(403);

        const getRes2 = await request(app)
          .get(`/api/v3/projects/${user1AppId}/draft`)
          .auth(USER1_TOKEN, { type: "bearer" });
        expect(getRes2.statusCode).toBe(200);
        expect(getRes2.body).toEqual(getRes1.body);
      });
    });
  },
  { timeout: isInDebugMode() ? 3600_000 : undefined }
);
