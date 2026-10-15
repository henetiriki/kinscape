import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "KinScape",
  description: "A map of South Africa from 1652 to today.",
  // NFR-03: nothing is indexed by search engines.
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
