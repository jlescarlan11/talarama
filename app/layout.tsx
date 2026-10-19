import "./globals.css";

import NavBar from "./NavBar";
import AuthProvider from "./auth/Provider";
import { ThemeProvider } from "./providers/ThemeProvider";
import Footer from "./components/Footer";



export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata = {
  title: "Talarama",
  description: "Discover films, keep a private viewing diary and choose which reviews to share with the community.",
  keywords: ["movies", "diary", "personal", "watchlist", "reviews"],
  authors: [{ name: "Talarama Team" }],
  robots: "index, follow",
  openGraph: {
    type: "website",
    locale: "en_US",

    title: "Talarama - Your Personal Movie Diary",
    description: "Track, review, and discover movies with your personal movie diary",
    siteName: "Talarama",
  },
  twitter: {
    card: "summary",
    title: "Talarama - Your Personal Movie Diary",
    description: "Track, review, and discover movies with your personal movie diary",
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen flex flex-col antialiased font-sans">
        <a href="#main-content" className="skip-link">Skip to content</a>
        <ThemeProvider>
          <AuthProvider>
            <NavBar />
            {process.env.TALARAMA_LOCAL_PREVIEW === '1' && <p role="status" className="text-center text-sm bg-base-200 text-base-content py-2 px-4">Local preview · 24 invented sample films · live TMDB and Google sign-in are not connected.</p>}
            <main id="main-content" tabIndex={-1} className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 flex-grow">
              <div className="max-w-[var(--container-max-width)] mx-auto">
                {children}
              </div>
            </main>
            <Footer />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
