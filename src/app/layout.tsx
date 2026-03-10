import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Bon Voyage",
  description: "Simple Travel Itinerary Planner",
  keywords: ["travel", "itinerary", "planner", "trip", "voyage", "map", "navigation"],
  authors: [{ name: "PW486" }],
  icons: {
    icon: "/favicon.png",
    apple: "/apple-icon.png",
  },
  appleWebApp: {
    title: "Voyage",
    statusBarStyle: "default",
    capable: true,
  },
  openGraph: {
    title: "Bon Voyage",
    description: "Simple Travel Itinerary Planner",
    type: "website",
    siteName: "Bon Voyage",
  },
  twitter: {
    card: "summary_large_image",
    title: "Bon Voyage",
    description: "Simple Travel Itinerary Planner",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
