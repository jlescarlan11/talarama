// app/ThemeWrapper.tsx
"use client";

import { ThemeProvider } from "next-themes";
import { ReactNode, useEffect, useState } from "react";

export default function ThemeWrapper({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <ThemeProvider
      attribute="class" // or "data-theme"
      defaultTheme="system"
      enableSystem
    >
      {children}
    </ThemeProvider>
  );
}
