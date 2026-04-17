import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Lobster_Two } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const lobsterTwo = Lobster_Two({
  variable: "--font-lobster-two",
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://pw486.github.io"),
  title: "Bon Voyage!",
  description: "Map your next adventure with Bon Voyage. A minimalist and intuitive travel itinerary planner designed to help you visualize stops, choose transport modes, and organize your perfect journey effortlessly.",
  keywords: ["travel planner", "itinerary builder", "trip organizer", "voyage", "interactive map", "route planner"],
  authors: [{ name: "PW486" }],
  appleWebApp: {
    title: "Voyage",
    statusBarStyle: "black-translucent",
    capable: true,
  },
  openGraph: {
    title: "Bon Voyage!",
    description: "Map your next adventure with Bon Voyage. A minimalist and intuitive travel itinerary planner designed to help you visualize stops, choose transport modes, and organize your perfect journey effortlessly.",
    type: "website",
    siteName: "Bon Voyage!",
  },
  twitter: {
    card: "summary_large_image",
    title: "Bon Voyage!",
    description: "Map your next adventure with Bon Voyage. A minimalist and intuitive travel itinerary planner designed to help you visualize stops, choose transport modes, and organize your perfect journey effortlessly.",
  },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
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
        className={`${geistSans.variable} ${geistMono.variable} ${lobsterTwo.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
