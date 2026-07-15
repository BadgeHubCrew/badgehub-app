import {
  apiClientWithApps,
  dummyApps,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@__test__";
import { describe, expect, it } from "vitest";
import HomePage from "./HomePage.tsx";

describe("HomePage Pagination", () => {
  it("shows first page of apps and paginates to next page", async () => {
    render(<HomePage apiClient={apiClientWithApps(dummyApps)} />);
    expect(
      await screen.findByTestId("app-cards-container")
    ).toBeInTheDocument();

    expect(screen.getByText("Dummy App 1")).toBeInTheDocument();
    expect(screen.getByText("Dummy App 8")).toBeInTheDocument();
    expect(screen.queryByText("Dummy App 13")).not.toBeInTheDocument();
    expect(screen.queryByText("Dummy App 14")).not.toBeInTheDocument();

    // Click next page using test id
    const nextButton = screen.getByTestId(
      "pagination-next"
    ) as HTMLButtonElement;
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText("Dummy App 13")).toBeInTheDocument();
    });
    expect(screen.getByText("Dummy App 15")).toBeInTheDocument();
    expect(screen.queryByText("Dummy App 1")).not.toBeInTheDocument();
  });

  it("disables previous button on first page", async () => {
    render(<HomePage apiClient={apiClientWithApps(dummyApps)} />);
    expect(
      await screen.findByTestId("app-cards-container")
    ).toBeInTheDocument();
    const prevButton = screen.getByTestId(
      "pagination-prev"
    ) as HTMLButtonElement;
    expect(prevButton).toBeDisabled();
  });

  it("disables next button on last page", async () => {
    render(<HomePage apiClient={apiClientWithApps(dummyApps)} />);
    let nextButton = (await screen.findByTestId(
      "pagination-next"
    )) as HTMLButtonElement;
    expect(nextButton).toBeEnabled();

    while (!nextButton.disabled) {
      fireEvent.click(nextButton);
      nextButton = screen.getByTestId("pagination-next") as HTMLButtonElement;
    }
    expect(nextButton).toBeDisabled();
    const prevButton = screen.getByTestId(
      "pagination-prev"
    ) as HTMLButtonElement;
    expect(prevButton).toBeEnabled();
  });

  it("can go back to previous page", async () => {
    render(<HomePage apiClient={apiClientWithApps(dummyApps)} />);
    const nextButton = (await screen.findByTestId(
      "pagination-next"
    )) as HTMLButtonElement;
    fireEvent.click(nextButton);
    await waitFor(() => {
      expect(screen.getByText("Dummy App 13")).toBeInTheDocument();
    });

    const prevButton = screen.getByTestId(
      "pagination-prev"
    ) as HTMLButtonElement;
    fireEvent.click(prevButton);
    await waitFor(() => {
      expect(screen.getByText("Dummy App 1")).toBeInTheDocument();
    });
  });
});
