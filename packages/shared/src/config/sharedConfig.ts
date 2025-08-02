export type SharedConfig = {
  badges: [string, ...string[]];
  categories: [string, ...string[]];
  adminOnlyCategories: [string, ...string[]];
  badgeHubBaseUrl: string;
  keycloakIssuer: {
    realmUrl: string;
    origin: string;
    realm: string;
    clientId: string;
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

export const getSharedConfig = (): SharedConfig => {
  return (
    (globalThis as any).__SHARED_CONFIG__ ?? {
      keycloakIssuer: {
        realmUrl: getAndAssertEnv("KEYCLOAK_ISSUER"),
        origin: new URL(getAndAssertEnv("KEYCLOAK_ISSUER"))?.origin,
        realm: getAndAssertEnv("KEYCLOAK_ISSUER").split("/").at(-1),
        clientId: process.env.KEYCLOAK_CLIENT_ID ?? "badgehub-api-frontend",
      },
      badgeHubBaseUrl: getAndAssertEnv("BADGEHUB_API_BASE_URL"),
      badges: getAndAssertEnv("BADGE_SLUGS")?.split(","),
      categories: [...getAndAssertEnv("CATEGORY_NAMES")?.split(",")],
      adminOnlyCategories: process.env["ADMIN_CATEGORY_NAMES"]?.split(",") ?? [
        "Default",
      ],
      isDevEnvironment: process.env.NODE_ENV === "development",
    }
  );
};
