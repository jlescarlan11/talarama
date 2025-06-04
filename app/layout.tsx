import "@radix-ui/themes/styles.css";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import NavBar from "./NavBar";
import AuthProvider from "./auth/Provider";
import ThemeScript from "./ThemeScript";
import ClientErrorBoundary from "./components/ClientErrorBoundary";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Talarama - Your Movie Diary",
  description: "Track and discover movies with Talarama - your personal movie diary and discovery platform",
  keywords: ["movies", "diary", "tracking", "discovery", "film", "cinema"],
  authors: [{ name: "Talarama Team" }],
  viewport: "width=device-width, initial-scale=1",
  robots: "index, follow",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://talarama.com",
    title: "Talarama - Your Movie Diary",
    description: "Track and discover movies with Talarama - your personal movie diary and discovery platform",
    siteName: "Talarama",
  },
  twitter: {
    card: "summary_large_image",
    title: "Talarama - Your Movie Diary",
    description: "Track and discover movies with Talarama - your personal movie diary and discovery platform",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning data-theme="light">
      <head>
        <ThemeScript />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        <AuthProvider>
          <ClientErrorBoundary>
            <NavBar />
            <main className="flex-grow">
              <div className="container max-w-7xl mx-auto p-4">{children}</div>
            </main>
          </ClientErrorBoundary>
        </AuthProvider>
      </body>
    </html>
  );
}
