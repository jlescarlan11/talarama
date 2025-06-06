import "./globals.css";
import { Inter } from "next/font/google";
import NavBar from "./NavBar";
import AuthProvider from "./auth/Provider";
import { ThemeProvider } from "./providers/ThemeProvider";
import Footer from "./components/Footer";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Talarama",
  description: "Your personal movie diary",
  keywords: ["movies", "diary", "personal", "watchlist", "reviews"],
  authors: [{ name: "Talarama Team" }],
  viewport: "width=device-width, initial-scale=1, maximum-scale=5",
  robots: "index, follow",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://talarama.com",
    title: "Talarama - Your Personal Movie Diary",
    description: "Track, review, and discover movies with your personal movie diary",
    siteName: "Talarama",
  },
  twitter: {
    card: "summary_large_image",
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
      <body className={`${inter.className} min-h-screen flex flex-col antialiased`}>
        <ThemeProvider>
          <AuthProvider>
            <NavBar />
            <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 flex-grow">
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
