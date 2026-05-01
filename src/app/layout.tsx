import type { Metadata } from "next";
import { Space_Grotesk, Outfit } from "next/font/google";
import "./globals.css";
import "../styles/colors.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import CookieBanner from "../components/CookieBanner";
import { NotificationProvider } from "../context/NotificationContext";
import { AuthProvider } from "../context/AuthContext";
import { Toaster } from 'react-hot-toast';
import AnalyticsTracker from "../components/AnalyticsTracker";
import { Suspense } from "react";

// Force all pages to be dynamically rendered (SSR)
// This is needed because the app uses real-time features and authentication
export const dynamic = 'force-dynamic';

const spaceGrotesk = Space_Grotesk({ 
  subsets: ["latin"],
  variable: '--font-space-grotesk',
});

const outfit = Outfit({ 
  subsets: ["latin"],
  variable: '--font-outfit',
});

const themeInitScript = `
(() => {
  const storageKey = 'theme';
  const root = document.documentElement;
  const isTheme = (value) => value === 'light' || value === 'dark';

  let savedTheme = null;

  try {
    savedTheme = window.localStorage.getItem(storageKey);
  } catch {
    savedTheme = null;
  }

  const prefersDark = typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const theme = isTheme(savedTheme) ? savedTheme : (prefersDark ? 'dark' : 'light');

  root.classList.remove('light', 'dark');
  root.classList.add(theme);
  root.style.colorScheme = theme;
})();
`;

export const metadata: Metadata = {
  metadataBase: new URL('https://skillogue.com'),
  title: {
    default: "Skillogue - Connect by Passion",
    template: "%s | Skillogue"
  },
  description: "Skillogue is the premier platform to connect with people who share your passions and skills. Join today to find your community.",
  keywords: ["passions", "skills", "community", "social network", "connect"],
  authors: [{ name: "Skillogue Team" }],
  openGraph: {
    title: "Skillogue - Connect by Passion",
    description: "Connect with people who share your passions and skills.",
    url: "https://skillogue.com",
    siteName: "Skillogue",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Skillogue - Connect by Passion",
    description: "Connect with people who share your passions and skills.",
    images: ["/og-image.jpg"],
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/logo192.png',
  },
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${spaceGrotesk.variable} ${outfit.variable}`}>
      <body className="font-sans bg-background text-text flex flex-col min-h-screen selection:bg-primary selection:text-white">
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <div className="gradient-mesh" aria-hidden="true" />
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:z-[200] focus:left-2 focus:top-2 focus:rounded-xl focus:bg-brand focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
        >
          Skip to main content
        </a>
        <Suspense fallback={null}>
          <AuthProvider>
            <NotificationProvider>
            <Suspense fallback={null}>
              <AnalyticsTracker />
            </Suspense>
            <Navbar />
            <main id="main-content" className="flex-grow flex flex-col">
              {children}
            </main>
            <Footer />
            <CookieBanner />
            <Toaster position="top-right" />
          </NotificationProvider>
          </AuthProvider>
        </Suspense>
      </body>
    </html>
  );
}
