import { describe, expect, it } from "vitest";
import {
  dummyApps,
  render,
  screen,
  tsRestClientWithApps,
  waitFor,
} from "@__test__";
import HomePage from "./HomePage.tsx";
import userEvent from "@testing-library/user-event";
import { APP_GRID_PAGE_SIZE } from "@config.ts";

describe("HomePage filtering", () => {
  it("shows all apps by default", async () => {
    render(<HomePage tsRestClient={tsRestClientWithApps(dummyApps)} />);
    await waitFor(() => {
      dummyApps.slice(0, APP_GRID_PAGE_SIZE - 1).forEach(({ summary: app }) => {
        if (app.name) {
          expect(screen.getByText(app.name)).toBeInTheDocument();
        }
      });
    });
  });

  it("filters by Badge/device", async () => {
    render(<HomePage tsRestClient={tsRestClientWithApps(dummyApps)} />);
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
      if (app.badges?.includes("why2025")) {
        expect(screen.getByText(app.name!)).toBeInTheDocument();
      } else if (app.name) {
        expect(screen.queryByText(app.name)).not.toBeInTheDocument();
      }
    });
  });

  it("filters by category", async () => {
    render(<HomePage tsRestClient={tsRestClientWithApps(dummyApps)} />);
    const categoryDropdown = screen.getByTestId("category-dropdown");
    // Use a category value that exists in dummyApps, e.g., CATEGORIES.silly
    await userEvent.selectOptions(categoryDropdown, "Silly");
    await waitFor(() =>
      expect(screen.queryByTestId("loading-spinner")).not.toBeInTheDocument()
    );
    await waitFor(() =>
      dummyApps.forEach(({ summary: app }) => {
        if (app.categories?.includes("Silly")) {
          // Use a function matcher to be more flexible with text rendering
          expect(
            screen.getByText((content) => content.includes(app.name!))
          ).toBeInTheDocument();
        } else if (app.name) {
          expect(
            screen.queryByText((content) => content.includes(app.name!))
          ).not.toBeInTheDocument();
        }
      })
    );
  });

  it("filters by both device and category", async () => {
    render(<HomePage tsRestClient={tsRestClientWithApps(dummyApps)} />);
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
      if (match) {
        expect(screen.getByText(app.name!)).toBeInTheDocument();
      } else if (app.name) {
        expect(screen.queryByText(app.name)).not.toBeInTheDocument();
      }
    });
  });

  it("filters apps by search query", async () => {
    render(<HomePage tsRestClient={tsRestClientWithApps(dummyApps)} />);
    // Wait for apps to load
    await screen.findByText(dummyApps[0]!.summary.name!);
    const searchBar = await screen.findByTestId("search-bar");
    // Type a partial name of the first app
    const searchTerm = "game";
    await userEvent.clear(searchBar);
    await userEvent.type(searchBar, searchTerm);

    // Only apps whose name includes the search term should be visible
    await waitFor(() => {
      dummyApps.forEach(({ summary: app }) => {
        if (app.name?.toLowerCase().includes(searchTerm)) {
          expect(screen.getByText(app.name!)).toBeInTheDocument();
        } else if (app.name) {
          expect(screen.queryByText(app.name)).not.toBeInTheDocument();
        }
      });
    });
  });
});
