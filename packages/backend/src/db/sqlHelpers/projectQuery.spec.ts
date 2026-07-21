import {
  type ProjectQueryResponse,
  projectQueryResponseToReadModel,
} from "@db/sqlHelpers/projectQuery";
import { describe, expect, test } from "vitest";

describe("projectQueryResponseToReadModel", () => {
  test("includes the metadata version in project summaries", () => {
    const dbProject = {
      slug: "versioned-app",
      idp_user_id: "test-user",
      created_at: "2024-01-01T00:00:00.000Z",
      updated_at: "2024-01-01T00:00:00.000Z",
      draft_revision: 2,
      latest_revision: 1,
      project_slug: "versioned-app",
      id: 1,
      revision: 1,
      blur_hash: "LEHV6nWB2yk8pyo0adR*.7kCMdnj",
      app_metadata: {
        name: "Versioned App",
        version: "1.2.3",
      },
      published_at: "2024-01-02T00:00:00.000Z",
      download_count: 0,
      distinct_installs: "0",
      average_rating: null,
      rating_count: null,
    } as ProjectQueryResponse;

    expect(projectQueryResponseToReadModel(dbProject)).toMatchObject({
      slug: "versioned-app",
      name: "Versioned App",
      blur_hash: "LEHV6nWB2yk8pyo0adR*.7kCMdnj",
      revision: 1,
      version: "1.2.3",
      development_status: "stable",
    });
  });

  test("uses development status from metadata when present", () => {
    const dbProject = {
      slug: "wip-app",
      idp_user_id: "test-user",
      created_at: "2024-01-01T00:00:00.000Z",
      updated_at: "2024-01-01T00:00:00.000Z",
      draft_revision: 2,
      latest_revision: 1,
      project_slug: "wip-app",
      id: 1,
      revision: 1,
      blur_hash: undefined,
      app_metadata: {
        name: "WIP App",
        development_status: "work_in_progress",
      },
      published_at: "2024-01-02T00:00:00.000Z",
      download_count: 0,
      distinct_installs: "0",
      average_rating: null,
      rating_count: null,
    } as ProjectQueryResponse;

    expect(projectQueryResponseToReadModel(dbProject)).toMatchObject({
      slug: "wip-app",
      development_status: "work_in_progress",
    });
  });
});
