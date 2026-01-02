import { describe, expect, it, vi } from "vitest";
import {
  dummyApps,
  render,
  screen,
  tsRestClientWithApps,
  tsRestClientWithError,
  waitFor,
} from "@__test__";
import HomePage from "./HomePage.tsx";

describe("HomePage", () => {
  it("renders the homepage with dummy apps", async () => {
    render(<HomePage tsRestClient={tsRestClientWithApps(dummyApps)} />);
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
    expect(screen.getByTestId("app-cards-container")).toBeInTheDocument();
  });

  it("shows the filter bar", async () => {
    render(<HomePage tsRestClient={tsRestClientWithApps(dummyApps)} />);
    expect(await screen.findByTestId("filter-bar")).toBeInTheDocument();
  });

  it("shows an error message when the API call fails", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    render(<HomePage tsRestClient={tsRestClientWithError()} />);
    expect(
      await screen.findByText(/Failed to fetch projects.*/i)
    ).toBeInTheDocument();
    consoleErrorSpy.mockRestore();
  });

  it("shows a message or empty state when there are no apps", async () => {
    render(<HomePage tsRestClient={tsRestClientWithApps([])} />);
    expect(screen.queryByTestId("app-cards-container")).not.toBeInTheDocument();
    expect(await screen.findByText(/No apps found\./i)).toBeInTheDocument();
  });
});
