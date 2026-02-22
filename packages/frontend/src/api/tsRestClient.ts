import { BADGHUB_API_V3_URL } from "@config.ts";
import Keycloak from "keycloak-js";

type RequestArgs = {
  params?: Record<string, string | number>;
  query?: Record<string, unknown>;
  body?: unknown;
  headers?: Record<string, string | undefined>;
};

type TsRestLikeResponse<T = unknown> = {
  status: number;
  body?: T;
  headers: Headers;
};

type Endpoint = {
  method: "GET" | "POST" | "PATCH" | "DELETE";
  path: string;
};

const endpoints = {
  // public
  getProject: { method: "GET", path: "/projects/:slug" },
  getProjectSummaries: { method: "GET", path: "/project-summaries" },
  getProjectLatestRevisions: { method: "GET", path: "/project-latest-revisions" },
  getProjectLatestRevision: {
    method: "GET",
    path: "/project-latest-revisions/:slug",
  },
  getProjectForRevision: { method: "GET", path: "/projects/:slug/rev:revision" },
  getLatestPublishedFile: {
    method: "GET",
    path: "/projects/:slug/latest/files/:filePath",
  },
  getFileForRevision: {
    method: "GET",
    path: "/projects/:slug/rev:revision/files/:filePath",
  },
  getCategories: { method: "GET", path: "/categories" },
  getBadges: { method: "GET", path: "/badges" },
  ping: { method: "GET", path: "/ping" },
  getStats: { method: "GET", path: "/stats" },
  reportInstall: {
    method: "POST",
    path: "/projects/:slug/rev:revision/report/install",
  },
  reportLaunch: {
    method: "POST",
    path: "/projects/:slug/rev:revision/report/launch",
  },
  reportCrash: { method: "POST", path: "/projects/:slug/rev:revision/report/crash" },

  // private
  createProject: { method: "POST", path: "/projects/:slug" },
  updateProject: { method: "PATCH", path: "/projects/:slug" },
  deleteProject: { method: "DELETE", path: "/projects/:slug" },
  writeDraftFile: {
    method: "POST",
    path: "/projects/:slug/draft/files/:filePath",
  },
  setDraftIconFromFile: { method: "POST", path: "/projects/:slug/draft/icon" },
  deleteDraftFile: {
    method: "DELETE",
    path: "/projects/:slug/draft/files/:filePath",
  },
  changeDraftAppMetadata: {
    method: "PATCH",
    path: "/projects/:slug/draft/metadata",
  },
  getDraftFile: { method: "GET", path: "/projects/:slug/draft/files/:filePath" },
  getDraftProject: { method: "GET", path: "/projects/:slug/draft" },
  publishVersion: { method: "PATCH", path: "/projects/:slug/publish" },
  createProjectAPIToken: { method: "POST", path: "/projects/:slug/token" },
  getProjectApiTokenMetadata: { method: "GET", path: "/projects/:slug/token" },
  revokeProjectAPIToken: { method: "DELETE", path: "/projects/:slug/token" },
  getUserDraftProjects: { method: "GET", path: "/users/:userId/drafts" },
} satisfies Record<string, Endpoint>;

type ClientMethod = (args?: RequestArgs) => Promise<TsRestLikeResponse>;

type ApiClient = {
  [K in keyof typeof endpoints]: ClientMethod;
};

function toPath(pathTemplate: string, params?: Record<string, string | number>) {
  let path = pathTemplate;
  for (const [k, v] of Object.entries(params ?? {})) {
    path = path.replace(`:${k}`, encodeURIComponent(String(v)));
  }
  return path;
}

function toQueryString(query?: Record<string, unknown>) {
  if (!query) return "";
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v === undefined || v === null) continue;
    params.set(k, String(v));
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

async function parseResponseBody(response: Response) {
  if (response.status === 204) return undefined;

  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) return response.json();
  if (contentType.startsWith("text/")) return response.text();
  return response.blob();
}

function createApiClient(config?: {
  baseUrl?: string;
  baseHeaders?: Record<string, string | undefined>;
}): ApiClient {
  const baseUrl = config?.baseUrl ?? BADGHUB_API_V3_URL;
  const baseHeaders = config?.baseHeaders ?? {};

  const client = {} as ApiClient;

  for (const [name, endpoint] of Object.entries(endpoints) as [
    keyof typeof endpoints,
    Endpoint,
  ][]) {
    client[name] = async (args?: RequestArgs) => {
      const url = `${baseUrl}${toPath(endpoint.path, args?.params)}${toQueryString(
        args?.query,
      )}`;

      const headers: Record<string, string> = {
        ...Object.fromEntries(
          Object.entries(baseHeaders).filter(([, v]) => !!v),
        ) as Record<string, string>,
        ...(args?.headers ?? {}),
      };

      let body: BodyInit | undefined;
      if (args?.body instanceof FormData) {
        body = args.body;
      } else if (args?.body !== undefined) {
        headers["content-type"] = "application/json";
        body = JSON.stringify(args.body);
      }

      const response = await fetch(url, {
        method: endpoint.method,
        headers,
        body,
      });

      return {
        status: response.status,
        body: await parseResponseBody(response),
        headers: response.headers,
      };
    };
  }

  return client;
}

export const publicTsRestClient = createApiClient();
export type TsRestClient = typeof publicTsRestClient;

async function getFreshToken(keycloak: Keycloak | undefined) {
  await keycloak?.updateToken(30);
  return keycloak?.token;
}

export async function getAuthorizationHeader(keycloak: Keycloak | undefined) {
  return { authorization: `Bearer ${await getFreshToken(keycloak)}` };
}

export const getFreshAuthorizedTsRestClient = async (keycloak: Keycloak) => {
  const headers = await getAuthorizationHeader(keycloak);
  return createApiClient({
    baseUrl: BADGHUB_API_V3_URL,
    baseHeaders: headers,
  });
};
