import { BADGHUB_API_V3_URL } from "@config.ts";
import { createORPCClient, onError } from "@orpc/client";
import type { ContractRouterClient } from "@orpc/contract";
import type { JsonifiedClient } from "@orpc/openapi-client";
import { OpenAPILink } from "@orpc/openapi-client/fetch";
import { apiContracts } from "@shared/contracts/restContracts.ts";
import type Keycloak from "keycloak-js";

/** Per-request context for OpenAPILink (merged into HTTP headers). */
export type ApiClientContext = {
  headers?: Record<string, string>;
};

type OrpcClient = JsonifiedClient<
  ContractRouterClient<typeof apiContracts, ApiClientContext>
>;

/**
 * Normalized procedure result used by the UI.
 * Success and HTTP-level failures both resolve to this shape so call sites can
 * switch on `status` without try/catch for expected error codes.
 */
// biome-ignore lint/suspicious/noExplicitAny: call sites use status switches before narrowing body
export type ApiResult<T = any> = {
  status: number;
  body: T;
  headers: Headers;
};

type CallArgs = {
  params?: Record<string, unknown>;
  query?: Record<string, unknown>;
  body?: unknown;
  /** Per-request HTTP headers (e.g. Authorization for a single call). */
  headers?: Record<string, string>;
};

function flattenArgs(args?: CallArgs): unknown {
  if (!args) return undefined;
  const { params, query, body } = args;
  if (
    body &&
    typeof body === "object" &&
    !(body instanceof FormData) &&
    !(body instanceof Blob) &&
    !(body instanceof File)
  ) {
    return { ...params, ...query, ...body };
  }
  if (body instanceof FormData) {
    const file = body.get("file");
    return {
      ...params,
      ...query,
      ...(file instanceof File ? { file } : {}),
    };
  }
  return { ...params, ...query, ...(body !== undefined ? { body } : {}) };
}

function isOrpcError(
  error: unknown
): error is { status: number; message: string; data?: { reason?: string } } {
  return (
    !!error &&
    typeof error === "object" &&
    "status" in error &&
    typeof (error as { status: unknown }).status === "number"
  );
}

function toResultHeaders(
  headers: Headers | Record<string, unknown> | undefined
): Headers {
  if (headers instanceof Headers) return headers;
  const result = new Headers();
  if (!headers) return result;
  for (const [key, value] of Object.entries(headers)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      for (const item of value) result.append(key, String(item));
    } else {
      result.set(key, String(value));
    }
  }
  return result;
}

/**
 * Normalize oRPC procedure output to `{ status, body, headers }`.
 *
 * Compact procedures return the body directly (or `undefined` for 204).
 * Detailed procedures (`outputStructure: "detailed"`, e.g. file downloads)
 * already return `{ status, headers, body }` — unwrap so callers get the
 * File/Blob as `body`, not a nested object.
 */
function toApiResult(output: unknown): ApiResult {
  if (output === undefined) {
    return { status: 204, body: undefined, headers: new Headers() };
  }
  if (
    output !== null &&
    typeof output === "object" &&
    "body" in output &&
    ("status" in output || "headers" in output)
  ) {
    const detailed = output as {
      status?: number;
      headers?: Headers | Record<string, unknown>;
      body: unknown;
    };
    return {
      status: typeof detailed.status === "number" ? detailed.status : 200,
      body: detailed.body,
      headers: toResultHeaders(detailed.headers),
    };
  }
  return {
    status: 200,
    body: output,
    headers: new Headers(),
  };
}

/**
 * Adapt the oRPC client so each procedure returns `ApiResult` and accepts
 * `{ params, query, body, headers }` call args.
 *
 * oRPC's client is a Proxy that synthesizes a function for *any* property
 * name. Do not re-wrap `then` — `await getFreshAuthorizedApiClient(...)`
 * would otherwise treat the client as a thenable and call procedure `then`.
 */
function wrapClient(client: OrpcClient): ApiClient {
  return new Proxy(client, {
    get(target, prop, receiver) {
      if (prop === "then") {
        return undefined;
      }
      if (typeof prop !== "string" || !(prop in apiContracts)) {
        return Reflect.get(target, prop, receiver);
      }
      const value = Reflect.get(target, prop, receiver);
      if (typeof value !== "function") {
        return value;
      }
      return async (args?: CallArgs): Promise<ApiResult> => {
        try {
          const requestHeaders = args?.headers;
          const output = await (
            value as (
              input: unknown,
              options?: { context?: ApiClientContext }
            ) => Promise<unknown>
          )(
            flattenArgs(args),
            requestHeaders
              ? { context: { headers: requestHeaders } }
              : undefined
          );
          return toApiResult(output);
        } catch (error) {
          if (isOrpcError(error)) {
            return {
              status: error.status,
              body: error.data ?? { reason: error.message },
              headers: new Headers(),
            };
          }
          throw error;
        }
      };
    },
  }) as unknown as ApiClient;
}

function createLink(
  headers?: () => Record<string, string> | Promise<Record<string, string>>
) {
  return new OpenAPILink<ApiClientContext>(apiContracts, {
    url: BADGHUB_API_V3_URL,
    headers: async (options) => {
      const base = headers ? await headers() : {};
      return {
        ...base,
        ...options.context?.headers,
      };
    },
    interceptors: [
      onError((error) => {
        if (import.meta.env?.DEV) {
          console.warn("[api]", error);
        }
      }),
    ],
  });
}

/**
 * Frontend API client over oRPC OpenAPILink.
 *
 * Auth: use `getFreshAuthorizedApiClient`, or pass `headers` on a single call.
 */
export type ApiClient = {
  [K in keyof typeof apiContracts]: (args?: CallArgs) => Promise<ApiResult>;
};

export const publicApiClient: ApiClient = wrapClient(
  createORPCClient(createLink()) as OrpcClient
);

/** Refresh access token if it expires within this many seconds. */
export const TOKEN_MIN_VALIDITY_SECONDS = 30;

/**
 * Ensures a usable access token (single refresh path for all authorized calls).
 * Call sites should not invoke `keycloak.updateToken` themselves.
 */
export async function getFreshToken(
  keycloak: Keycloak | undefined
): Promise<string | undefined> {
  if (!keycloak) {
    return undefined;
  }
  try {
    await keycloak.updateToken(TOKEN_MIN_VALIDITY_SECONDS);
  } catch (error) {
    console.error("Failed to refresh access token", error);
    throw new Error("Failed to update token. Please try logging in again.");
  }
  return keycloak.token;
}

export async function getAuthorizationHeader(keycloak: Keycloak | undefined) {
  const token = await getFreshToken(keycloak);
  if (!token) {
    throw new Error("Authentication required");
  }
  return { authorization: `Bearer ${token}` };
}

/**
 * Authorized API client. Token refresh runs per request via the link headers
 * callback — do not call `updateToken` again around these calls.
 */
export const getFreshAuthorizedApiClient = async (
  keycloak: Keycloak
): Promise<ApiClient> => {
  return wrapClient(
    createORPCClient(
      createLink(async () => getAuthorizationHeader(keycloak))
    ) as OrpcClient
  );
};

/** Test helper: builds a client against a custom base URL (and optional fetch). */
export function createApiClientForTests(options: {
  url: string;
  fetch?: typeof globalThis.fetch;
}): ApiClient {
  const link = new OpenAPILink<ApiClientContext>(apiContracts, {
    url: options.url,
    fetch: options.fetch ?? globalThis.fetch,
    headers: async (callOptions) => ({
      ...callOptions.context?.headers,
    }),
  });
  return wrapClient(createORPCClient(link) as OrpcClient);
}
