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

/** Result shape kept for existing call sites that switch on `status` / read `body`. */
// biome-ignore lint/suspicious/noExplicitAny: bridge over oRPC until call sites use typed outputs
export type TsRestStyleResult<T = any> = {
  status: number;
  body: T;
  headers: Headers;
};

type CallArgs = {
  params?: Record<string, unknown>;
  query?: Record<string, unknown>;
  body?: unknown;
  headers?: Record<string, string>;
  /** @deprecated Prefer `headers`; kept for ts-rest call-site compatibility. */
  extraHeaders?: Record<string, string>;
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

function perRequestHeaders(
  args?: CallArgs
): Record<string, string> | undefined {
  if (!args?.headers && !args?.extraHeaders) return undefined;
  const merged = { ...args.headers, ...args.extraHeaders };
  return Object.keys(merged).length > 0 ? merged : undefined;
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

/**
 * Wrap oRPC client procedures with a ts-rest-like `{ status, body }` surface.
 *
 * Important: oRPC's client is a Proxy that synthesizes a function for *any*
 * property name. If we re-wrap `then`, `await client` (after
 * `getFreshAuthorizedTsRestClient`) treats the client as a thenable and calls
 * procedure path `then` → StandardOpenapiLinkCodec error.
 */
function wrapClient(client: OrpcClient): TsRestClient {
  return new Proxy(client, {
    get(target, prop, receiver) {
      // Not a Promise — never expose a thenable trap.
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
      return async (args?: CallArgs): Promise<TsRestStyleResult> => {
        try {
          const requestHeaders = perRequestHeaders(args);
          const body = await (
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
          return {
            status: body === undefined ? 204 : 200,
            body,
            headers: new Headers(),
          };
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
  }) as unknown as TsRestClient;
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
 * Frontend API client surface over oRPC OpenAPILink.
 * Keeps `{ status, body }` results and `{ params, query, body }` call args so
 * existing UI code can migrate off ts-rest without a full rewrite.
 *
 * Auth: use `getFreshAuthorizedTsRestClient`, or pass `headers` /
 * `extraHeaders` on a single call (merged into the HTTP request).
 */
export type TsRestClient = {
  [K in keyof typeof apiContracts]: (
    args?: CallArgs
  ) => Promise<TsRestStyleResult>;
};

export const publicTsRestClient: TsRestClient = wrapClient(
  createORPCClient(createLink()) as OrpcClient
);

async function getFreshToken(keycloak: Keycloak | undefined) {
  await keycloak?.updateToken(30);
  return keycloak?.token;
}

export async function getAuthorizationHeader(keycloak: Keycloak | undefined) {
  return { authorization: `Bearer ${await getFreshToken(keycloak)}` };
}

export const getFreshAuthorizedTsRestClient = async (
  keycloak: Keycloak
): Promise<TsRestClient> => {
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
}): TsRestClient {
  const link = new OpenAPILink<ApiClientContext>(apiContracts, {
    url: options.url,
    fetch: options.fetch ?? globalThis.fetch,
    headers: async (callOptions) => ({
      ...callOptions.context?.headers,
    }),
  });
  return wrapClient(createORPCClient(link) as OrpcClient);
}
