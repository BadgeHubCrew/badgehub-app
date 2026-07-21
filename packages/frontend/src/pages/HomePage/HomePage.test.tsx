import {
  apiClientWithApps,
  apiClientWithError,
  dummyApps,
  render,
  screen,
  waitFor,
} from "@__test__";
import { describe, expect, it, vi } from "vitest";
import HomePage from "./HomePage.tsx";

describe("HomePage", () => {
  it("renders the homepage with dummy apps", async () => {
    const apps = dummyApps.map((app, index) =>
      index === 0
        ? {
            ...app,
            summary: {
              ...app.summary,
              ratings: { average: 4.5, count: 12 },
            },
          }
        : app
    );

    render(<HomePage apiClient={apiClientWithApps(apps)} />);
    expect(screen.getByTestId("main-page")).toBeInTheDocument();
    expect(screen.getByText(/Share\. Build\. Innovate\./i)).toBeInTheDocument();
    await waitFor(() => {
      const appCardElements = screen.getAllByTestId("AppCard");
      expect(appCardElements.length).toBeGreaterThan(0);
    });
    expect(
      screen.getByTestId("Header/Link/BrowseProjects")
    ).toBeInTheDocument();
    expect(
      screen.getByText(/BadgeHub. All rights reserved./i)
    ).toBeInTheDocument();
    expect(screen.getByTestId("badge-dropdown")).toBeInTheDocument();
    expect(screen.getByTestId("category-dropdown")).toBeInTheDocument();
    expect(screen.getByTestId("sort by-dropdown")).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: "Highest Rated" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: "Most Ratings" })
    ).toBeInTheDocument();
    expect(screen.getByTestId("app-cards-container")).toBeInTheDocument();
  });

  it("shows the filter bar", async () => {
    render(<HomePage apiClient={apiClientWithApps(dummyApps)} />);
    expect(await screen.findByTestId("filter-bar")).toBeInTheDocument();
  });

  it("shows an error message when the API call fails", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    render(<HomePage apiClient={apiClientWithError()} />);
    expect(
      await screen.findByText(/Failed to fetch projects.*/i)
    ).toBeInTheDocument();
    consoleErrorSpy.mockRestore();
  });

  it("shows a message or empty state when there are no apps", async () => {
    render(<HomePage apiClient={apiClientWithApps([])} />);
    expect(screen.queryByTestId("app-cards-container")).not.toBeInTheDocument();
    expect(await screen.findByText(/No apps found\./i)).toBeInTheDocument();
  });
});
