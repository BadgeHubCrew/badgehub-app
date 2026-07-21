import {
  apiClientWithApps,
  dummyApps,
  render,
  screen,
  waitFor,
} from "@__test__";
import { APP_GRID_PAGE_SIZE } from "@config.ts";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import HomePage from "./HomePage.tsx";

describe("HomePage filtering", () => {
  it("shows all apps by default", async () => {
    render(<HomePage apiClient={apiClientWithApps(dummyApps)} />);
    await waitFor(() => {
      dummyApps.slice(0, APP_GRID_PAGE_SIZE - 1).forEach(({ summary: app }) => {
        if (app.name) {
          expect(screen.getByText(app.name)).toBeInTheDocument();
        }
      });
    });
  });

  it("filters by Badge/device", async () => {
    render(<HomePage apiClient={apiClientWithApps(dummyApps)} />);
    // Wait for spinner to disappear
    await waitFor(() =>
      expect(screen.queryByTestId("loading-spinner")).not.toBeInTheDocument()
    );
    const mcuDropdown = screen.getByTestId("badge-dropdown");
    // Use a badge value that exists in dummyApps, e.g., "why2025"
    await userEvent.selectOptions(mcuDropdown, "why2025");
    // Wait for spinner to disappear
    await waitFor(() =>
      expect(screen.queryByTestId("loading-spinner")).not.toBeInTheDocument()
    );
    dummyApps.forEach(({ summary: app }) => {
      if (app.badges?.includes("why2025") && app.name) {
        expect(screen.getByText(app.name)).toBeInTheDocument();
      } else if (app.name) {
        expect(screen.queryByText(app.name)).not.toBeInTheDocument();
      }
    });
  });

  it("filters by category", async () => {
    render(<HomePage apiClient={apiClientWithApps(dummyApps)} />);
    const categoryDropdown = screen.getByTestId("category-dropdown");
    // Use a category value that exists in dummyApps, e.g., CATEGORIES.silly
    await userEvent.selectOptions(categoryDropdown, "Silly");
    await waitFor(() =>
      expect(screen.queryByTestId("loading-spinner")).not.toBeInTheDocument()
    );
    await waitFor(() =>
      dummyApps.forEach(({ summary: app }) => {
        if (app.categories?.includes("Silly") && app.name) {
          // Use a function matcher to be more flexible with text rendering
          const name = app.name;
          expect(
            screen.getByText((content) => content.includes(name))
          ).toBeInTheDocument();
        } else if (app.name) {
          const name = app.name;
          expect(
            screen.queryByText((content) => content.includes(name))
          ).not.toBeInTheDocument();
        }
      })
    );
  });

  it("filters by both device and category", async () => {
    render(<HomePage apiClient={apiClientWithApps(dummyApps)} />);
    const mcuDropdown = screen.getByTestId("badge-dropdown");
    const categoryDropdown = screen.getByTestId("category-dropdown");
    // Use values that exist together in an app, e.g., "why2025" and CATEGORIES.silly
    await userEvent.selectOptions(mcuDropdown, "why2025");
    await userEvent.selectOptions(categoryDropdown, "Silly");
    await waitFor(() =>
      expect(screen.queryByTestId("loading-spinner")).not.toBeInTheDocument()
    );
    dummyApps.forEach(({ summary: app }) => {
      const match =
        app.badges?.includes("why2025") && app.categories?.includes("Silly");
      if (match && app.name) {
        expect(screen.getByText(app.name)).toBeInTheDocument();
      } else if (app.name) {
        expect(screen.queryByText(app.name)).not.toBeInTheDocument();
      }
    });
  });

  it("filters by development status", async () => {
    const firstApp = dummyApps[0];
    const secondApp = dummyApps[1];
    expect(firstApp).toBeDefined();
    expect(secondApp).toBeDefined();
    if (!firstApp || !secondApp) {
      throw new Error("Expected dummy apps");
    }
    const apps = [
      {
        ...firstApp,
        summary: {
          ...firstApp.summary,
          development_status: "work_in_progress" as const,
        },
        details: {
          ...firstApp.details,
          version: {
            ...firstApp.details.version,
            app_metadata: {
              ...firstApp.details.version.app_metadata,
              development_status: "work_in_progress" as const,
            },
          },
        },
      },
      secondApp,
    ];

    render(<HomePage apiClient={apiClientWithApps(apps)} />);
    const statusDropdown = screen.getByTestId("status-dropdown");

    await userEvent.selectOptions(statusDropdown, "work_in_progress");

    await waitFor(() => {
      expect(screen.getByText(firstApp.summary.name)).toBeInTheDocument();
      expect(
        screen.queryByText(secondApp.summary.name)
      ).not.toBeInTheDocument();
    });
  });

  it("filters apps by search query", async () => {
    render(<HomePage apiClient={apiClientWithApps(dummyApps)} />);
    // Wait for apps to load
    const firstAppName = dummyApps[0]?.summary.name;
    expect(firstAppName).toBeDefined();
    await screen.findByText(firstAppName as string);
    const searchBar = await screen.findByTestId("search-bar");
    // Type a partial name of the first app
    const searchTerm = "game";
    await userEvent.clear(searchBar);
    await userEvent.type(searchBar, searchTerm);

    // Only apps whose name includes the search term should be visible
    await waitFor(() => {
      dummyApps.forEach(({ summary: app }) => {
        if (app.name?.toLowerCase().includes(searchTerm)) {
          expect(screen.getByText(app.name)).toBeInTheDocument();
        } else if (app.name) {
          expect(screen.queryByText(app.name)).not.toBeInTheDocument();
        }
      });
    });
  });
});
