import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "HotelFlow | Workforce Manager",
  description: "Hotel employee attendance and salary ledger management.",
  applicationName: "HotelFlow",
  manifest: "/manifest.webmanifest",
  themeColor: "#090909",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "HotelFlow" },
  icons: { icon: [{ url: "/icon-192.svg", sizes: "192x192", type: "image/svg+xml" }, { url: "/icon-512.svg", sizes: "512x512", type: "image/svg+xml" }], apple: "/icon-192.svg" },
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
