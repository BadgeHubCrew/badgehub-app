import { createRemoteJWKSet, jwtVerify } from "jose";
import {
  DISABLE_AUTH,
  KEYCLOAK_CERTS_URL,
  KEYCLOAK_REALM_ISSUER_URL,
} from "#config";
import type { Response } from "express";
import type { NextFunction } from "express";

const JWKS = createRemoteJWKSet(new URL(KEYCLOAK_CERTS_URL!));

async function jwtVerifyTokenMiddleware(
  req: { headers: { authorization?: string; "badgehub-api-token"?: string } },
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    if (req.headers["badgehub-api-token"]) {
      next();
      return;
    }
    return res
      .status(401)
      .json({
        error: "Authorization as well as badgehub-api-token header is missing",
      });
  }

  const [bearer, token] = authHeader.split(" ");

  if (
    bearer !== "Bearer" ||
    !token ||
    token.trim() === "" ||
    token === "undefined"
  ) {
    return res.status(401).json({ reason: "Not authenticated" });
  }
  try {
    await jwtVerifyToken(token);
    next();
  } catch (error) {
    console.error("JWT verification error:", error);
    return res.status(401).json({ reason: "JWT verification failed" });
  }
}

async function jwtVerifyToken(token: string) {
  if (DISABLE_AUTH) {
    return;
  }
  try {
    await jwtVerify(token, JWKS, {
      issuer: KEYCLOAK_REALM_ISSUER_URL,
      algorithms: ["RS256"],
    });
  } catch (error) {
    console.error("JWT verification error:", error);
    throw new Error("JWT verification failed");
  }
}

export { jwtVerifyTokenMiddleware };
