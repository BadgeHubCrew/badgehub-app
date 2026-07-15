import { describe, expect, it, vi } from "vitest";
import { createApiClientForTests } from "./tsRestClient.ts";

function requestFromFetchCall(call: unknown[]): Request {
  const [input, init] = call;
  if (input instanceof Request) {
    return input;
  }
  return new Request(String(input), init as RequestInit | undefined);
}

function jsonFetchMock(body: unknown = {}, status = 200) {
  return vi.fn(async () => {
    return new Response(status === 204 ? null : JSON.stringify(body), {
      status,
      headers:
        status === 204 ? undefined : { "content-type": "application/json" },
    });
  });
}

describe("API client auth headers", () => {
  it("forwards extraHeaders onto the HTTP request", async () => {
    const fetchMock = jsonFetchMock([]);

    const client = createApiClientForTests({
      url: "http://api.test/api/v3",
      fetch: fetchMock as unknown as typeof fetch,
    });

    const result = await client.getUserDraftProjects({
      params: { userId: "user-1" },
      extraHeaders: {
        authorization: "Bearer test-token",
      },
    });

    expect(result.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const request = requestFromFetchCall(fetchMock.mock.calls[0] ?? []);
    expect(request.headers.get("authorization")).toBe("Bearer test-token");
  });

  it("forwards headers onto the HTTP request", async () => {
    const fetchMock = jsonFetchMock({ slug: "x" });

    const client = createApiClientForTests({
      url: "http://api.test/api/v3",
      fetch: fetchMock as unknown as typeof fetch,
    });

    await client.getProject({
      params: { slug: "codecraft" },
      headers: {
        authorization: "Bearer other-token",
      },
    });

    const request = requestFromFetchCall(fetchMock.mock.calls[0] ?? []);
    expect(request.headers.get("authorization")).toBe("Bearer other-token");
  });
});

describe("API client thenable / createProject", () => {
  it("is not a thenable after await (does not call procedure 'then')", async () => {
    const fetchMock = jsonFetchMock(undefined, 204);

    const client = createApiClientForTests({
      url: "http://api.test/api/v3",
      fetch: fetchMock as unknown as typeof fetch,
    });

    // Mirrors: const client = await getFreshAuthorizedTsRestClient(keycloak)
    const resolved = await Promise.resolve(client);
    expect(resolved).toBe(client);
    expect(fetchMock).not.toHaveBeenCalled();

    const response = await resolved.createProject({
      params: { slug: "my-new-app" },
    });
    expect(response.status).toBe(204);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const request = requestFromFetchCall(fetchMock.mock.calls[0] ?? []);
    expect(request.method).toBe("POST");
    expect(request.url).toContain("/projects/my-new-app");
  });

  it("supports app-edit style draft calls after await", async () => {
    const fetchMock = jsonFetchMock(
      {
        slug: "my-app",
        version: { files: [], app_metadata: { name: "My App" } },
      },
      200
    );

    const client = await Promise.resolve(
      createApiClientForTests({
        url: "http://api.test/api/v3",
        fetch: fetchMock as unknown as typeof fetch,
      })
    );

    const draft = await client.getDraftProject({
      params: { slug: "my-app" },
    });
    expect(draft.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const request = requestFromFetchCall(fetchMock.mock.calls[0] ?? []);
    expect(request.url).toContain("/projects/my-app/draft");
  });

  it("unwraps detailed file responses so body is a Blob with .text()", async () => {
    const fileText = "print('hello from draft')\n";
    const fetchMock = vi.fn(async () => {
      return new Response(fileText, {
        status: 200,
        headers: {
          "content-type": "text/x-python",
          "content-disposition": 'attachment; filename="__init__.py"',
        },
      });
    });

    const client = createApiClientForTests({
      url: "http://api.test/api/v3",
      fetch: fetchMock as unknown as typeof fetch,
    });

    const result = await client.getDraftFile({
      params: { slug: "my-app", filePath: "__init__.py" },
      headers: { authorization: "Bearer t" },
    });

    expect(result.status).toBe(200);
    expect(result.body).toBeInstanceOf(Blob);
    expect(typeof (result.body as Blob).text).toBe("function");
    expect(await (result.body as Blob).text()).toBe(fileText);
  });
});
