import React from "react";

const Footer: React.FC = () => {
  const year = new Date().getFullYear();
  return (
    <footer className="footer footer-center bg-base-200 border-t border-base-300 mt-16 p-8 text-base-content">
      <div>
        <div className="mb-4 flex gap-4 flex-wrap justify-center">
          <a
            href="https://github.com/BadgeHubCrew/badgehub-app/blob/main/README.md"
            target="_blank"
            className="link link-hover text-sm"
          >
            About
          </a>
          <a
            href="https://github.com/badgehubcrew/badgehub-app/issues"
            target="_blank"
            className="link link-hover text-sm"
          >
            Contact
          </a>
          <a
            href="https://github.com/badgehubcrew"
            target="_blank"
            rel="noopener noreferrer"
            className="link link-hover text-sm"
          >
            GitHub
          </a>
        </div>
        <p className="text-sm font-mono">
          &copy; {year} BadgeHub. All rights reserved.
        </p>
        <p className="text-xs opacity-50 mt-2">
          Designed for makers, by makers.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
