export const REPO_URL = "https://github.com/badgehubcrew/badgehub-app";

function getRequiredEnv(name: string): string {
  const value = import.meta.env[name];
  if (value == null || value === "") {
    throw new Error(`Missing required frontend env: ${name}`);
  }
  return value;
}

function parseCsvEnv(name: string): [string, ...string[]] {
  const raw = getRequiredEnv(name);
  const values = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (values.length === 0) {
    throw new Error(`Env ${name} must contain at least one non-empty value`);
  }

  return values as [string, ...string[]];
}

export const APP_GRID_PAGE_SIZE = 12;

const FRONTEND_BASE_URL = import.meta.env.BASE_URL;
export const FALLBACK_ICON_URL = `${FRONTEND_BASE_URL}assets/no-icon-uploaded.png`;
export const ERROR_ICON_URL = `${FRONTEND_BASE_URL}assets/no-icon-uploaded.png`;

export const KEYCLOAK_CLIENT_ID = getRequiredEnv("VITE_KEYCLOAK_CLIENT_ID");
export const BADGEHUB_API_BASE_URL = getRequiredEnv("VITE_BADGEHUB_API_BASE_URL");
export const KEYCLOAK_BASE_URL = getRequiredEnv("VITE_KEYCLOAK_BASE_URL");
export const KEYCLOAK_REALM = getRequiredEnv("VITE_KEYCLOAK_REALM");
export const KEYCLOAK_REALM_ISSUER_URL =
  KEYCLOAK_BASE_URL + "/realms/" + KEYCLOAK_REALM;

export const IS_DEV_ENVIRONMENT = import.meta.env.DEV;

export const BADGE_SLUGS = parseCsvEnv("VITE_BADGE_SLUGS");
export const BADGHUB_API_V3_URL = BADGEHUB_API_BASE_URL + "/api/v3";
