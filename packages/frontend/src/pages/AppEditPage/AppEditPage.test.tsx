import { act, render, screen, waitFor } from "@__test__";
import { dummyApps } from "@__test__/fixtures";
import { getFreshAuthorizedApiClient } from "@api/apiClient.ts";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AppEditPage from "./AppEditPage.tsx";

vi.mock("@api/apiClient.ts", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@api/apiClient.ts")>();
  return {
    ...actual,
    getFreshAuthorizedApiClient: vi.fn(),
  };
});

vi.mock("./AppEditTokenManager.tsx", () => ({
  default: ({
    onTransferOwner,
  }: {
    onTransferOwner: (newOwnerId: string) => Promise<boolean>;
  }) => (
    <button type="button" onClick={() => void onTransferOwner("new-owner-id")}>
      Trigger ownership transfer
    </button>
  ),
}));

describe("AppEditPage", () => {
  beforeEach(() => {
    vi.mocked(getFreshAuthorizedApiClient).mockReset();
  });

  it("renders the edit view when the draft loads", async () => {
    vi.mocked(getFreshAuthorizedApiClient).mockResolvedValue({
      getDraftProject: vi.fn().mockResolvedValue({
        status: 200,
        body: dummyApps[0]?.details,
      }),
    } as unknown as Awaited<ReturnType<typeof getFreshAuthorizedApiClient>>);

    render(<AppEditPage slug="dummy-app-1" />);

    expect(await screen.findByTestId("app-edit-page")).toBeInTheDocument();
    expect(
      await screen.findByText(/Editing dummy-app-1\/rev1/i)
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Trigger ownership transfer" })
    ).toBeInTheDocument();
  });

  it("shows authentication required when the draft request is unauthorized", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    vi.mocked(getFreshAuthorizedApiClient).mockResolvedValue({
      getDraftProject: vi.fn().mockResolvedValue({
        status: 401,
        body: { reason: "Unauthorized" },
      }),
    } as unknown as Awaited<ReturnType<typeof getFreshAuthorizedApiClient>>);

    render(<AppEditPage slug="dummy-app-1" />);

    expect(
      await screen.findByText(/authentication required/i)
    ).toBeInTheDocument();
    consoleErrorSpy.mockRestore();
  });

  it("shows access denied without a login button when the logged-in user is forbidden", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    vi.mocked(getFreshAuthorizedApiClient).mockResolvedValue({
      getDraftProject: vi.fn().mockResolvedValue({
        status: 403,
        body: { reason: "Forbidden" },
      }),
    } as unknown as Awaited<ReturnType<typeof getFreshAuthorizedApiClient>>);

    render(<AppEditPage slug="another-users-project" />);

    expect(await screen.findByText(/access denied/i)).toBeInTheDocument();
    expect(
      screen.getByText(/logged in, but you are not authorized/i)
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /log in/i })
    ).not.toBeInTheDocument();
    consoleErrorSpy.mockRestore();
  });

  it("shows not found when the draft project is missing", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    vi.mocked(getFreshAuthorizedApiClient).mockResolvedValue({
      getDraftProject: vi.fn().mockResolvedValue({
        status: 404,
        body: { reason: "Not found" },
      }),
    } as unknown as Awaited<ReturnType<typeof getFreshAuthorizedApiClient>>);

    render(<AppEditPage slug="missing-app" />);

    expect(await screen.findByText(/app not found/i)).toBeInTheDocument();
    consoleErrorSpy.mockRestore();
  });

  it("saves draft metadata when a field loses focus", async () => {
    const user = userEvent.setup();
    let finishSave!: () => void;
    const changeDraftAppMetadata = vi.fn().mockImplementation(
      () =>
        new Promise((resolve) => {
          finishSave = () =>
            resolve({
              status: 204,
              body: undefined,
              headers: new Headers(),
            });
        })
    );
    vi.mocked(getFreshAuthorizedApiClient).mockResolvedValue({
      getDraftProject: vi.fn().mockResolvedValue({
        status: 200,
        body: dummyApps[0]?.details,
      }),
      changeDraftAppMetadata,
    } as unknown as Awaited<ReturnType<typeof getFreshAuthorizedApiClient>>);

    render(<AppEditPage slug="dummy-app-1" />);

    const nameInput = await screen.findByLabelText(/app name/i);
    await user.clear(nameInput);
    await user.type(nameInput, "Renamed App");
    await user.tab();

    expect(await screen.findByText("Saving draft…")).toBeInTheDocument();
    await act(async () => {
      finishSave();
    });
    expect(await screen.findByText("Draft saved")).toBeInTheDocument();
    expect(changeDraftAppMetadata).toHaveBeenLastCalledWith(
      expect.objectContaining({
        params: { slug: "dummy-app-1" },
        body: expect.objectContaining({ name: "Renamed App" }),
      })
    );
  });

  it("saves first when publishing and shows version feedback", async () => {
    const user = userEvent.setup();
    const callOrder: string[] = [];
    const details = dummyApps[0]?.details;
    const projectWithVersion = {
      ...details,
      version: {
        ...details?.version,
        app_metadata: {
          ...details?.version.app_metadata,
          version: "1.2.3",
        },
      },
    };
    const changeDraftAppMetadata = vi.fn().mockImplementation(async () => {
      callOrder.push("save");
      return { status: 204, body: undefined, headers: new Headers() };
    });
    const publishVersion = vi.fn().mockImplementation(async () => {
      callOrder.push("publish");
      return { status: 204, body: undefined, headers: new Headers() };
    });
    vi.mocked(getFreshAuthorizedApiClient).mockResolvedValue({
      getDraftProject: vi.fn().mockResolvedValue({
        status: 200,
        body: projectWithVersion,
      }),
      changeDraftAppMetadata,
      publishVersion,
    } as unknown as Awaited<ReturnType<typeof getFreshAuthorizedApiClient>>);

    render(<AppEditPage slug="dummy-app-1" />);

    const nameInput = await screen.findByLabelText(/app name/i);
    await user.type(nameInput, "!");

    const publishButton = screen.getByRole("button", { name: /^publish$/i });
    await user.click(publishButton);

    expect(screen.getByTestId("publish-spinner")).toBeInTheDocument();
    expect(publishButton).toBeDisabled();

    expect(
      await screen.findByText("Published revision 1 (Version 1.2.3)")
    ).toBeInTheDocument();
    expect(callOrder).toEqual(["save", "publish"]);
    expect(screen.queryByTestId("publish-spinner")).not.toBeInTheDocument();
    expect(screen.queryByText("Draft saved")).not.toBeInTheDocument();

    await user.type(nameInput, " again");
    expect(
      screen.queryByTestId("publish-success-message")
    ).not.toBeInTheDocument();
    expect(screen.getByText("Unsaved changes")).toBeVisible();
  });

  it("forces a save before publishing when no field was manually edited", async () => {
    const user = userEvent.setup();
    const callOrder: string[] = [];
    const details = dummyApps[0]?.details;
    if (!details) {
      throw new Error("Missing dummy app fixture");
    }
    const detailsWithoutAuthor = structuredClone(details);
    delete detailsWithoutAuthor.version.app_metadata.author;
    const changeDraftAppMetadata = vi.fn().mockImplementation(async () => {
      callOrder.push("save");
      return { status: 204, body: undefined, headers: new Headers() };
    });
    const publishVersion = vi.fn().mockImplementation(async () => {
      callOrder.push("publish");
      return { status: 204, body: undefined, headers: new Headers() };
    });
    vi.mocked(getFreshAuthorizedApiClient).mockResolvedValue({
      getDraftProject: vi.fn().mockResolvedValue({
        status: 200,
        body: detailsWithoutAuthor,
      }),
      changeDraftAppMetadata,
      publishVersion,
    } as unknown as Awaited<ReturnType<typeof getFreshAuthorizedApiClient>>);

    render(<AppEditPage slug="dummy-app-1" />);

    await user.click(await screen.findByRole("button", { name: /^publish$/i }));

    await waitFor(() => expect(publishVersion).toHaveBeenCalledTimes(1));
    expect(callOrder).toEqual(["save", "publish"]);
    expect(changeDraftAppMetadata).toHaveBeenCalledWith(
      expect.objectContaining({
        params: { slug: "dummy-app-1" },
        body: expect.objectContaining({ author: "Test User" }),
      })
    );
  });

  it("transfers project ownership and updates the displayed owner", async () => {
    const user = userEvent.setup();
    const transferProjectOwner = vi.fn().mockResolvedValue({
      status: 204,
      body: undefined,
      headers: new Headers(),
    });
    vi.mocked(getFreshAuthorizedApiClient).mockResolvedValue({
      getDraftProject: vi.fn().mockResolvedValue({
        status: 200,
        body: dummyApps[0]?.details,
      }),
      transferProjectOwner,
    } as unknown as Awaited<ReturnType<typeof getFreshAuthorizedApiClient>>);

    render(<AppEditPage slug="dummy-app-1" />);

    await user.click(
      await screen.findByRole("button", { name: "Trigger ownership transfer" })
    );

    expect(transferProjectOwner).toHaveBeenCalledWith({
      params: { slug: "dummy-app-1" },
      body: { newOwnerId: "new-owner-id" },
    });
  });
});
