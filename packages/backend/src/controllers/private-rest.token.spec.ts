import { beforeAll, beforeEach, describe, expect, test } from "vitest";
import request from "supertest";
import type { Express } from "express";
import { createExpressServer } from "#createExpressServer";
import { isInDebugMode } from "#util/debug";
import { decodeJwt } from "jose";
import type { ProjectApiTokenMetadata } from "@badgehub/shared/domain/readModels/project/ProjectApiToken";

const USER1_TOKEN =
  "eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJnUGI4VjZ5dHZTMkpFakdjVDFlLWdTWVRPbFBTNm04Xzkta210cHFDMktVIn0.eyJleHAiOjE3NDgyOTA4NzMsImlhdCI6MTc0ODI5MDgxMywiYXV0aF90aW1lIjoxNzQ4MjkwODEzLCJqdGkiOiI1NmIzOTUwNS0yYjJmLTQ1MDgtOTY0NC03NTFmN2FjMzI0ZGQiLCJpc3MiOiJodHRwczovL2tleWNsb2FrLnAxbS5ubC9yZWFsbXMvbWFzdGVyIiwiYXVkIjoiYWNjb3VudCIsInN1YiI6ImQ4MDc1MzM3LTBmMTAtNGNkYi04YjQ4LWJlMWRjMTg3NDdhMyIsInR5cCI6IkJlYXJlciIsImF6cCI6ImJhZGdlaHViIiwic2Vzc2lvbl9zdGF0ZSI6IjIzMWFkYmRkLTE1NDctNDRjYi1hNjI3LTI2MjJmNzI2YzcxMCIsImFjciI6IjEiLCJhbGxvd2VkLW9yaWdpbnMiOlsiaHR0cHM6Ly9iYWRnZWh1Yi5wMW0ubmwvIl0sInJlYWxtX2FjY2VzcyI6eyJyb2xlcyI6WyJkZWZhdWx0LXJvbGVzLW1hc3RlciIsIm9mZmxpbmVfYWNjZXNzIiwidW1hX2F1dGhvcml6YXRpb24iXX0sInJlc291cmNlX2FjY2VzcyI6eyJhY2NvdW50Ijp7InJvbGVzIjpbIm1hbmFnZS1hY2NvdW50IiwibWFuYWdlLWFjY291bnQtbGlua3MiLCJ2aWV3LXByb2ZpbGUiXX19LCJzY29wZSI6Im9wZW5pZCBlbWFpbCBwcm9maWxlIiwic2lkIjoiMjMxYWRiZGQtMTU0Ny00NGNiLWE2MjctMjYyMmY3MjZjNzEwIiwiZW1haWxfdmVyaWZpZWQiOmZhbHNlLCJuYW1lIjoidGVzdCB1c2VyIDEgVGVzdGVyIiwicHJlZmVycmVkX3VzZXJuYW1lIjoidGVzdHVzZXIxIiwiZ2l2ZW5fbmFtZSI6InRlc3QgdXNlciAxIiwiZmFtaWx5X25hbWUiOiJUZXN0ZXIiLCJlbWFpbCI6ImZkdXZpdmllcit0ZXN0dXNlcjFAZ21haWwuY29tIn0.h9R3nkDZ4C1LMAHKY-iBr24vW2tZMDwNgkA-6S1GQ2KNdnCjaOnROGB0bOCD5vaJO09YqItduM2gBD-oWGX0WuX57p5r5h3lCJi12NEV1YUdc0Z_pqB5ZvmXnJcquejqnnIiia8utcsOUQOsvhDZI4E0afyNl4J0JzcTwwIeOsP_oxkaFCb1aIMOVEIVwyOQYUfIcXsyFNJm356zgMQbD3WNI3eNCi2bDs-KfKaasCdgrMYjEM7gfXetgkJVbgT0v0AXyo9pzVGFDjzNPkoNNo0P5in8AA0qh2C3F-EXFsj3Xmagb_K1un94q4wW4IEMUqbhHbuR2bdePzg6219-Kg";
const USER1_ID = decodeJwt(USER1_TOKEN).sub;
const toSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]/g, "_");

