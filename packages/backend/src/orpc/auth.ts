import {
  DISABLE_AUTH,
  KEYCLOAK_CERTS_URL,
  KEYCLOAK_REALM_ISSUER_URL,
} from "@config";
import { ORPCError } from "@orpc/server";
import { createRemoteJWKSet, decodeJwt, jwtVerify } from "jose";
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

async function verifyJwt(token: string) {
  if (DISABLE_AUTH) return;
  await jwtVerify(token, JWKS, {
    issuer: KEYCLOAK_REALM_ISSUER_URL,
    algorithms: ["RS256"],
  });
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

  try {
    await verifyJwt(token);
  } catch {
    throw new ORPCError("UNAUTHORIZED", {
      status: 401,
      message: "JWT verification failed",
      data: { reason: "JWT verification failed" },
    });
  }

  let sub: string | undefined;
  try {
    const payload = decodeJwt(token);
    sub = typeof payload.sub === "string" ? payload.sub : undefined;
  } catch {
    throw new ORPCError("UNAUTHORIZED", {
      status: 401,
      message: "Unable to decode JWT token",
      data: { reason: "Unable to decode JWT token" },
    });
  }

  if (!sub) {
    throw new ORPCError("UNAUTHORIZED", {
      status: 401,
      message: "JWT does not contain user sub",
      data: { reason: "JWT does not contain user sub" },
    });
  }

  return next({
    context: {
      user: { idp_user_id: sub },
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
