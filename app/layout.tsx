import { LanguageProvider } from "./components/LanguageProvider";
import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "MoryaEMP | Workforce Manager",
  description: "MoryaEMP hotel employee attendance and salary ledger management.",
  applicationName: "MoryaEMP",
  manifest: "/manifest.webmanifest",
  themeColor: "#090909",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "MoryaEMP" },
  icons: { icon: [{ url: "/icon-192.svg", sizes: "192x192", type: "image/svg+xml" }, { url: "/icon-512.svg", sizes: "512x512", type: "image/svg+xml" }], apple: "/icon-192.svg" },
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body><LanguageProvider>{children}</LanguageProvider></body></html>; }
