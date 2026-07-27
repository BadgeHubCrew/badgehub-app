import { useSession } from "@sharedComponents/keycloakSession/SessionContext.tsx";
import { PleaseLoginMessage } from "@sharedComponents/PleaseLoginMessage.tsx";
import Spinner from "@sharedComponents/Spinner.tsx";
import type React from "react";

/**
 * Gates private content on session readiness.
 * - loading: SSO check in progress (spinner, not a login prompt)
 * - anonymous: show login message
 * - authenticated: render children
 */
export const AuthGate: React.FC<{
  children: React.ReactNode;
  /** Phrase for PleaseLoginMessage, e.g. "see your projects" */
  whatToSee: string;
  loadingFallback?: React.ReactNode;
  loginFallback?: React.ReactNode;
}> = ({ children, whatToSee, loadingFallback, loginFallback }) => {
  const { status } = useSession();

  if (status === "loading") {
    return <>{loadingFallback ?? <Spinner />}</>;
  }

  if (status === "anonymous") {
    return <>{loginFallback ?? <PleaseLoginMessage whatToSee={whatToSee} />}</>;
  }

  return <>{children}</>;
};
