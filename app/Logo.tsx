"use client";

import Image from "next/image";
import AppLogoLight from "../public/appLogoLight.png";
import AppLogoDark from "../public/appLogoDark.png";
import { useEffect, useState } from "react";

const Logo = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check if user prefers dark mode
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    setIsDarkMode(mediaQuery.matches);

    // Listen for changes in the color scheme preference
    const handleChange = (e: MediaQueryListEvent) => {
      setIsDarkMode(e.matches);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  // During SSR and initial client render, show a placeholder
  if (!mounted) {
    return (
      <div className="flex items-center ">
        <Image
          src={AppLogoLight}
          alt="App Logo"
          width={100}
          height={50}
          priority
        />
      </div>
    );
  }

  return (
    <div className="flex items-center">
      <Image
        src={isDarkMode ? AppLogoDark : AppLogoLight}
        alt="App Logo"
        width={100}
        height={50}
        priority
      />
    </div>
  );
};

export default Logo;
