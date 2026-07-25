import { rolesFromJwtPayload } from "@auth/roles-from-jwt";
import { KEYCLOAK_CLIENT_ID } from "@config";
import { ErrorType, NotAuthenticatedError } from "@error";
import type { UserIdentity } from "@shared/domain/readModels/project/User";
import type { NextFunction, Request, Response } from "express";
import { decodeJwt } from "jose";

export type UserDataInRequest = UserIdentity;

export type AuthenticatedRequest = Request &
  (
    | {
        user: UserDataInRequest;
        apiToken: undefined;
      }
    | {
        user: undefined;
        apiToken: string;
      }
  );

const decodeTokenWithErrorHandling = (token: string) => {
  try {
    return decodeJwt(token);
  } catch (e) {
    console.warn(
      "JWT:decodeTokenWithErrorHandling: Unable to decodeJwt JWT token, error:",
      e
    );
    throw NotAuthenticatedError(`Unable to decode JWT token: ${e}`);
  }
};

function stripBearerPrefix<T extends string | undefined>(apiToken: T): T {
  return apiToken?.toLowerCase().startsWith("bearer ")
    ? (apiToken?.slice("bearer ".length) as T)
    : apiToken;
}

const addAuthenticationMiddleware = (
  req: { headers: { authorization?: string; "badgehub-api-token"?: string } },
  res: Response,
  next: NextFunction
) => {
  try {
    const authorizationHeader = req.headers.authorization;
    const authenticatedRequest = req as AuthenticatedRequest;
    authenticatedRequest.apiToken = stripBearerPrefix(
      req.headers["badgehub-api-token"]
    );
    if (!authorizationHeader) {
      if (!authenticatedRequest.apiToken) {
        console.warn(
          "JWT:addUserSubMiddleware: Missing authorization and badgehub-api-token header"
        );
        throw NotAuthenticatedError(
          "Missing authorization and badgehub-api-token header"
        );
      }
      next();
      return;
    }
    const token = stripBearerPrefix(authorizationHeader);
    const payload = decodeTokenWithErrorHandling(token);
    if (!("sub" in payload) || !payload.sub) {
      console.warn(
        "JWT:addUserSubMiddleware: payload does not contain user sub"
      );
      throw NotAuthenticatedError("JWT does not contain user sub");
    }
    authenticatedRequest.user = {
      idp_user_id: payload.sub,
      roles: rolesFromJwtPayload(payload, KEYCLOAK_CLIENT_ID),
    };
    next();
  } catch (e: unknown) {
    return handleError(e, res);
  }
};

const handleError = (err: unknown, res: Response) => {
  if (err && typeof err === "object" && "name" in err && "message" in err) {
    if (err.name === ErrorType.NotAuthorized) {
      res.status(403).json({ reason: err.message });
      return;
    }
    if (err.name === ErrorType.NotAuthenticated) {
      res.status(401).json({ reason: err.message });
      return;
    }
  }
  console.warn("JWT:handleError: Internal server error", err);
  res.status(500).json({ reason: "Internal server error" });
};

export { addAuthenticationMiddleware };
