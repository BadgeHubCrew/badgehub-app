import React, { useEffect, useRef, useState } from "react";

import { useSession } from "@sharedComponents/keycloakSession/SessionContext.tsx";

// --- ProfileIcon ---
const ProfileIcon: React.FC = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { user, keycloak } = useSession();

  async function login() {
    await keycloak?.login();
  }

  async function logout() {
    await keycloak?.logout();
  }

  async function account() {
    await keycloak?.accountManagement()
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
      <div className="inline-block align-top p-2 pr-3">{user?.name}</div>
      <button
        className="btn btn-ghost btn-circle"
        aria-label="Profile"
        onClick={() => setMenuOpen((v) => !v)}
        data-testid="profile-icon"
      >
        <svg
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
      </button>
      {menuOpen && (
        <ul className="absolute right-0 mt-2 w-48 menu menu-sm bg-base-200 border border-base-300 rounded-box shadow-lg z-50 p-2">
          {user ? (
            <>
              <li className="menu-title">
                <span>{user.name}</span>
                <span className="text-xs opacity-60">{user.email}</span>
              </li>
              <li>
                <button onClick={account} data-testid="logout-button">Account</button>
              </li>
              <li>
                <button onClick={logout} data-testid="logout-button">Logout</button>
              </li>
            </>
          ) : (
            <li>
              <button onClick={login} data-testid="login-button">Login / Register</button>
            </li>
          )}
        </ul>
      )}
    </div>
  );
};

export default ProfileIcon;
