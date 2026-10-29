import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import localFont from 'next/font/local';
import { headers } from 'next/headers';
import { Header } from '@repo/ui';
import { Footer } from '@/components/Footer';
import { siteConfigNetworkMap } from '@/lib/siteConfigDomainMap';
import './globals.css';

// Brands that ship a white wordmark at public/logos/<brand>/white.svg. Others
// (e.g. acorn) have no asset yet and render the site name as text instead.
const BRANDS_WITH_LOGO = new Set(['amcplus', 'shudder', 'sundancenow', 'wetv']);

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

// AMC+ brand font — self-hosted Endurance Pro (licensed, not on Google Fonts).
// Only Light/Regular/Black upright cuts exist, so `font-bold` (700) has no
// matching upright face; CSS weight-matching resolves it up to Black (900).
// Likewise `font-medium` (500) resolves down to Regular (400). The condensed
// cuts are a separate width family and intentionally left out.
const endurancePro = localFont({
  src: [
    {
      path: './sites/amcplus/EndurancePro/EndurancePro.woff2',
      weight: '400',
      style: 'normal',
    },
  ],
  variable: '--font-endurance',
  display: 'swap',
});

// Endurance Pro's Bold cut as its own family (registered at normal weight), so
// "bold" text swaps to this family instead of relying on CSS weight-matching.
const enduranceBold = localFont({
  src: [
    {
      path: './sites/amcplus/EndurancePro/Endurance-Bold.woff',
      weight: '400',
      style: 'normal',
    },
  ],
  variable: '--font-endurance-bold',
  display: 'swap',
});

// Title comes from the per-brand site config (siteConfigDomainMap), resolved
// from the brand the middleware set on `x-network-path`.
export async function generateMetadata(): Promise<Metadata> {
  const networkPath = (await headers()).get('x-network-path') ?? '';
  const config = siteConfigNetworkMap[networkPath];
  return {
    title: config?.title ?? 'Reimagined Memory',
    description: 'A Turborepo monorepo with Next.js, a UI library, and utils.',
  };
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // The subsite being served, set by middleware. <Footer> reads the same
  // header itself to fetch its own menus.
  const networkPath = (await headers()).get('x-network-path');

  // Brand wordmark for the header. The site config `title` is an SEO string
  // (e.g. "AMC+ | Premium Streaming Service | …"), so take the part before the
  // first "|" as the short name; fall back to the metadata default. It doubles
  // as the logo's alt text.
  const siteConfig = siteConfigNetworkMap[networkPath ?? ''];
  const siteName =
    siteConfig?.title.split('|')[0]?.trim() || 'Reimagined Memory';

  // Brand logo lives at public/logos/<brand>/white.svg. Only the brands that
  // ship one get a logo; the rest fall back to the site-name text in <Header>.
  const logoSrc =
    networkPath && BRANDS_WITH_LOGO.has(networkPath)
      ? `/logos/${networkPath}/white.svg`
      : undefined;

  return (
    <html
      lang="en"
      // Brand scope for the whole document (set by middleware via
      // `x-network-path`). Hoisted to <html> so the [data-brand] token
      // overrides in colors.css — including the Endurance Pro brand font —
      // cover the header and footer too, not just the page <main>. The
      // unbranded default site has no networkPath, so no attribute is set and
      // the base tokens apply as-is.
      data-brand={networkPath || undefined}
      className={`${inter.variable} ${endurancePro.variable} ${enduranceBold.variable}`}
    >
      <body className="flex min-h-screen flex-col bg-black text-gray-50 antialiased">
        <Header siteName={siteName} logoSrc={logoSrc} href="/" />
        {/* grow pushes the footer to the bottom of the viewport when the page
            content is short, while still letting it flow when content overflows. */}
        <main className="mx-auto w-full max-w-7xl grow shadow-2xl shadow-border-default">
          {children}
        </main>
        {/* Fetches both footer layers itself (see components/Footer.tsx). */}
        <Footer />
      </body>
    </html>
  );
}
