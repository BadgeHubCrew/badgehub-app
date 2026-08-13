import {
  apiClientWithApps,
  dummyApps,
  render,
  screen,
  waitFor,
} from "@__test__";
import type { publicApiClient as defaultApiClient } from "@api/apiClient.ts";
import { SessionContext } from "@sharedComponents/keycloakSession/SessionContext.tsx";
import { act, render as renderWithoutProviders } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AppDetailPage from "./AppDetailPage.tsx";

const { installMpkWebSerial } = vi.hoisted(() => ({
  installMpkWebSerial: vi.fn(),
}));

vi.mock("mpk-installer?module", () => ({ installMpkWebSerial }));

describe("AppDetailPage", { timeout: 1000_000 }, () => {
  beforeEach(() => {
    installMpkWebSerial.mockReset();
    installMpkWebSerial.mockResolvedValue(undefined);
  });

  it("renders app details when found", async () => {
    const app = dummyApps[0]?.summary;
    expect(app).toBeDefined();
    if (!app) {
      throw new Error("Expected dummy app summary");
    }
    render(
      <AppDetailPage
        apiClient={apiClientWithApps(dummyApps)}
        slug={"dummy-app-1"}
      />
    );
    // Wait until the detail page renders
    await screen.findByTestId("app-detail-page");

    expect(screen.getByTestId("app-detail-name")).toHaveTextContent(
      app.name ?? ""
    );
    expect(
      await screen.findByText("This is a longer test app description.")
    ).toBeInTheDocument();
    if (app.description) {
      expect(screen.queryByText(app.description)).not.toBeInTheDocument();
    }
    const firstCategory = app.categories?.[0];
    if (firstCategory) {
      expect(screen.getAllByText(firstCategory).length).toBeGreaterThan(0);
    }
    const firstBadge = app.badges?.[0];
    if (firstBadge) {
      expect(screen.queryAllByText(firstBadge).length).toBeGreaterThan(0);
    }
  });

  it("only shows the install button for apps with an MPK file", async () => {
    const firstApp = dummyApps[0];
    expect(firstApp).toBeDefined();
    if (!firstApp) {
      throw new Error("Expected a dummy app");
    }
    const mpkUrl =
      "https://example.com/api/v3/projects/dummy-app-1/rev1/files/app.mpk";
    const appsWithMpk = [
      {
        ...firstApp,
        details: {
          ...firstApp.details,
          version: {
            ...firstApp.details.version,
            files: [
              {
                dir: "",
                name: "app",
                ext: "mpk",
                mimetype: "application/octet-stream",
                size_of_content: 1024,
                sha256: "a".repeat(64),
                size_formatted: "1 KB",
                full_path: "app.MPK",
                url: mpkUrl,
                created_at: firstApp.details.created_at,
                updated_at: firstApp.details.updated_at,
              },
            ],
          },
        },
      },
      ...dummyApps.slice(1),
    ];

    installMpkWebSerial.mockImplementation(
      async (
        _url: string,
        options?: { onProgress?: (value: unknown) => void }
      ) => {
        options?.onProgress?.({
          phase: "uploading",
          progress: 0.42,
          totalBytes: 100,
        });
        return {
          installed: true,
          overwritten: false,
          appId: "be.example.app",
          location: "/apps/be.example.app",
        };
      }
    );

    const baseClient = apiClientWithApps(appsWithMpk);
    const reportInstall = vi.fn().mockResolvedValue({
      status: 204,
      body: undefined,
      headers: new Headers(),
    });
    const client = {
      ...baseClient,
      reportInstall,
    } as unknown as typeof defaultApiClient;

    const { user } = render(
      <AppDetailPage apiClient={client} slug="dummy-app-1" />
    );

    const installButton = await screen.findByRole("button", {
      name: "Install on badge",
    });
    await user.click(installButton);

    expect(installMpkWebSerial).toHaveBeenCalledOnce();
    expect(installMpkWebSerial).toHaveBeenCalledWith(
      mpkUrl,
      expect.objectContaining({
        overwrite: true,
        onProgress: expect.any(Function),
      })
    );
    expect(screen.getByText("42%")).toBeInTheDocument();
    expect(
      await screen.findByText("Installed be.example.app.")
    ).toBeInTheDocument();
    expect(reportInstall).toHaveBeenCalledOnce();
    expect(reportInstall).toHaveBeenCalledWith({
      params: { slug: "dummy-app-1", revision: 1 },
      query: { id: expect.stringMatching(/^web-installer-/) },
    });
  });

  it("does not show the install button when the app has no MPK file", async () => {
    render(
      <AppDetailPage
        apiClient={apiClientWithApps(dummyApps)}
        slug="dummy-app-1"
      />
    );

    await screen.findByTestId("app-detail-page");

    expect(
      screen.queryByRole("button", { name: "Install on badge" })
    ).not.toBeInTheDocument();
  });

  it("shows the project rating aggregate", async () => {
    const firstApp = dummyApps[0];
    expect(firstApp).toBeDefined();
    if (!firstApp) {
      throw new Error("Expected dummy app");
    }
    const apps = [
      {
        ...firstApp,
        details: {
          ...firstApp.details,
          ratings: { average: 4.5, count: 12 },
        },
      },
      ...dummyApps.slice(1),
    ];

    render(
      <AppDetailPage apiClient={apiClientWithApps(apps)} slug="dummy-app-1" />
    );

    expect(await screen.findByText("4.5/5 (12 ratings)")).toBeInTheDocument();
  });

  it("allows a logged in user to rate the app", async () => {
    const base = apiClientWithApps(dummyApps);
    const getRatingFromUser = vi.fn().mockResolvedValue({
      status: 200,
      body: null,
      headers: new Headers(),
    });
    const reportRatingFromUser = vi.fn().mockResolvedValue({
      status: 204,
      body: undefined,
      headers: new Headers(),
    });
    const client = {
      ...base,
      getRatingFromUser,
      reportRatingFromUser,
    } as unknown as typeof defaultApiClient;

    const { user } = render(
      <AppDetailPage apiClient={client} slug="dummy-app-1" />
    );

    await user.click(
      await screen.findByRole("button", { name: "Rate 4 out of 5" })
    );

    expect(reportRatingFromUser).toHaveBeenCalledWith(
      expect.objectContaining({
        params: { userId: "test-user-id", projectSlug: "dummy-app-1" },
        body: { rating: 4 },
      })
    );
    expect(await screen.findByText("Rating saved.")).toBeInTheDocument();
  });

  it("shows the logged in user's existing rating", async () => {
    const base = apiClientWithApps(dummyApps);
    const getRatingFromUser = vi.fn().mockResolvedValue({
      status: 200,
      body: { rating: 3 },
      headers: new Headers(),
    });
    const client = {
      ...base,
      getRatingFromUser,
    } as unknown as typeof defaultApiClient;

    render(<AppDetailPage apiClient={client} slug="dummy-app-1" />);

    await waitFor(() => {
      expect(getRatingFromUser).toHaveBeenCalledWith(
        expect.objectContaining({
          params: { userId: "test-user-id", projectSlug: "dummy-app-1" },
        })
      );
    });
    expect(
      await screen.findByRole("button", { name: "Rate 3 out of 5" })
    ).toHaveClass("text-warning");
    expect(
      await screen.findByRole("button", { name: "Rate 4 out of 5" })
    ).toHaveClass("text-base-content/30");
  });

  it("does not show the rating control when logged out", async () => {
    renderWithoutProviders(
      <MemoryRouter>
        <SessionContext value={{ status: "anonymous" }}>
          <AppDetailPage
            apiClient={apiClientWithApps(dummyApps)}
            slug="dummy-app-1"
          />
        </SessionContext>
      </MemoryRouter>
    );

    await screen.findByTestId("app-detail-page");

    expect(
      screen.queryByRole("button", { name: "Rate 4 out of 5" })
    ).not.toBeInTheDocument();
  });

  it("does not re-fetch the project in a render loop", async () => {
    const base = apiClientWithApps(dummyApps);
    const getProject = vi.fn(base.getProject);
    const getProjectSummaries = vi.fn(base.getProjectSummaries);
    const client = {
      ...base,
      getProject,
      getProjectSummaries,
    } as unknown as typeof defaultApiClient;

    render(<AppDetailPage apiClient={client} slug="dummy-app-1" />);
    await screen.findByTestId("app-detail-page");

    // Project load + similar projects (same author) should settle quickly.
    await waitFor(() => {
      expect(getProject).toHaveBeenCalled();
    });

    const projectCallsAfterLoad = getProject.mock.calls.length;
    const summaryCallsAfterLoad = getProjectSummaries.mock.calls.length;

    // Allow extra ticks/re-renders; counts must stay stable (no infinite refresh).
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    expect(getProject).toHaveBeenCalledTimes(projectCallsAfterLoad);
    expect(getProjectSummaries).toHaveBeenCalledTimes(summaryCallsAfterLoad);
    expect(projectCallsAfterLoad).toBe(1);
    expect(summaryCallsAfterLoad).toBeLessThanOrEqual(1);
  });

  it("falls back to the short description when long description is empty", async () => {
    const app = dummyApps[1]?.summary;
    expect(app?.description).toBeDefined();
    if (!app?.description) {
      throw new Error("Expected dummy app description");
    }
    render(
      <AppDetailPage
        apiClient={apiClientWithApps(dummyApps)}
        slug={"dummy-app-2"}
      />
    );

    await screen.findByTestId("app-detail-page");

    expect(await screen.findByText(app.description)).toBeInTheDocument();
  });

  it("renders the long description as Markdown", async () => {
    const firstApp = dummyApps[0];
    expect(firstApp).toBeDefined();
    if (!firstApp) {
      throw new Error("Expected a dummy app");
    }
    const appsWithMarkdown = [
      {
        ...firstApp,
        details: {
          ...firstApp.details,
          version: {
            ...firstApp.details.version,
            app_metadata: {
              ...firstApp.details.version.app_metadata,
              long_description: "## Features\n\n- Offline support",
            },
          },
        },
      },
      ...dummyApps.slice(1),
    ];

    render(
      <AppDetailPage
        apiClient={apiClientWithApps(appsWithMarkdown)}
        slug="dummy-app-1"
      />
    );

    expect(
      await screen.findByRole("heading", { level: 2, name: "Features" })
    ).toBeInTheDocument();
    expect(screen.getByText("Offline support").tagName).toBe("LI");
  });

  it("renders the app revision", async () => {
    const app = dummyApps[0]?.summary;
    expect(app).toBeDefined();
    if (!app) {
      throw new Error("Expected dummy app summary");
    }
    render(
      <AppDetailPage
        apiClient={apiClientWithApps(dummyApps)}
        slug={"dummy-app-1"}
      />
    );
    // Revision text is rendered as "Revision: {revision}", so use a flexible matcher
    expect(
      (
        await screen.findAllByText((content) =>
          content.includes(String(app.revision ?? ""))
        )
      ).length
    ).toBeGreaterThan(0);
  });

  it("shows a version picker and loads a previous revision", async () => {
    const firstApp = dummyApps[0];
    expect(firstApp).toBeDefined();
    if (!firstApp) {
      throw new Error("Expected dummy app");
    }

    const historicalDetails = {
      ...firstApp.details,
      latest_revision: 3,
      version: {
        ...firstApp.details.version,
        revision: 1,
        app_metadata: {
          ...firstApp.details.version.app_metadata,
          version: "1.0.0",
          name: "Dummy App 1 v1",
          long_description: "Historical description for v1.",
        },
      },
    };
    const latestDetails = {
      ...firstApp.details,
      latest_revision: 3,
      version: {
        ...firstApp.details.version,
        revision: 3,
        app_metadata: {
          ...firstApp.details.version.app_metadata,
          version: "2.0.0",
          name: "Dummy App 1 v2",
          long_description: "Latest description for v2.",
        },
      },
    };

    const apps = [
      {
        ...firstApp,
        summary: {
          ...firstApp.summary,
          revision: 3,
        },
        details: latestDetails,
        versions: [
          {
            version: "2.0.0",
            latestRevision: 3,
            latestPublishDate: "2024-06-02T12:00:00.000Z",
          },
          {
            version: "1.0.0",
            latestRevision: 1,
            latestPublishDate: "2024-06-01T12:00:00.000Z",
          },
        ],
        historicalByRevision: {
          1: historicalDetails,
          3: latestDetails,
        },
      },
      ...dummyApps.slice(1),
    ];

    const base = apiClientWithApps(apps);
    const getProjectForRevision = vi.fn(base.getProjectForRevision);
    const client = {
      ...base,
      getProjectForRevision,
    } as unknown as typeof defaultApiClient;

    const { user } = render(
      <AppDetailPage apiClient={client} slug="dummy-app-1" />
    );

    await screen.findByTestId("app-detail-page");
    expect(screen.getByTestId("app-detail-name")).toHaveTextContent(
      "Dummy App 1 v2"
    );

    const select = await screen.findByTestId("app-version-select");
    expect(select).toHaveValue("3");

    await user.selectOptions(select, "1");

    await waitFor(() => {
      expect(getProjectForRevision).toHaveBeenCalledWith(
        expect.objectContaining({
          params: { slug: "dummy-app-1", revision: 1 },
        })
      );
    });

    expect(await screen.findByTestId("app-detail-name")).toHaveTextContent(
      "Dummy App 1 v1"
    );
    expect(screen.getByTestId("historical-version-banner")).toBeInTheDocument();
    expect(
      screen.getByText("Historical description for v1.")
    ).toBeInTheDocument();
  });

  it.skip("shows error if app not found", async () => {
    //TODO
    render(
      <AppDetailPage
        apiClient={apiClientWithApps(dummyApps)}
        slug={"dummy-app-1"}
      />
    );
    await waitFor(() =>
      expect(screen.getByTestId("app-detail-error")).toBeInTheDocument()
    );
  });
});
