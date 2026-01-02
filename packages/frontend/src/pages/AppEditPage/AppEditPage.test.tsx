import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@__test__";
import AppEditPage from "./AppEditPage.tsx";
import { dummyApps } from "@__test__/fixtures";
import { getFreshAuthorizedTsRestClient } from "@api/tsRestClient.ts";

vi.mock("@api/tsRestClient.ts", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@api/tsRestClient.ts")>();
  return {
    ...actual,
    getFreshAuthorizedTsRestClient: vi.fn(),
  };
});

vi.mock("./AppEditTokenManager.tsx", () => ({
  default: () => <div data-testid="app-edit-token-manager" />,
}));

describe("AppEditPage", () => {
  beforeEach(() => {
    vi.mocked(getFreshAuthorizedTsRestClient).mockReset();
  });

  it("renders the edit view when the draft loads", async () => {
    vi.mocked(getFreshAuthorizedTsRestClient).mockResolvedValue({
      getDraftProject: vi.fn().mockResolvedValue({
        status: 200,
        body: dummyApps[0]!.details,
      }),
    } as unknown as Awaited<ReturnType<typeof getFreshAuthorizedTsRestClient>>);

    render(<AppEditPage slug="dummy-app-1" />);

    expect(await screen.findByTestId("app-edit-page")).toBeInTheDocument();
    expect(
      await screen.findByText(/Editing dummy-app-1\/rev1/i)
    ).toBeInTheDocument();
    expect(screen.getByTestId("app-edit-token-manager")).toBeInTheDocument();
  });

  it("shows authentication required when the draft request is unauthorized", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    vi.mocked(getFreshAuthorizedTsRestClient).mockResolvedValue({
      getDraftProject: vi.fn().mockResolvedValue({
        status: 401,
        body: { reason: "Unauthorized" },
      }),
    } as unknown as Awaited<ReturnType<typeof getFreshAuthorizedTsRestClient>>);

    render(<AppEditPage slug="dummy-app-1" />);

    expect(
      await screen.findByText(/authentication required/i)
    ).toBeInTheDocument();
    consoleErrorSpy.mockRestore();
  });

  it("shows not found when the draft project is missing", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    vi.mocked(getFreshAuthorizedTsRestClient).mockResolvedValue({
      getDraftProject: vi.fn().mockResolvedValue({
        status: 404,
        body: { reason: "Not found" },
      }),
    } as unknown as Awaited<ReturnType<typeof getFreshAuthorizedTsRestClient>>);

    render(<AppEditPage slug="missing-app" />);

    expect(await screen.findByText(/app not found/i)).toBeInTheDocument();
    consoleErrorSpy.mockRestore();
  });
});
