import { config } from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { getAndAssertEnv, getSharedConfig } from "@badgehub/shared/config/sharedConfig";

config();

export const EXPRESS_PORT = 8081;

export const POSTGRES_DB = getAndAssertEnv("POSTGRES_DB");
console.log(`Using database: ${POSTGRES_DB}`);
export const POSTGRES_USER = getAndAssertEnv("POSTGRES_USER");
export const POSTGRES_PASSWORD = getAndAssertEnv("POSTGRES_PASSWORD");
export const POSTGRES_HOST = getAndAssertEnv("POSTGRES_HOST");
export const POSTGRES_PORT = 5432;
export const DISABLE_AUTH = process.env.DISABLE_AUTH === "true";
export const MAX_UPLOAD_FILE_SIZE_BYTES = 32 * 1024 * 1024; // 32 MB

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const FRONTEND_DIST_DIR = path.resolve(__dirname, "../../frontend/dist");
export const FRONTEND_PUBLIC_DIR = path.resolve(
  __dirname,
  "../../frontend/public"
);
const sharedConfig = getSharedConfig();
export const KEYCLOAK_CLIENT_ID =
  sharedConfig.keycloakPublic.KEYCLOAK_CLIENT_ID;
export const BADGEHUB_API_BASE_URL = sharedConfig.BADGEHUB_API_BASE_URL;
export const KEYCLOAK_BASE_URL = sharedConfig.keycloakPublic.KEYCLOAK_BASE_URL;
export const KEYCLOAK_REALM = sharedConfig.keycloakPublic.KEYCLOAK_REALM;
export const KEYCLOAK_REALM_ISSUER_URL =
  KEYCLOAK_BASE_URL + "/realms/" + KEYCLOAK_REALM;
export const IS_DEV_ENVIRONMENT = sharedConfig.isDevEnvironment;

export const KEYCLOAK_CERTS_URL =
  KEYCLOAK_REALM_ISSUER_URL + "/protocol/openid-connect/certs";

export * from "@badgehub/shared/config/sharedConfig";

// MQTT
export const MQTT_CONFIG =
  (process.env["MQTT_SERVER"] && {
    MQTT_SERVER: getAndAssertEnv("MQTT_SERVER"),
    MQTT_USER: getAndAssertEnv("MQTT_USER"),
    MQTT_PASSWD: getAndAssertEnv("MQTT_PASSWD"),
    MQTT_TOPIC: getAndAssertEnv("MQTT_TOPIC"),
    MQTT_INTERVAL_SEC: getAndAssertEnv("MQTT_INTERVAL_SEC"),
  }) ||
  undefined;

export const REFRESH_REPORTS_INTERVAL_SEC =
  process.env.REFRESH_REPORTS_INTERVAL_SEC || "300";
