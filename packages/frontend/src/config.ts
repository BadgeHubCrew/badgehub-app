import { getSharedConfig } from "@shared/config/sharedConfig.ts";

export const REPO_URL = "https://github.com/badgehubcrew/badgehub-app";
export const BADGEHUB_FRONTEND_BASE_URL =
  globalThis.document?.location?.origin ?? "";
export const APP_GRID_PAGE_SIZE = 12;
export const FALLBACK_ICON_URL = `${BADGEHUB_FRONTEND_BASE_URL}/assets/no-icon-uploaded.png`;
export const ERROR_ICON_URL = `${BADGEHUB_FRONTEND_BASE_URL}/assets/no-icon-uploaded.png`;

const sharedConfig = getSharedConfig();
export const KEYCLOAK_CLIENT_ID =
  sharedConfig.keycloakPublic.KEYCLOAK_CLIENT_ID;
export const BADGEHUB_API_BASE_URL = BADGEHUB_FRONTEND_BASE_URL;
export const KEYCLOAK_BASE_URL = sharedConfig.keycloakPublic.KEYCLOAK_BASE_URL;
export const KEYCLOAK_REALM = sharedConfig.keycloakPublic.KEYCLOAK_REALM;
export const KEYCLOAK_REALM_ISSUER_URL = `${KEYCLOAK_BASE_URL}/realms/${KEYCLOAK_REALM}`;
export const IS_DEV_ENVIRONMENT = sharedConfig.isDevEnvironment;

export const BADGE_SLUGS = sharedConfig.BADGE_SLUGS;
export const BADGHUB_API_V3_URL = `${BADGEHUB_API_BASE_URL}/api/v3`;
