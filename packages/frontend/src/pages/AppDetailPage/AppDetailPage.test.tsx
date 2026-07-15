import {
  apiClientWithApps,
  dummyApps,
  render,
  screen,
  waitFor,
} from "@__test__";
import type { publicApiClient as defaultApiClient } from "@api/apiClient.ts";
import { act } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import AppDetailPage from "./AppDetailPage.tsx";

describe("AppDetailPage", { timeout: 1000_000 }, () => {
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
