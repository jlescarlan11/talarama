// components/ThemeToggle.tsx
"use client";

import { useEffect, useState } from "react";

const ThemeToggle = () => {
  "use client";
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    const isDarkTheme = saved === "dark";
    setIsDark(isDarkTheme);
    document.documentElement.setAttribute(
      "data-theme",
      isDarkTheme ? "dark" : "light"
    );
  }, []);

  const toggleTheme = () => {
    const newTheme = isDark ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
    setIsDark(!isDark);
  };

  return (
    <label className="label cursor-pointer gap-2">
      <span className="label-text">Dark Mode</span>
      <input
        type="checkbox"
        className="checkbox theme-controller"
        checked={isDark}
        onChange={toggleTheme}
      />
    </label>
  );
};

export default ThemeToggle;
