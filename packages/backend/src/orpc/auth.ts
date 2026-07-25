import { rolesFromJwtPayload } from "@auth/roles-from-jwt";
import {
  DISABLE_AUTH,
  KEYCLOAK_CERTS_URL,
  KEYCLOAK_CLIENT_ID,
  KEYCLOAK_REALM_ISSUER_URL,
} from "@config";
import { ORPCError } from "@orpc/server";
import {
  createRemoteJWKSet,
  decodeJwt,
  type JWTPayload,
  jwtVerify,
} from "jose";
import type { AuthContext } from "./context";

const JWKS = createRemoteJWKSet(
  new URL(KEYCLOAK_CERTS_URL ?? "http://localhost/missing-keycloak-certs-url")
);

function stripBearerPrefix(
  value: string | null | undefined
): string | undefined {
  if (!value) return undefined;
  return value.toLowerCase().startsWith("bearer ")
    ? value.slice("bearer ".length)
    : value;
}

/**
 * Verify the access token and return its payload.
 * When auth is disabled (tests/local), only decode without cryptographic verification.
 */
async function verifyAndGetPayload(token: string): Promise<JWTPayload> {
  if (DISABLE_AUTH) {
    return decodeJwt(token);
  }
  const { payload } = await jwtVerify(token, JWKS, {
    issuer: KEYCLOAK_REALM_ISSUER_URL,
    algorithms: ["RS256"],
  });
  return payload;
}

type MiddlewareArgs = {
  context: { headers: Headers } & Partial<AuthContext>;
  next: (opts?: {
    context: Partial<AuthContext>;
  }) => // biome-ignore lint/suspicious/noExplicitAny: oRPC middleware typing
  Promise<any>;
};

/** Parses Authorization / badgehub-api-token into context. */
export async function parseAuth({ context, next }: MiddlewareArgs) {
  const authorization = context.headers.get("authorization");
  const apiToken = stripBearerPrefix(context.headers.get("badgehub-api-token"));

  if (!authorization) {
    return next({
      context: {
        user: undefined,
        apiToken,
      },
    });
  }

  const token = stripBearerPrefix(authorization);
  if (!token || token === "undefined") {
    throw new ORPCError("UNAUTHORIZED", {
      status: 401,
      message: "Not authenticated",
      data: { reason: "Not authenticated" },
    });
  }

  let payload: JWTPayload;
  try {
    payload = await verifyAndGetPayload(token);
  } catch {
    throw new ORPCError("UNAUTHORIZED", {
      status: 401,
      message: "JWT verification failed",
      data: { reason: "JWT verification failed" },
    });
  }

  const sub = typeof payload.sub === "string" ? payload.sub : undefined;
  if (!sub) {
    throw new ORPCError("UNAUTHORIZED", {
      status: 401,
      message: "JWT does not contain user sub",
      data: { reason: "JWT does not contain user sub" },
    });
  }

  return next({
    context: {
      user: {
        idp_user_id: sub,
        roles: rolesFromJwtPayload(payload, KEYCLOAK_CLIENT_ID),
      },
      apiToken,
    },
  });
}

/** Requires JWT user or API token. */
export async function requireAuth({ context, next }: MiddlewareArgs) {
  if (!context.user && !context.apiToken) {
    throw new ORPCError("UNAUTHORIZED", {
      status: 401,
      message: "Missing authorization and badgehub-api-token header",
      data: {
        reason: "Missing authorization and badgehub-api-token header",
      },
    });
  }
  return next();
}
