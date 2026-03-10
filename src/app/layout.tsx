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
  title: "Bon Voyage!",
  description: "Map your next adventure with Bon Voyage. A minimalist and intuitive travel itinerary planner designed to help you visualize stops, choose transport modes, and organize your perfect journey effortlessly.",
  keywords: ["travel planner", "itinerary builder", "trip organizer", "voyage", "interactive map", "route planner"],
  authors: [{ name: "PW486" }],
  icons: {
    icon: "/voyage/favicon.png",
    shortcut: "/voyage/favicon.png",
    apple: "/voyage/apple-icon.png",
  },
  appleWebApp: {
    title: "Voyage",
    statusBarStyle: "black-translucent",
    capable: true,
  },
  themeColor: "#ffffff",
  openGraph: {
    title: "Bon Voyage!",
    description: "Map your next adventure with Bon Voyage. A minimalist and intuitive travel itinerary planner designed to help you visualize stops, choose transport modes, and organize your perfect journey effortlessly.",
    type: "website",
    siteName: "Bon Voyage!",
    images: ["/voyage/opengraph-image.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Bon Voyage!",
    description: "Map your next adventure with Bon Voyage. A minimalist and intuitive travel itinerary planner designed to help you visualize stops, choose transport modes, and organize your perfect journey effortlessly.",
    images: ["/voyage/opengraph-image.png"],
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
