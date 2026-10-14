import type { Metadata } from "next";
import { Inter } from "next/font/google";
import localFont from "next/font/local";
import { headers } from "next/headers";
import { Header } from "@repo/ui";
import { Footer } from "@/components/Footer";
import { getMenu, tenantForNetworkPath } from "@/lib/wordpress";
import type { MenuItemNode } from "@/lib/wordpress.types";
import { siteConfigNetworkMap } from "@/lib/siteConfigDomainMap";
import "./globals.css";

// Brands that ship a white wordmark at public/logos/<brand>/white.svg. Others
// (e.g. acorn) have no asset yet and render the site name as text instead.
const BRANDS_WITH_LOGO = new Set([
  "amcplus",
  "shudder",
  "sundancenow",
  "wetv",
]);

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

  // Brand wordmark for the header. The site config `title` is an SEO string
  // (e.g. "AMC+ | Premium Streaming Service | …"), so take the part before the
  // first "|" as the short name; fall back to the metadata default. It doubles
  // as the logo's alt text.
  const siteConfig = siteConfigNetworkMap[networkPath ?? ""];
  const siteName =
    siteConfig?.title.split("|")[0]?.trim() || "Reimagined Memory";

  // Brand logo lives at public/logos/<brand>/white.svg. Only the brands that
  // ship one get a logo; the rest fall back to the site-name text in <Header>.
  const logoSrc =
    networkPath && BRANDS_WITH_LOGO.has(networkPath)
      ? `/logos/${networkPath}/white.svg`
      : undefined;

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
      <body className="flex min-h-screen flex-col bg-gray-50 text-gray-900 antialiased dark:bg-gray-950 dark:text-gray-50">
        <Header siteName={siteName} logoSrc={logoSrc} href="/" />
        {/* grow pushes the footer to the bottom of the viewport when the page
            content is short, while still letting it flow when content overflows. */}
        <main className="grow">{children}</main>
        <Footer items={footerMenu} />
      </body>
    </html>
  );
}
