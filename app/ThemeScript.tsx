"use client";

import { useEffect } from "react";

const ThemeScript = () => {
  useEffect(() => {
    const theme = localStorage.getItem("theme") || "dark";
    document.documentElement.setAttribute("data-theme", theme);
  }, []);

  return null;
};

export default ThemeScript; 