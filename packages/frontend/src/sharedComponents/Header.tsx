import React, { useState } from "react";
import { BadgeHubIcon } from "@sharedComponents/BadgeHubIcon.tsx";
import ProfileIcon from "@sharedComponents/ProfileIcon";
import { MLink } from "@sharedComponents/MLink.tsx";
import ThemePicker from "@sharedComponents/ThemePicker.tsx";

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
    <div className="relative hidden lg:block">
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
    <header className="navbar bg-base-200 shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between w-full min-h-16">
        <MLink
          to="/"
          className="btn btn-ghost text-xl font-semibold text-primary flex items-center gap-2 flex-shrink-0"
        >
          <BadgeHubIcon />
          <span>BadgeHub</span>
        </MLink>

        <nav className="hidden md:flex gap-1 items-center">
          {navLinks.map((link) => (
            <MLink
              to={link.to}
              external={link.external}
              key={link.label}
              data-testid={"Header/Link/" + link.testId}
              className={
                (link.to.endsWith("/todo") ? "todoElement " : "") +
                "text-base-content/70 hover:bg-base-300 hover:text-base-content px-3 py-2 rounded-md text-sm font-medium transition-colors text-center"
              }
            >
              {link.label}
            </MLink>
          ))}
        </nav>

        <div className="flex items-center gap-3 flex-shrink-0">
          {checkedSearchProps && (
            <SearchField {...checkedSearchProps} />
          )}
          <div className="hidden md:block">
            <ThemePicker />
          </div>
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
          <div className="divider my-1" />
          <div className="px-2 pb-1">
            <ThemePicker />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
