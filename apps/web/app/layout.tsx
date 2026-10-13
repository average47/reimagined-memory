import type { Metadata } from "next";
import { Inter } from "next/font/google";
import localFont from "next/font/local";
import { headers } from "next/headers";
import { Footer } from "@/components/Footer";
import { getMenu, tenantForNetworkPath } from "@/lib/wordpress";
import type { MenuItemNode } from "@/lib/wordpress.types";
import { siteConfigNetworkMap } from "@/lib/siteConfigDomainMap";
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

// Endurance Pro's Black cut as its own family (normal weight), so "bold" text
// can swap to this family instead of relying on weight-matching 700 → 900.
const enduranceBlack = localFont({
  src: [
    {
      path: "./sites/amcplus/EndurancePro/EndurancePro-Black.woff2",
      weight: "400",
      style: "normal",
    },
  ],
  variable: "--font-endurance-black",
  display: "swap",
});

// Title comes from the per-brand site config (siteConfigDomainMap), resolved
// from the brand the middleware set on `x-network-path`.
export async function generateMetadata(): Promise<Metadata> {
  const networkPath = (await headers()).get("x-network-path") ?? "";
  const config = siteConfigNetworkMap[networkPath];
  return {
    title: config?.title ?? "Reimagined Memory",
    description: "A Turborepo monorepo with Next.js, a UI library, and utils.",
  };
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Resolve the tenant from middleware's header, then fetch its footer menu.
  const networkPath = (await headers()).get("x-network-path");
  const tenant = tenantForNetworkPath(networkPath);

  let footerMenu: MenuItemNode[] = [];
  try {
    footerMenu = await getMenu(tenant, "FOOTER");
  } catch {
    // CMS unavailable — leave the menu empty.
  }

  return (
    <html
      lang="en"
      className={`${inter.variable} ${endurancePro.variable} ${enduranceBlack.variable}`}
    >
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased dark:bg-gray-950 dark:text-gray-50">
        {children}
        <Footer items={footerMenu} />
      </body>
    </html>
  );
}
