import React, { useEffect, useRef, useState } from "react";

const THEMES = [
  "badgehub",
  "dark",
  "light",
  "dracula",
  "synthwave",
  "cyberpunk",
  "nord",
  "forest",
  "aqua",
  "luxury",
  "coffee",
];

const ThemeSwatches: React.FC<{ theme: string }> = ({ theme }) => (
  <span data-theme={theme} className="flex shrink-0 overflow-hidden rounded">
    <span className="w-2 h-4 bg-primary" />
    <span className="w-2 h-4 bg-secondary" />
    <span className="w-2 h-4 bg-accent" />
    <span className="w-2 h-4 bg-neutral" />
  </span>
);

const ThemePicker: React.FC = () => {
  const [theme, setTheme] = useState(
    () => localStorage.getItem("theme") ?? "dark"
  );
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        className="btn btn-ghost btn-sm gap-1.5"
        onClick={() => setOpen((v) => !v)}
        aria-label="Select theme"
        aria-expanded={open}
      >
        {/* Palette icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
          />
        </svg>
        <span className="capitalize max-w-16 truncate">{theme}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-3 w-3 opacity-60 shrink-0"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 bg-base-200 border border-base-300 rounded-box shadow-lg w-44 max-h-72 overflow-y-auto">
          {THEMES.map((t) => (
            <button
              key={t}
              className={`flex items-center justify-between w-full px-3 py-2 text-sm hover:bg-base-300 transition-colors gap-2${theme === t ? " text-primary font-semibold" : ""}`}
              onClick={() => {
                setTheme(t);
                setOpen(false);
              }}
            >
              <span className="capitalize truncate">{t}</span>
              <ThemeSwatches theme={t} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ThemePicker;