describe("Project API Tokens", () => {
  let app: Express;
  beforeAll(() => {
    console.warn = () => {}; // Suppress console.warn messages during tests
    app = createExpressServer();
  });

  describe(
    "with new project created",
    () => {
      let dynamicAppId: string;
      beforeEach(async () => {
        console.warn = () => {}; // Suppress console.warn messages during tests
        dynamicAppId = toSlug(`test_user1_app_${crypto.randomUUID()}`);
        const postRes = await request(app)
          .post(`/api/v3/projects/${dynamicAppId}`)
          .auth(USER1_TOKEN, { type: "bearer" })
          .send();
        expect(postRes.statusCode).toBe(204);
      });

      test("CRD /projects/{slug}/token and usage", async () => {
        const getRes0 = await request(app)
          .get(`/api/v3/projects/${dynamicAppId}/token`)
          .auth(USER1_TOKEN, { type: "bearer" });
        expect(getRes0.statusCode).toBe(404);

        const createTokenRes = await request(app)
          .post(`/api/v3/projects/${dynamicAppId}/token`)
          .auth(USER1_TOKEN, { type: "bearer" })
          .send();
        expect(createTokenRes.statusCode).toBe(200);
        expect(createTokenRes.body).toEqual({
          token: expect.any(String),
        });

        const getResAfterCreate = await request(app)
          .get(`/api/v3/projects/${dynamicAppId}/token`)
          .auth(USER1_TOKEN, { type: "bearer" });
        expect(getResAfterCreate.statusCode).toBe(200);

        const body = getResAfterCreate.body as ProjectApiTokenMetadata;
        const oneMinuteMillis = 60_000;
        // Test that the date is sensible
        expect(
          -Math.abs(Date.now() - Date.parse(body.created_at))
        ).toBeGreaterThanOrEqual(-oneMinuteMillis);
        expect(
          -Math.abs(Date.now() - Date.parse(body.last_used_at))
        ).toBeGreaterThanOrEqual(-oneMinuteMillis);

        const deleteRes = await request(app)
          .delete(`/api/v3/projects/${dynamicAppId}/token`)
          .auth(USER1_TOKEN, { type: "bearer" })
          .send();
        expect(deleteRes.statusCode).toBe(204);

        const getResAfterDelete = await request(app)
          .get(`/api/v3/projects/${dynamicAppId}/token`)
          .auth(USER1_TOKEN, { type: "bearer" });
        expect(getResAfterDelete.statusCode).toBe(404);
      });

      test("using a token should work", async () => {
        const createTokenRes = await request(app)
          .post(`/api/v3/projects/${dynamicAppId}/token`)
          .auth(USER1_TOKEN, { type: "bearer" })
          .send();
        expect(createTokenRes.statusCode).toBe(200);
        expect(createTokenRes.body).toEqual({
          token: expect.any(String),
        });
        const dynamicAppToken = createTokenRes.body.token;

        const getDraftRes = await request(app)
          .get(`/api/v3/projects/${dynamicAppId}/draft`)
          .set("badgehub-api-token", "Bearer " + dynamicAppToken);
        expect(getDraftRes.statusCode).toBe(200);
      });

      test("invalid token should not work", async () => {
        const getDraftRes = await request(app)
          .get(`/api/v3/projects/${dynamicAppId}/draft`)
          .set("badgehub-api-token", "Bearer " + "invalidtoken");
        expect(getDraftRes.statusCode).toBe(403);

        const createTokenRes = await request(app)
          .post(`/api/v3/projects/${dynamicAppId}/token`)
          .auth(USER1_TOKEN, { type: "bearer" })
          .send();
        expect(createTokenRes.statusCode).toBe(200);
        expect(createTokenRes.body).toEqual({
          token: expect.any(String),
        });
        const dynamicAppToken = createTokenRes.body.token;

        const dynamicAppId2 = toSlug(`test_user1_app_${crypto.randomUUID()}`);
        const createApp2Res = await request(app)
          .post(`/api/v3/projects/${dynamicAppId2}`)
          .auth(USER1_TOKEN, { type: "bearer" })
          .send();
        expect(createApp2Res.statusCode).toBe(204);

        const getDraftForOtherProject = await request(app)
          .get(`/api/v3/projects/${dynamicAppId2}/draft`)
          .set("badgehub-api-token", "Bearer " + dynamicAppToken);
        expect(getDraftForOtherProject.statusCode).toBe(403);

        const createP2TokenRes = await request(app)
          .post(`/api/v3/projects/${dynamicAppId2}/token`)
          .auth(USER1_TOKEN, { type: "bearer" })
          .send();
        expect(createP2TokenRes.statusCode).toBe(200);
        const p2Token = createP2TokenRes.body.token;

        // Sanity check
        const getDraftForOtherProjectCorrect = await request(app)
          .get(`/api/v3/projects/${dynamicAppId2}/draft`)
          .set("badgehub-api-token", "Bearer " + p2Token);
        expect(getDraftForOtherProjectCorrect.statusCode).toBe(200);

        const getDraftForOtherProjectWithToken = await request(app)
          .get(`/api/v3/projects/${dynamicAppId2}/draft`)
          .set("badgehub-api-token", "Bearer " + dynamicAppToken);
        expect(getDraftForOtherProjectWithToken.statusCode).toBe(403);
      });

      describe("With api token for dynamicAppId", async () => {
        let dynamicApp1Token: string;
        beforeEach(async () => {
          const createTokenRes = await request(app)
            .post(`/api/v3/projects/${dynamicAppId}/token`)
            .auth(USER1_TOKEN, { type: "bearer" })
            .send();
          expect(createTokenRes.statusCode).toBe(200);
          dynamicApp1Token = createTokenRes.body.token;
        });
        test("token should not be usable for project creation", async () => {
          const dynamicAppId2 = toSlug(`test_user1_app_${crypto.randomUUID()}`);
          const postRes = await request(app)
            .post(`/api/v3/projects/${dynamicAppId2}`)
            .set("badgehub-api-token", "Bearer " + dynamicApp1Token);
          expect(postRes.statusCode).toBe(403);
        });

        test("token overwriting should be possible", async () => {
          const createTokenRes2 = await request(app)
            .post(`/api/v3/projects/${dynamicAppId}/token`)
            .auth(USER1_TOKEN, { type: "bearer" })
            .send();
          expect(createTokenRes2.statusCode).toBe(200);
          expect(createTokenRes2.body).toEqual({
            token: expect.any(String),
          });
          expect(createTokenRes2.body.token).not.toEqual(dynamicApp1Token);
        });

        test("GET /users/{userId}/drafts should not be possible with an api-token", async () => {
          const res = await request(app)
            .get(`/api/v3/users/${USER1_ID}/drafts`)
            .set("badgehub-api-token", "Bearer " + dynamicApp1Token);
          expect(res.statusCode).toBe(403);
        });
      });
    },
    { timeout: isInDebugMode() ? 3600_000 : undefined }
  );
});
