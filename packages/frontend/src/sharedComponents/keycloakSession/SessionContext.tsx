import type Keycloak from "keycloak-js";
import React, { use } from "react";

export interface User {
  name: string;
  email: string;
  id: string;
}

/** Session lifecycle for distinguishing SSO check vs logged-out. */
export type SessionStatus = "loading" | "authenticated" | "anonymous";

interface SessionContextType {
  user?: User;
  keycloak?: Keycloak;
  status: SessionStatus;
}

export const SessionContext = React.createContext<SessionContextType>({
  status: "loading",
});
export const useSession = () => use(SessionContext);
