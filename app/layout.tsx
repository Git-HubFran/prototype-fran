import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Contract Review Prototype",
  description: "Summarize a contract and ask questions about it. Not legal advice.",
  // Keep this experimental prototype out of search indexes.
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-paper font-sans text-ink-text antialiased">{children}</body>
    </html>
  );
}
