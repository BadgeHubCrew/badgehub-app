import { SessionContext } from "@sharedComponents/keycloakSession/SessionContext.tsx";
import { render, screen } from "@testing-library/react";
import type Keycloak from "keycloak-js";
import { describe, expect, it } from "vitest";
import { AuthGate } from "./AuthGate.tsx";

describe("AuthGate", () => {
  it("shows a spinner while the session is loading", () => {
    render(
      <SessionContext value={{ status: "loading" }}>
        <AuthGate whatToSee="see your projects">
          <div data-testid="private-content">secret</div>
        </AuthGate>
      </SessionContext>
    );

    expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();
    expect(screen.queryByTestId("private-content")).not.toBeInTheDocument();
    expect(
      screen.queryByText(/log in to see your projects/i)
    ).not.toBeInTheDocument();
  });

  it("shows the login message when anonymous", () => {
    render(
      <SessionContext
        value={{
          status: "anonymous",
          keycloak: { authenticated: false } as Keycloak,
        }}
      >
        <AuthGate whatToSee="see your projects">
          <div data-testid="private-content">secret</div>
        </AuthGate>
      </SessionContext>
    );

    expect(
      screen.getByText(/log in to see your projects/i)
    ).toBeInTheDocument();
    expect(screen.queryByTestId("private-content")).not.toBeInTheDocument();
  });

  it("renders children when authenticated", () => {
    render(
      <SessionContext
        value={{
          status: "authenticated",
          user: { id: "u1", name: "Ada", email: "ada@example.com" },
          keycloak: { authenticated: true } as Keycloak,
        }}
      >
        <AuthGate whatToSee="see your projects">
          <div data-testid="private-content">secret</div>
        </AuthGate>
      </SessionContext>
    );

    expect(screen.getByTestId("private-content")).toBeInTheDocument();
  });
});
