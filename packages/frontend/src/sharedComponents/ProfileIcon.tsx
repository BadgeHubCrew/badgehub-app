import { useSession } from "@sharedComponents/keycloakSession/SessionContext.tsx";
import type React from "react";
import { useEffect, useRef, useState } from "react";

// --- ProfileIcon ---
const ProfileIcon: React.FC = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { user, keycloak, status } = useSession();
  const sessionReady = status !== "loading";

  async function login() {
    await keycloak?.login();
  }

  async function logout() {
    await keycloak?.logout();
  }

  async function account() {
    await keycloak?.accountManagement();
  }

  // Close menu on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpen]);

  return (
    <div className="relative" ref={menuRef}>
      <div className="hidden md:inline-block align-top p-2 pr-3">
        {sessionReady ? user?.name : null}
      </div>
      <button
        type="button"
        className="btn btn-ghost btn-circle relative"
        aria-label="Profile"
        aria-busy={!sessionReady}
        onClick={() => sessionReady && setMenuOpen((v) => !v)}
        disabled={!sessionReady}
        data-testid="profile-icon"
      >
        {!sessionReady ? (
          <span
            className="loading loading-spinner loading-sm"
            data-testid="profile-session-loading"
          />
        ) : (
          <>
            {user && (
              <span
                className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-success ring-2 ring-base-200"
                title="Logged in"
              />
            )}
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </>
        )}
      </button>
      {menuOpen && sessionReady && (
        <ul className="absolute right-0 mt-2 w-48 menu menu-sm bg-base-200 border border-base-300 rounded-box shadow-lg z-50 p-2">
          {user ? (
            <>
              <li className="menu-title">
                <span>{user.name}</span>
                <span className="text-xs opacity-60">{user.email}</span>
              </li>
              <li>
                <button
                  type="button"
                  onClick={account}
                  data-testid="account-button"
                >
                  Account
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={logout}
                  data-testid="logout-button"
                >
                  Logout
                </button>
              </li>
            </>
          ) : (
            <li>
              <button type="button" onClick={login} data-testid="login-button">
                Login / Register
              </button>
            </li>
          )}
        </ul>
      )}
    </div>
  );
};

export default ProfileIcon;
