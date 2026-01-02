import { describe, expect, it } from "vitest";
import {
  dummyApps,
  render,
  screen,
  tsRestClientWithApps,
  waitFor,
} from "@__test__";
import AppDetailPage from "./AppDetailPage.tsx";

describe("AppDetailPage", { timeout: 1000_000 }, () => {
  it("renders app details when found", async () => {
    const app = dummyApps[0]!.summary;
    render(
      <AppDetailPage
        tsRestClient={tsRestClientWithApps(dummyApps)}
        slug={"dummy-app-1"}
      />
    );
    // Wait until the detail page renders
    await screen.findByTestId("app-detail-page");

    expect(screen.getByTestId("app-detail-name")).toHaveTextContent(app.name!);
    expect(await screen.findByText(app.description!)).toBeInTheDocument();
    expect(screen.getAllByText(app.categories![0]!).length).toBeGreaterThan(0);
    if (app.badges && app.badges.length > 0) {
      expect(screen.queryAllByText(app.badges[0]!).length).toBeGreaterThan(0);
    }
  });

  it("renders the app revision", async () => {
    const app = dummyApps[0]!.summary;
    render(
      <AppDetailPage
        tsRestClient={tsRestClientWithApps(dummyApps)}
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
        tsRestClient={tsRestClientWithApps(dummyApps)}
        slug={"dummy-app-1"}
      />
    );
    await waitFor(() =>
      expect(screen.getByTestId("app-detail-error")).toBeInTheDocument()
    );
  });
});
