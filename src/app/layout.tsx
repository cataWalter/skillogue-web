import type { Metadata } from "next";
import { Space_Grotesk, Outfit } from "next/font/google";
import "./globals.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import CookieBanner from "../components/CookieBanner";
import { NotificationProvider } from "../context/NotificationContext";
import { Toaster } from 'react-hot-toast';

const spaceGrotesk = Space_Grotesk({ 
  subsets: ["latin"],
  variable: '--font-space-grotesk',
});

const outfit = Outfit({ 
  subsets: ["latin"],
  variable: '--font-outfit',
});

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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${outfit.variable}`}>
      <body className="font-sans bg-background text-text flex flex-col min-h-screen selection:bg-primary selection:text-white">
        <NotificationProvider>
          <Navbar />
          <main className="flex-grow flex flex-col">
            {children}
          </main>
          <Footer />
          <CookieBanner />
          <Toaster position="top-right" />
        </NotificationProvider>
      </body>
    </html>
  );
}
