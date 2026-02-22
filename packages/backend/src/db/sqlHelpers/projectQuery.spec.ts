import { describe, expect, it } from "vitest";
import {
  getBaseSelectProjectQuery,
  projectQueryResponseToReadModel,
} from "@db/sqlHelpers/projectQuery";

describe("projectQuery helpers", () => {
  it("uses latest revision join by default", () => {
    const query = getBaseSelectProjectQuery();
    const sqlText = query.strings.join(" ");
    expect(sqlText).toContain("p.latest_revision");
    expect(sqlText).not.toContain("p.draft_revision");
  });

  it("uses draft revision join for draft queries", () => {
    const query = getBaseSelectProjectQuery("draft");
    const sqlText = query.strings.join(" ");
    expect(sqlText).toContain("p.draft_revision");
  });

  it("maps DB response into ProjectSummary read model", () => {
    const mapped = projectQueryResponseToReadModel({
      slug: "demo-app",
      idp_user_id: "user-1",
      created_at: "2026-02-22T00:00:00.000Z",
      updated_at: "2026-02-22T00:00:00.000Z",
      deleted_at: null,
      project_slug: "demo-app",
      revision: 3,
      published_at: "2026-02-22T00:00:00.000Z",
      size_of_zip: 0,
      app_metadata: {
        name: "Demo App",
        description: "desc",
        badges: ["mcore"],
        categories: ["game"],
        icon_map: { "64x64": "icon-64x64.png" },
      },
      distinct_installs: 42,
    });

    expect(mapped.slug).toBe("demo-app");
    expect(mapped.name).toBe("Demo App");
    expect(mapped.installs).toBe(42);
    expect(mapped.badges).toEqual(["mcore"]);
    expect(mapped.icon_map?.["64x64"].full_path).toBe("icon-64x64.png");
    expect(mapped.icon_map?.["64x64"].url).toContain("/projects/demo-app/rev3/files/icon-64x64.png");
  });

  it("falls back to slug for missing app name and sets draft icon URL for unpublished versions", () => {
    const mapped = projectQueryResponseToReadModel({
      slug: "draft-app",
      idp_user_id: "user-1",
      created_at: "2026-02-22T00:00:00.000Z",
      updated_at: "2026-02-22T00:00:00.000Z",
      deleted_at: null,
      project_slug: "draft-app",
      revision: 7,
      published_at: null,
      size_of_zip: 0,
      app_metadata: {
        description: "desc",
        badges: ["mcore"],
        categories: ["game"],
        hidden: true,
        icon_map: { "64x64": "icon.png" },
      },
      distinct_installs: "0",
    });

    expect(mapped.name).toBe("draft-app");
    expect(mapped.hidden).toBe(true);
    expect(mapped.icon_map?.["64x64"].url).toContain("/projects/draft-app/draft/files/icon.png");
  });
});
