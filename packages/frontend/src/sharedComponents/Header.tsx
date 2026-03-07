import React, { useState } from "react";
import { BadgeHubIcon } from "@sharedComponents/BadgeHubIcon.tsx";
import ProfileIcon from "@sharedComponents/ProfileIcon";
import { MLink } from "@sharedComponents/MLink.tsx";

const navLinks = [
  { label: "Browse Projects", to: "/", testId: "BrowseProjects" },
  {
    label: "Create Project",
    to: "/page/create-project",
    testId: "CreateProject",
  },
  {
    label: "My Projects",
    to: "/page/my-projects",
    testId: "MyProjects",
  },
  {
    label: "API Docs",
    to: "/api-docs",
    external: true,
    testId: "APIDocs",
  },
];

type SearchProps = {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
};

const SearchField: React.FC<SearchProps> = ({
  searchQuery,
  setSearchQuery,
}) => {
  return (
    <div className="relative hidden sm:block">
      <input
        type="search"
        placeholder="Search apps..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        data-testid="search-bar"
        className="input input-bordered input-sm w-48"
      />
    </div>
  );
};

const Header: React.FC<Partial<SearchProps>> = (searchProps) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const searchEnabled =
    searchProps.searchQuery !== undefined &&
    searchProps.setSearchQuery !== undefined;
  const checkedSearchProps: SearchProps | undefined = searchEnabled
    ? (searchProps as SearchProps)
    : undefined;

  return (
    <header className="navbar bg-base-200 shadow-md sticky top-0 z-50 px-4">
      <div className="navbar-start">
        <MLink
          to="/"
          className="btn btn-ghost text-xl font-semibold text-primary flex items-center gap-2"
        >
          <BadgeHubIcon />
          <span>BadgeHub</span>
        </MLink>
      </div>

      <div className="navbar-center hidden md:flex">
        <nav className="flex gap-1 items-center">
          {navLinks.map((link) => (
            <MLink
              to={link.to}
              external={link.external}
              key={link.label}
              data-testid={"Header/Link/" + link.testId}
              className={
                (link.to.endsWith("/todo") ? "todoElement " : "") +
                "btn btn-ghost btn-sm"
              }
            >
              {link.label}
            </MLink>
          ))}
        </nav>
      </div>

      <div className="navbar-end flex items-center gap-3">
        {checkedSearchProps && (
          <SearchField {...checkedSearchProps} />
        )}
        <ProfileIcon />
        <div className="md:hidden">
          <button
            id="mobile-menu-button"
            className="btn btn-ghost btn-sm"
            aria-label="Open main menu"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((v) => !v)}
          >
            <span className="sr-only">Open main menu</span>
            <svg
              className={`${mobileOpen ? "hidden" : "block"} h-6 w-6`}
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
            <svg
              className={`${mobileOpen ? "block" : "hidden"} h-6 w-6`}
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        className={`md:hidden absolute top-full left-0 right-0 bg-base-200 shadow-md${mobileOpen ? "" : " hidden"}`}
        id="mobile-menu"
      >
        <div className="flex flex-col p-2">
          {navLinks.map((link) => (
            <MLink
              to={link.to}
              external={link.external}
              key={link.label}
              className="btn btn-ghost btn-sm justify-start"
            >
              {link.label}
            </MLink>
          ))}
        </div>
      </div>
    </header>
  );
};

export default Header;
