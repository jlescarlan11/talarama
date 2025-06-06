"use client";

import Image from "next/image";
import AppLogoLight from "../public/appLogoLight.png";
import AppLogoDark from "../public/appLogoDark.png";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

const Logo = () => {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // During SSR and initial client render, use a script to detect system theme
  if (!mounted) {
    return (
      <>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                document.documentElement.classList.toggle('dark', isDark);
              } catch (e) {}
            `,
          }}
        />
        <div className="flex items-center">
          <Image
            src={AppLogoDark}
            alt="Talarama - Your Personal Movie Diary"
            width={100}
            height={50}
            priority
            className="w-auto h-6 sm:h-8 dark:block hidden"
          />
          <Image
            src={AppLogoLight}
            alt="Talarama - Your Personal Movie Diary"
            width={100}
            height={50}
            priority
            className="w-auto h-6 sm:h-8 block dark:hidden"
          />
        </div>
      </>
    );
  }

  return (
    <div className="flex items-center">
      <Image
        src={resolvedTheme === "dark" ? AppLogoDark : AppLogoLight}
        alt="Talarama - Your Personal Movie Diary"
        width={100}
        height={50}
        priority
        className="w-auto h-6 sm:h-8"
      />
    </div>
  );
};

export default Logo;
