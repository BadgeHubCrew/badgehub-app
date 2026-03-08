import React, { useEffect, useState } from "react";

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

const ThemePicker: React.FC = () => {
  const [theme, setTheme] = useState(
    () => localStorage.getItem("theme") ?? "dark"
  );

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  return (
    <select
      className="select select-sm"
      value={theme}
      onChange={(e) => setTheme(e.target.value)}
      aria-label="Select theme"
    >
      {THEMES.map((t) => (
        <option key={t} value={t}>
          {t}
        </option>
      ))}
    </select>
  );
};

export default ThemePicker;
