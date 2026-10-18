import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "HotelFlow | Workforce Manager", description: "Hotel employee attendance and salary ledger management." };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
