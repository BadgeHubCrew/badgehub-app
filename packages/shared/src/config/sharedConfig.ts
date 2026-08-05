export const MAX_UPLOAD_FILE_SIZE_BYTES = 432 * 1024 * 1024; // 432 MB

export type SharedConfig = {
  BADGE_SLUGS: [string, ...string[]];
  CATEGORY_NAMES: [string, ...string[]];
  ADMIN_CATEGORY_NAMES: [string, ...string[]];
  BADGEHUB_API_BASE_URL: string;
  keycloakPublic: {
    realmIssuerUrl: string;
    KEYCLOAK_BASE_URL: string;
    KEYCLOAK_REALM: string;
    KEYCLOAK_CLIENT_ID: string;
  };
  isDevEnvironment: boolean;
};

export function getAndAssertEnv(envVarName: string) {
  const envVar = process.env[envVarName];
  if (envVar == null) {
    throw new Error(
      `Environment variable [${envVarName}] is not set and is required.`
    );
  }
  return envVar;
}

function readBFFEnv(): SharedConfig {
  const KEYCLOAK_BASE_URL = getAndAssertEnv("KEYCLOAK_BASE_URL");
  const KEYCLOAK_REALM = process.env.KEYCLOAK_REALM ?? "master";
  return {
    keycloakPublic: {
      KEYCLOAK_BASE_URL,
      KEYCLOAK_REALM,
      KEYCLOAK_CLIENT_ID:
        process.env.KEYCLOAK_CLIENT_ID ?? "badgehub-api-frontend",
      realmIssuerUrl: `${KEYCLOAK_BASE_URL}/realms/${KEYCLOAK_REALM}`,
    },
    BADGEHUB_API_BASE_URL: getAndAssertEnv("BADGEHUB_API_BASE_URL"),
    BADGE_SLUGS: getAndAssertEnv("BADGE_SLUGS").split(",") as [
      string,
      ...string[],
    ],
    CATEGORY_NAMES: [...getAndAssertEnv("CATEGORY_NAMES").split(",")] as [
      string,
      ...string[],
    ],
    ADMIN_CATEGORY_NAMES: (process.env.ADMIN_CATEGORY_NAMES?.split(",") ?? [
      "Default",
    ]) as [string, ...string[]],
    isDevEnvironment: process.env.NODE_ENV === "development",
  };
}

export const getSharedConfig = (): SharedConfig => {
  const sharedConfig = (
    globalThis as typeof globalThis & { __SHARED_CONFIG__?: SharedConfig }
  ).__SHARED_CONFIG__;
  return sharedConfig ?? readBFFEnv();
};
