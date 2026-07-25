import { rolesFromJwtPayload } from "@auth/roles-from-jwt";
import { describe, expect, it } from "vitest";

const CLIENT_ID = "badgehub-api";

describe("rolesFromJwtPayload", () => {
  it("returns no app roles when JWT has only Keycloak defaults", () => {
    expect(rolesFromJwtPayload({ sub: "abc" }, CLIENT_ID)).toEqual([]);
  });

  it("maps realm admin role", () => {
    expect(
      rolesFromJwtPayload(
        {
          sub: "abc",
          realm_access: { roles: ["offline_access", "admin"] },
        },
        CLIENT_ID
      )
    ).toEqual(["admin"]);
  });

  it("maps admin role from the configured client resource_access only", () => {
    expect(
      rolesFromJwtPayload(
        {
          sub: "abc",
          resource_access: {
            [CLIENT_ID]: { roles: ["admin"] },
            account: { roles: ["manage-account"] },
          },
        },
        CLIENT_ID
      )
    ).toEqual(["admin"]);
  });

  it("ignores admin role from an unrelated client", () => {
    expect(
      rolesFromJwtPayload(
        {
          sub: "abc",
          resource_access: {
            "other-service": { roles: ["admin"] },
            account: { roles: ["manage-account"] },
          },
        },
        CLIENT_ID
      )
    ).toEqual([]);
  });

  it("ignores unknown Keycloak roles", () => {
    expect(
      rolesFromJwtPayload(
        {
          sub: "abc",
          realm_access: {
            roles: [
              "default-roles-master",
              "offline_access",
              "uma_authorization",
            ],
          },
        },
        CLIENT_ID
      )
    ).toEqual([]);
  });
});
