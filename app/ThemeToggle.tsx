"use client";

import { useEffect, useState } from "react";

const ThemeToggle = () => {
  const [currentTheme, setCurrentTheme] = useState("light");
  const [mounted, setMounted] = useState(false);

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const theme = savedTheme || "light";
    setCurrentTheme(theme);
    document.documentElement.setAttribute("data-theme", theme);
    setMounted(true);
  }, []);

  // Update localStorage and HTML attribute when theme changes
  const toggleTheme = () => {
    const newTheme = currentTheme === "light" ? "dark" : "light";
    setCurrentTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
  };

  if (!mounted) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm">Dark Mode</span>
        <div className="w-12 h-6 bg-base-200 rounded-full"></div>
      </div>
    );
  }

  return (
    <label className="label cursor-pointer gap-2">
      <span className="label-text">Dark Mode</span>
      <input
        type="checkbox"
        className="toggle"
        checked={currentTheme === "dark"}
        onChange={toggleTheme}
      />
    </label>
  );
};

export default ThemeToggle;
