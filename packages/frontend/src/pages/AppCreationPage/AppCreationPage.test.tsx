import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@__test__";
import { render as rtlRender } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import AppCreationPage from "./AppCreationPage.tsx";
import { SessionContext } from "@sharedComponents/keycloakSession/SessionContext.tsx";
import Keycloak from "keycloak-js";
import { getFreshAuthorizedTsRestClient } from "@api/tsRestClient.ts";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("@api/tsRestClient.ts", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@api/tsRestClient.ts")>();
  return {
    ...actual,
    getFreshAuthorizedTsRestClient: vi.fn(),
  };
});

const renderLoggedOut = () =>
  rtlRender(
    <MemoryRouter>
      <SessionContext
        value={{
          user: undefined,
          keycloak: { authenticated: false } as Keycloak,
        }}
      >
        <AppCreationPage />
      </SessionContext>
    </MemoryRouter>
  );

describe("AppCreationPage", () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    vi.mocked(getFreshAuthorizedTsRestClient).mockReset();
  });

  it("shows login message when user is not authenticated", () => {
    renderLoggedOut();
    expect(
      screen.getByText(/log in to create a project/i)
    ).toBeInTheDocument();
  });

  it("enables submit for valid slug values", async () => {
    const user = userEvent.setup();
    render(<AppCreationPage />);
    const input = screen.getByTestId("app-creation-slug-input");
    const submit = screen.getByTestId("app-creation-submit-btn");

    await user.type(input, "abc");
    expect(input).toHaveValue("abc");
    expect(submit).toBeEnabled();
  });

  it("submits and navigates on success", async () => {
    const user = userEvent.setup();
    const createProject = vi.fn().mockResolvedValue({ status: 204 });
    vi.mocked(getFreshAuthorizedTsRestClient).mockResolvedValue({
      createProject,
    } as unknown as Awaited<ReturnType<typeof getFreshAuthorizedTsRestClient>>);

    render(<AppCreationPage />);
    await user.type(screen.getByTestId("app-creation-slug-input"), "my_app");
    await user.click(screen.getByTestId("app-creation-submit-btn"));

    expect(createProject).toHaveBeenCalledWith({
      params: { slug: "my_app" },
    });
    expect(mockNavigate).toHaveBeenCalledWith("/page/project/my_app/edit");
  });

  it("renders API error reason", async () => {
    const user = userEvent.setup();
    const createProject = vi.fn().mockResolvedValue({
      status: 400,
      body: { reason: "slug already exists" },
    });
    vi.mocked(getFreshAuthorizedTsRestClient).mockResolvedValue({
      createProject,
    } as unknown as Awaited<ReturnType<typeof getFreshAuthorizedTsRestClient>>);

    render(<AppCreationPage />);
    await user.type(screen.getByTestId("app-creation-slug-input"), "my_app");
    await user.click(screen.getByTestId("app-creation-submit-btn"));

    expect(
      await screen.findByText(/slug already exists/i)
    ).toBeInTheDocument();
  });
});
