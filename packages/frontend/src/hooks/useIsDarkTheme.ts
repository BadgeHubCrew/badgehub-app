import { useEffect, useState } from "react";

export function useIsDarkTheme() {
  const [isDark, setIsDark] = useState(
    () => getComputedStyle(document.documentElement).colorScheme === "dark"
  );
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(
        getComputedStyle(document.documentElement).colorScheme === "dark"
      );
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => observer.disconnect();
  }, []);
  return isDark;
}
