import { SessionContext } from "@sharedComponents/keycloakSession/SessionContext.tsx";
import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type Keycloak from "keycloak-js";
import type React from "react";
import { MemoryRouter } from "react-router-dom";
import { vitest } from "vitest";

const TestSessionProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const session = {
    status: "authenticated" as const,
    user: {
      name: "Test User",
      email: "",
      id: "test-user-id",
      token: "test-token",
    },
    keycloak: {
      authenticated: true,
      token: "test-token",
      login: vitest.fn() as unknown,
      logout: vitest.fn() as unknown,
      updateToken: vitest.fn().mockResolvedValue(true) as unknown,
    } as Keycloak,
  };
  return <SessionContext value={session}> {children}</SessionContext>;
};

const RouterAndSession: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <MemoryRouter>
      <TestSessionProvider>{children};</TestSessionProvider>
    </MemoryRouter>
  );
};

const renderWithRouter = (ui: React.ReactNode, { route = "/" } = {}) => {
  window.history.pushState({}, "Test page", route);

  return {
    user: userEvent.setup(),
    ...render(ui, { wrapper: RouterAndSession }),
  };
};

// eslint-disable-next-line react-refresh/only-export-sharedComponents
export * from "@testing-library/react";
export { renderWithRouter as render };
