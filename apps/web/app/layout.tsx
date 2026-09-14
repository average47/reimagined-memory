import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Reimagined Memory",
  description: "A Turborepo monorepo with Next.js, a UI library, and utils.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased dark:bg-gray-950 dark:text-gray-50">
        {children}
      </body>
    </html>
  );
}
