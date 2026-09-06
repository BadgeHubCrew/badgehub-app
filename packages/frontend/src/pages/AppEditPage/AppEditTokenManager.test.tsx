import { render, screen, within } from "@__test__";
import { getFreshAuthorizedApiClient } from "@api/apiClient.ts";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import AppEditTokenManager from "./AppEditTokenManager.tsx";

vi.mock("@api/apiClient.ts", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@api/apiClient.ts")>();
  return {
    ...actual,
    getFreshAuthorizedApiClient: vi.fn(),
  };
});

const keycloak = {
  updateToken: vi.fn().mockResolvedValue(true),
} as unknown as import("keycloak-js").default;

const baseClient = {
  getProjectApiTokenMetadata: vi.fn(),
  createProjectAPIToken: vi.fn(),
  revokeProjectAPIToken: vi.fn(),
};

describe("AppEditTokenManager", () => {
  it("renders empty state when no token exists", async () => {
    vi.mocked(getFreshAuthorizedApiClient).mockResolvedValue({
      ...baseClient,
      getProjectApiTokenMetadata: vi.fn().mockResolvedValue({ status: 404 }),
    } as unknown as Awaited<ReturnType<typeof getFreshAuthorizedApiClient>>);

    render(
      <AppEditTokenManager
        slug="demo"
        keycloak={keycloak}
        onTransferOwner={vi.fn()}
        projectOwnerId="owner-id"
      />
    );

    expect(await screen.findByText(/no active api token/i)).toBeInTheDocument();
  });

  it("creates a new token and shows it", async () => {
    const user = userEvent.setup();
    vi.mocked(getFreshAuthorizedApiClient).mockResolvedValue({
      ...baseClient,
      getProjectApiTokenMetadata: vi.fn().mockResolvedValue({
        status: 404,
      }),
      createProjectAPIToken: vi.fn().mockResolvedValue({
        status: 200,
        body: { token: "new-token-value" },
      }),
    } as unknown as Awaited<ReturnType<typeof getFreshAuthorizedApiClient>>);

    render(
      <AppEditTokenManager
        slug="demo"
        keycloak={keycloak}
        onTransferOwner={vi.fn()}
        projectOwnerId="owner-id"
      />
    );

    await user.click(await screen.findByText(/generate new token/i));

    expect(
      await screen.findByDisplayValue("new-token-value")
    ).toBeInTheDocument();
  });

  it("puts ownership transfer beneath the API token controls", async () => {
    const user = userEvent.setup();
    const onTransferOwner = vi.fn().mockResolvedValue(true);
    vi.mocked(getFreshAuthorizedApiClient).mockResolvedValue({
      ...baseClient,
      getProjectApiTokenMetadata: vi.fn().mockResolvedValue({ status: 404 }),
    } as unknown as Awaited<ReturnType<typeof getFreshAuthorizedApiClient>>);

    render(
      <AppEditTokenManager
        slug="demo"
        keycloak={keycloak}
        onTransferOwner={onTransferOwner}
        projectOwnerId="owner-id"
      />
    );

    const tokenHeading = await screen.findByRole("heading", {
      name: "API Token",
    });
    const transferHeading = screen.getByRole("heading", {
      name: "Transfer ownership",
    });
    expect(
      tokenHeading.compareDocumentPosition(transferHeading) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();

    await user.type(
      screen.getByRole("textbox", { name: /new owner/i }),
      "new-owner-id"
    );
    await user.click(screen.getByRole("button", { name: /^transfer$/i }));
    const dialog = screen.getByRole("dialog", {
      name: "Transfer this project?",
    });
    await user.click(
      within(dialog).getByRole("button", { name: "Transfer project" })
    );
    expect(onTransferOwner).toHaveBeenCalledWith("new-owner-id");
  });
});
