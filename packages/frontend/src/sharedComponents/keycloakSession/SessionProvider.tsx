import {
  BADGEHUB_FRONTEND_BASE_URL,
  KEYCLOAK_BASE_URL,
  KEYCLOAK_CLIENT_ID,
  KEYCLOAK_REALM,
} from "@config.ts";
import {
  SessionContext,
  type SessionStatus,
  type User,
} from "@sharedComponents/keycloakSession/SessionContext.tsx";
import Keycloak from "keycloak-js";
import { useEffect, useRef, useState } from "react";

function userFromToken(kc: Keycloak): User | undefined {
  if (!kc.authenticated || !kc.tokenParsed) {
    return undefined;
  }
  return {
    name: kc.tokenParsed.name || kc.tokenParsed.preferred_username || "User",
    email: kc.tokenParsed.email || "",
    id: kc.tokenParsed.sub || "",
  };
}

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | undefined>(undefined);
  const [keycloak, setKeycloak] = useState<Keycloak | undefined>(undefined);
  const [status, setStatus] = useState<SessionStatus>("loading");
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const kc = new Keycloak({
      url: KEYCLOAK_BASE_URL,
      realm: KEYCLOAK_REALM,
      clientId: KEYCLOAK_CLIENT_ID,
    });

    kc.init({
      onLoad: "check-sso",
      pkceMethod: "S256",
      silentCheckSsoRedirectUri: `${BADGEHUB_FRONTEND_BASE_URL}/silent-check-sso.html`,
    })
      .then(() => {
        const nextUser = userFromToken(kc);
        setUser(nextUser);
        setStatus(nextUser?.id ? "authenticated" : "anonymous");
      })
      .catch((error) => {
        console.error("Keycloak initialization failed:", error);
        setUser(undefined);
        setStatus("anonymous");
      })
      .finally(() => {
        setKeycloak(kc);
      });
  }, []);

  // Token refresh logic
  useEffect(() => {
    if (!keycloak?.authenticated) return;

    // Set up token expiration handler
    keycloak.onTokenExpired = async () => {
      try {
        const refreshed = await keycloak.updateToken(5);
        if (refreshed) {
          setUser((prevUser) =>
            prevUser
              ? {
                  ...prevUser,
                }
              : undefined
          );
        }
      } catch (error) {
        console.error("Session expired, redirecting to login", error);
        setUser(undefined);
        setStatus("anonymous");
        keycloak.login();
      }
    };

    return () => {
      keycloak.onTokenExpired = undefined;
    };
  }, [keycloak]);

  return (
    <SessionContext value={{ user, keycloak, status }}>
      {children}
    </SessionContext>
  );
};
