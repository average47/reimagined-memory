import type { Metadata } from "next";
import { Inter, Oswald } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

// AMC+ brand font. Endurance Pro isn't on Google Fonts, so Oswald (a bold
// condensed sans) stands in; swap the family here to change the substitute.
const endurancePro = Oswald({
  subsets: ["latin"],
  variable: "--font-endurance",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Reimagined Memory",
  description: "A Turborepo monorepo with Next.js, a UI library, and utils.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${endurancePro.variable}`}>
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased dark:bg-gray-950 dark:text-gray-50">
        {children}
      </body>
    </html>
  );
}
