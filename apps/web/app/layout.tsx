import type { Metadata } from "next";
import { Inter } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

// AMC+ brand font — self-hosted Endurance Pro (licensed, not on Google Fonts).
// Only Light/Regular/Black upright cuts exist, so `font-bold` (700) has no
// matching upright face; CSS weight-matching resolves it up to Black (900).
// Likewise `font-medium` (500) resolves down to Regular (400). The condensed
// cuts are a separate width family and intentionally left out.
const endurancePro = localFont({
  src: [
    {
      path: "./sites/amcplus/EndurancePro/EndurancePro-Light.woff2",
      weight: "300",
      style: "normal",
    },
    {
      path: "./sites/amcplus/EndurancePro/EndurancePro-LightItalic.woff2",
      weight: "300",
      style: "italic",
    },
    {
      path: "./sites/amcplus/EndurancePro/EndurancePro.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "./sites/amcplus/EndurancePro/EndurancePro-Italic.woff2",
      weight: "400",
      style: "italic",
    },
    {
      path: "./sites/amcplus/EndurancePro/EndurancePro-BoldItalic.woff2",
      weight: "700",
      style: "italic",
    },
    {
      path: "./sites/amcplus/EndurancePro/EndurancePro-Black.woff2",
      weight: "900",
      style: "normal",
    },
    {
      path: "./sites/amcplus/EndurancePro/EndurancePro-BlackItalic.woff2",
      weight: "900",
      style: "italic",
    },
  ],
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
